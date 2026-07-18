import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

# Import the FastAPI app
from app.main import app

client = TestClient(app)

def test_read_root():
    """Test that the root route responds (if no frontend build, returns JSON, if yes serves index.html)"""
    response = client.get("/")
    assert response.status_code in (200, 404)

def test_history_unauthorized():
    """Test that GET /api/history returns 401 without authorization header"""
    response = client.get("/api/history")
    assert response.status_code == 401

def test_predict_unauthorized():
    """Test that POST /api/predict returns 401 without authorization header"""
    response = client.post("/api/predict")
    assert response.status_code == 401

def test_predict_with_mock_auth():
    """Test POST /api/predict using mock token and in-memory mock image"""
    # Create a simple 224x224 RGB image in memory
    img = Image.new("RGB", (224, 224), color="red")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="JPEG")
    img_bytes.seek(0)
    
    # Send request with mock bearer token
    headers = {"Authorization": "Bearer mock-token"}
    files = {"files": ("test_image.jpg", img_bytes, "image/jpeg")}
    
    response = client.post("/api/predict", headers=headers, files=files)
    
    # Assert successful status code
    assert response.status_code == 200
    
    # Validate Pydantic schema structure in the JSON response
    data = response.json()
    assert data["status"] == "success"
    assert data["prediction"] in ("REAL", "FAKE")
    assert isinstance(data["confidence"], float)
    assert "orig_b64" in data
    assert "heat_b64" in data

def test_predict_with_gradcam_plus_plus():
    """Test POST /api/predict with Grad-CAM++ method selector"""
    img = Image.new("RGB", (224, 224), color="blue")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="JPEG")
    img_bytes.seek(0)
    
    headers = {"Authorization": "Bearer mock-token"}
    files = {"files": ("test_image_cpp.jpg", img_bytes, "image/jpeg")}
    data = {"method": "gradcam++"}
    
    response = client.post("/api/predict", headers=headers, files=files, data=data)
    assert response.status_code == 200
    
    resp_data = response.json()
    assert resp_data["status"] == "success"
    assert resp_data["prediction"] in ("REAL", "FAKE")
    assert isinstance(resp_data["confidence"], float)
    assert "orig_b64" in resp_data
    assert "heat_b64" in resp_data

def test_mock_history_flow():
    """Test that mock mode saves predictions and history endpoint returns them"""
    import app.main as main
    import random
    
    orig_supabase = main.supabase
    main.supabase = None
    try:
        # Guarantee a cache miss with random color
        random_color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        img = Image.new("RGB", (224, 224), color=random_color)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        
        headers = {"Authorization": "Bearer mock-token"}
        files = {"files": ("test_history_item.jpg", img_bytes, "image/jpeg")}
        
        # Run prediction in mock mode
        predict_response = client.post("/api/predict", headers=headers, files=files)
        assert predict_response.status_code == 200
        
        # Fetch history in mock mode
        history_response = client.get("/api/history", headers=headers)
        assert history_response.status_code == 200
        
        history_data = history_response.json()
        assert isinstance(history_data, list)
        assert len(history_data) >= 1
        
        # Check that our prediction is inside history
        filenames = [item["filename"] for item in history_data]
        assert "test_history_item.jpg" in filenames
    finally:
        main.supabase = orig_supabase
