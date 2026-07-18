from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Response schema for Image Prediction
class PredictResponse(BaseModel):
    status: str
    prediction: str
    confidence: float
    image_url: str
    heatmap_url: str
    real_heatmap_url: Optional[str] = ""
    fake_heatmap_url: Optional[str] = ""
    orig_b64: str
    heat_b64: str
    real_heat_b64: Optional[str] = ""
    fake_heat_b64: Optional[str] = ""
    processing_time_ms: int = 0

# Schema for individual Scan History records
class HistoryItem(BaseModel):
    id: str
    user_id: str
    filename: str
    prediction: str
    confidence: float
    image_url: str
    heatmap_url: str
    created_at: datetime
