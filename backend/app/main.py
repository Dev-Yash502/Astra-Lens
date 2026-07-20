import os
import uuid
import base64
import shutil
import asyncio
import hashlib
import time
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import torch
import torch.nn.functional as F
import cv2

from typing import List

# Import modular components
from app.core.config import supabase, TEMP_FILES_DIR
from app.auth import get_current_user
from app.model import model, transform, device
from app.database import prune_old_scans
from app.gradcam import GradCAM, overlay_heatmap, GradCAMPlusPlus
from app.schemas import PredictResponse, HistoryItem

app = FastAPI(title="Astra Lens", description="Explainable AI Synthetic Image Classifier")

# Configure CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.admin import router as admin_router
from app.analytics import router as analytics_router

app.include_router(admin_router)
app.include_router(analytics_router)

from datetime import datetime

# In-memory user-specific prediction cache (Max 100 elements)
MAX_CACHE_SIZE = 100
prediction_cache = {}

from app.mock_db import MOCK_PREDICTIONS, MOCK_LOGINS, MOCK_SIGNUPS

def prune_local_mock_scans(max_scans: int = 50):
    global MOCK_PREDICTIONS
    if len(MOCK_PREDICTIONS) > max_scans:
        # Sort by created_at (oldest first)
        sorted_keys = sorted(MOCK_PREDICTIONS.keys(), key=lambda k: MOCK_PREDICTIONS[k]["created_at"])
        num_to_delete = len(sorted_keys) - max_scans
        for key in sorted_keys[:num_to_delete]:
            item = MOCK_PREDICTIONS.pop(key, None)
            if item:
                # Delete files locally
                for url in [item.get("image_url"), item.get("heatmap_url")]:
                    if url and "temp" in url:
                        filename = url.split("temp/")[-1]
                        file_path = os.path.join(TEMP_FILES_DIR, filename)
                        if os.path.exists(file_path):
                            try:
                                os.remove(file_path)
                            except Exception as e:
                                print(f"Error removing cached mock scan file: {e}")

