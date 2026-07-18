import os
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.auth import get_current_user
from app.core.config import supabase
from app.mock_db import MOCK_PREDICTIONS, MOCK_LOGINS, MOCK_SIGNUPS

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Verification dependency to ensure only admin accounts access these endpoints
async def verify_admin_privilege(user = Depends(get_current_user)):
    email = user.email if hasattr(user, 'email') else user.get('email')
    if not email or "admin" not in email.lower():
        raise HTTPException(
            status_code=403, 
            detail="Access denied: Admin permissions required."
        )
    return user

@router.get("/stats")
async def get_admin_stats(user = Depends(verify_admin_privilege)):
    use_mock = True
    scans_data = []
    
    if supabase:
        try:
            # Fetch all scans to compile stats
            res = supabase.table("scans").select("prediction, processing_time_ms").execute()
            scans_data = res.data or []
            use_mock = False
        except Exception as e:
            print(f"[ADMIN WARNING] Supabase connection failed: {e}. Falling back to mock stats.", flush=True)

    if not use_mock:
        try:
            total_scans = len(scans_data)
            fake_count = sum(1 for s in scans_data if s.get("prediction") == "FAKE")
            real_count = total_scans - fake_count
            
            times = [s.get("processing_time_ms") for s in scans_data if s.get("processing_time_ms") is not None]
            avg_time = sum(times) / len(times) if times else 0
            
            # Fetch users count if possible
            try:
                users_res = supabase.auth.admin.list_users()
                total_users = len(users_res.users) if hasattr(users_res, 'users') else 0
            except Exception:
                unique_users = {s.get("user_id") for s in scans_data if s.get("user_id")}
                total_users = max(len(unique_users), 1)
                
            return {
                "total_users": total_users,
                "total_scans": total_scans,
                "fake_count": fake_count,
                "real_count": real_count,
                "avg_processing_time_ms": int(avg_time)
            }
        except Exception as compile_err:
            print(f"[ADMIN WARNING] Stats compilation failed: {compile_err}. Using mock fallback.", flush=True)
            
    # Mock mode stats fallback
    scans_data = list(MOCK_PREDICTIONS.values())
    total_scans = len(scans_data)
    fake_count = sum(1 for s in scans_data if s.get("prediction") == "FAKE")
    real_count = total_scans - fake_count
    
    times = [350, 480, 220, 610]  # mock fallback times
    avg_time = sum(times) / len(times)
    
    unique_emails = {"demo@example.com"} | {u.get("email") for u in MOCK_SIGNUPS}
    
    return {
        "total_users": len(unique_emails),
        "total_scans": total_scans,
        "fake_count": fake_count,
        "real_count": real_count,
        "avg_processing_time_ms": int(avg_time)
    }

@router.get("/users")
async def list_registered_users(user = Depends(verify_admin_privilege)):
    users_list = []
    use_mock = True
    
    if supabase:
        try:
            # Query users through Admin API
            users_res = supabase.auth.admin.list_users()
            for u in users_res.users:
                users_list.append({
                    "id": u.id,
                    "email": u.email,
                    "full_name": u.user_metadata.get("full_name", u.email.split("@")[0]) if u.user_metadata else u.email.split("@")[0],
                    "created_at": u.created_at,
                    "last_sign_in_at": u.last_sign_in_at
                })
            use_mock = False
        except Exception as e:
            # If admin listing fails due to permissions, aggregate from database scans
            try:
                res = supabase.table("scans").select("user_id, created_at").execute()
                scans = res.data or []
                unique_users = {}
                for s in scans:
                    uid = s.get("user_id")
                    if uid and uid not in unique_users:
                        unique_users[uid] = {
                            "id": uid,
                            "email": f"user_{uid[:6]}@supabase.com",
                            "full_name": f"User {uid[:6]}",
                            "created_at": s.get("created_at"),
                            "last_sign_in_at": s.get("created_at")
                        }
                users_list = list(unique_users.values())
                use_mock = False
            except Exception as db_err:
                print(f"[ADMIN WARNING] Supabase listing failed: {db_err}. Falling back to mock.", flush=True)

    if use_mock:
        users_list = [{
            "id": "00000000-0000-0000-0000-000000000000",
            "email": "demo@example.com",
            "full_name": "Demo User",
            "created_at": "2026-07-15T12:00:00Z",
            "last_sign_in_at": "2026-07-18T18:00:00Z"
        }]
        for u in MOCK_SIGNUPS:
            users_list.append({
                "id": u.get("id"),
                "email": u.get("email"),
                "full_name": u.get("full_name"),
                "created_at": u.get("created_at"),
                "last_sign_in_at": u.get("created_at")
            })
            
    return users_list

@router.get("/scans")
async def list_all_scans(user = Depends(verify_admin_privilege)):
    if supabase:
        try:
            res = supabase.table("scans").select("*").order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[ADMIN WARNING] Supabase scans select failed: {e}. Falling back to mock.", flush=True)
            
    # Return mock scans ordered by created_at descending
    mock_scans = list(MOCK_PREDICTIONS.values())
    mock_scans.sort(key=lambda x: x.get("created_at"), reverse=True)
    return mock_scans