# Helper to process a single image prediction
async def process_single_prediction(
    file: UploadFile,
    method: str,
    user
) -> dict:
    start_time = time.perf_counter()
    # Read file bytes to compute SHA-256 hash
    file_bytes = await file.read()
    await file.seek(0) # Reset file pointer for subsequent copy
    
    image_hash = hashlib.sha256(file_bytes).hexdigest()
    user_id = user.id if hasattr(user, 'id') else user.get('id')
    cache_key = (user_id, image_hash, method.lower())
    
    if cache_key in prediction_cache:
        print(f"[CACHE HIT] Returning cached prediction for user {user_id} and hash {image_hash}", flush=True)
        return prediction_cache[cache_key]

    file_id = str(uuid.uuid4())
    temp_orig_path = os.path.join(TEMP_FILES_DIR, f"{file_id}_orig.jpg")
    temp_heat_path = os.path.join(TEMP_FILES_DIR, f"{file_id}_heat.jpg")
    
    # Save original image locally temporarily
    with open(temp_orig_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Load image for PyTorch
        cv2_image = cv2.imread(temp_orig_path)
        if cv2_image is None:
            raise HTTPException(status_code=400, detail="Invalid image file format")
            
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB)
        
        # Transform for model
        input_tensor = transform(rgb_image).unsqueeze(0).to(device)
        
        # Inference
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = F.softmax(outputs, dim=1)
            prediction_idx = torch.argmax(probs, dim=1).item()
            confidence = probs[0, prediction_idx].item()
            
        labels = ["FAKE", "REAL"]
        prediction_label = labels[prediction_idx]
        
        print(f"[DEBUG PREDICT] File: {file.filename} | Logits: {outputs[0].tolist()} | Probs: {probs[0].tolist()} | Pred Index: {prediction_idx} -> {prediction_label}", flush=True)
        
        # Generate Grad-CAM / Grad-CAM++ heatmap based on selected method
        target_layer = model.features[8]
        if method.lower() == "gradcam++":
            grad_cam = GradCAMPlusPlus(model, target_layer)
        else:
            grad_cam = GradCAM(model, target_layer)
            
        try:
            # Heatmap needs backward pass, so we enable grad temporarily
            with torch.enable_grad():
                heatmap, _ = grad_cam.generate_heatmap(input_tensor, prediction_idx)
                
            # Generate overlay image (alpha=0.85)
            overlayed_img = overlay_heatmap(temp_orig_path, heatmap, alpha=0.85)
            cv2.imwrite(temp_heat_path, overlayed_img)
        finally:
            grad_cam.remove_hooks()
            
        # Prepare Base64 response
        with open(temp_orig_path, "rb") as f:
            orig_b64 = base64.b64encode(f.read()).decode()
        with open(temp_heat_path, "rb") as f:
            heat_b64 = base64.b64encode(f.read()).decode()
            
        image_url = ""
        heatmap_url = ""
        
        # Upload to Supabase Storage & Insert record
        if supabase:
            try:
                bucket_name = "scans"
                
                # Upload files to scans bucket
                orig_storage_path = f"{user_id}/{file_id}_orig.jpg"
                heat_storage_path = f"{user_id}/{file_id}_heat.jpg"
                
                with open(temp_orig_path, "rb") as f:
                    supabase.storage.from_(bucket_name).upload(path=orig_storage_path, file=f, file_options={"content-type": "image/jpeg"})
                with open(temp_heat_path, "rb") as f:
                    supabase.storage.from_(bucket_name).upload(path=heat_storage_path, file=f, file_options={"content-type": "image/jpeg"})
                    
                image_url = supabase.storage.from_(bucket_name).get_public_url(orig_storage_path)
                heatmap_url = supabase.storage.from_(bucket_name).get_public_url(heat_storage_path)
                
                # Save scan record in database
                scan_record = {
                    "user_id": user_id,
                    "filename": file.filename,
                    "prediction": prediction_label,
                    "confidence": confidence,
                    "image_url": image_url,
                    "heatmap_url": heatmap_url
                }
                supabase.table("scans").insert(scan_record).execute()
                
                # Prune old scans in background to maintain size limit (e.g. max 50 scans per user)
                asyncio.create_task(prune_old_scans(user_id, max_scans=50))
                
            except Exception as se:
                print(f"Supabase Storage/DB integration failed: {se}")
                # Fallback to local urls
                image_url = f"/static/temp/{file_id}_orig.jpg"
                heatmap_url = f"/static/temp/{file_id}_heat.jpg"
        else:
            image_url = f"/static/temp/{file_id}_orig.jpg"
            heatmap_url = f"/static/temp/{file_id}_heat.jpg"
            
            # Save to global mock history (HistoryItem schema fields)
            mock_item = {
                "id": file_id,
                "user_id": user_id,
                "filename": file.filename,
                "prediction": prediction_label,
                "confidence": confidence,
                "image_url": image_url,
                "heatmap_url": heatmap_url,
                "created_at": datetime.now()
            }
            MOCK_PREDICTIONS[file_id] = mock_item
            
            # Prune local mock scans to prevent infinite disk build-up
            prune_local_mock_scans(max_scans=50)
            
        elapsed_time_ms = int((time.perf_counter() - start_time) * 1000)
        
        response_data = {
            "status": "success",
            "prediction": prediction_label,
            "confidence": confidence,
            "image_url": image_url,
            "heatmap_url": heatmap_url,
            "real_heatmap_url": "",
            "fake_heatmap_url": "",
            "orig_b64": orig_b64,
            "heat_b64": heat_b64,
            "real_heat_b64": "",
            "fake_heat_b64": "",
            "processing_time_ms": elapsed_time_ms
        }
        
        # Manage Cache Size Limit (FIFO)
        if len(prediction_cache) >= MAX_CACHE_SIZE:
            first_key = next(iter(prediction_cache))
            prediction_cache.pop(first_key)
            
        prediction_cache[cache_key] = response_data
        
        return response_data
        
    finally:
        # Clean up local temporary files to prevent server disk leak ONLY if Supabase is active
        # (For mock mode, we preserve files on disk for history page previews, pruned at 50 max)
        if supabase:
            try:
                if os.path.exists(temp_orig_path):
                    os.remove(temp_orig_path)
                if os.path.exists(temp_heat_path):
                    os.remove(temp_heat_path)
            except Exception as e:
                print(f"Failed to clean up temporary files: {e}")

# Single Image Prediction Endpoint
@app.post("/api/predict", response_model=PredictResponse)
async def predict_image(
    files: UploadFile = File(...), 
    method: str = Form("gradcam"),
    user = Depends(get_current_user)
):
    return await process_single_prediction(files, method, user)

# Batch Images Prediction Endpoint
@app.post("/api/predict/batch", response_model=List[PredictResponse])
async def predict_batch(
    files: List[UploadFile] = File(...),
    method: str = Form("gradcam"),
    user = Depends(get_current_user)
):
    results = []
    for file in files:
        res = await process_single_prediction(file, method, user)
        results.append(res)
    return results

# History Endpoint
@app.get("/api/history", response_model=List[HistoryItem])
async def get_history(user = Depends(get_current_user)):
    if not supabase:
        # Return local mock history ordered by created_at descending (newest first)
        mock_list = list(MOCK_PREDICTIONS.values())
        mock_list.sort(key=lambda x: x["created_at"], reverse=True)
        return mock_list
        
    try:
        user_id = user.id if hasattr(user, 'id') else user.get('id')
        res = supabase.table("scans").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

from pydantic import BaseModel

class MockSignUpData(BaseModel):
    email: str
    password: str
    full_name: str

class MockLoginData(BaseModel):
    email: str
    password: str

from app.auth import record_user_metadata

@app.post("/api/auth/mock/signup")
async def mock_signup(data: MockSignUpData):
    user_id = str(uuid.uuid4())
    user_record = {
        "id": user_id,
        "email": data.email,
        "full_name": data.full_name,
        "created_at": datetime.now()
    }
    MOCK_SIGNUPS.append(user_record)
    record_user_metadata(user_id, data.email, data.full_name)
    return {"status": "success", "message": "User registered successfully"}

@app.post("/api/auth/mock/login")
async def mock_login(data: MockLoginData):
    email_clean = data.email.strip().lower()
    admin_user = os.getenv("ADMIN_USERNAME", "admin").strip().lower()
    admin_pass = os.getenv("ADMIN_PASSWORD", "Yashashvi@7136")
    
    # Administrator bypass check
    if email_clean in (admin_user, f"{admin_user}@astralens.com"):
        if data.password == admin_pass:
            login_record = {
                "email": "admin@astralens.com",
                "timestamp": datetime.now()
            }
            MOCK_LOGINS.append(login_record)
            
            # Ensure admin is in mock signups so it displays in users list
            admin_exists = any(u.get("email") == "admin@astralens.com" for u in MOCK_SIGNUPS)
            if not admin_exists:
                MOCK_SIGNUPS.append({
                    "id": "admin-12345",
                    "email": "admin@astralens.com",
                    "full_name": "System Administrator",
                    "created_at": datetime.now()
                })
            record_user_metadata("admin-12345", "admin@astralens.com", "System Administrator")
            return {
                "status": "success", 
                "token": "admin-super-token",
                "user": {
                    "id": "admin-12345",
                    "email": "admin@astralens.com",
                    "full_name": "System Administrator"
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Incorrect password for administrator")
            
    login_record = {
        "email": data.email,
        "timestamp": datetime.now()
    }
    MOCK_LOGINS.append(login_record)
    
    # Search for user by email OR full_name (case-insensitive username check!)
    existing_user = None
    for u in MOCK_SIGNUPS:
        if (u.get("email") or "").strip().lower() == email_clean or (u.get("full_name") or "").strip().lower() == email_clean:
            existing_user = u
            break
            
    if not existing_user:
        # If user doesn't exist, we auto-create them
        user_email = email_clean if "@" in email_clean else f"{email_clean}@astralens.com"
        user_fullname = email_clean.split("@")[0].capitalize()
        existing_user = {
            "id": str(uuid.uuid4()),
            "email": user_email,
            "full_name": user_fullname,
            "created_at": datetime.now()
        }
        MOCK_SIGNUPS.append(existing_user)

    record_user_metadata(existing_user["id"], existing_user["email"], existing_user.get("full_name"))
        
    return {
        "status": "success", 
        "token": "mock-token",
        "user": {
            "id": existing_user["id"],
            "email": existing_user["email"],
            "full_name": existing_user["full_name"]
        }
    }

# Mount static folder for local fallback static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve frontend build folder
if os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="frontend")
else:
    @app.get("/")
    def read_root():
        return {"message": "FastAPI is running. React frontend build not found."}
