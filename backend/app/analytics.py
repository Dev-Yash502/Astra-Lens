from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.auth import get_current_user
from app.core.config import supabase
from app.mock_db import MOCK_PREDICTIONS

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/summary")
async def get_analytics_summary(user = Depends(get_current_user)):
    """Fetch classification analytics, confidence distribution, and timeline data"""
    scans_list = []
    
    if supabase:
        try:
            res = supabase.table("scans").select("*").execute()
            scans_list = res.data or []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load analytics: {str(e)}")
    else:
        # Fallback to local mock data
        scans_list = list(MOCK_PREDICTIONS.values())

    total_scans = len(scans_list)
    fake_count = sum(1 for s in scans_list if s.get("prediction") == "FAKE")
    real_count = total_scans - fake_count
    fake_ratio = (fake_count / total_scans) if total_scans > 0 else 0
    
    # Compile confidence distribution bins (0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
    bins = {"0-20%": 0, "21-40%": 0, "41-60%": 0, "61-80%": 0, "81-100%": 0}
    for s in scans_list:
        conf = s.get("confidence") or 0.0
        pct = conf * 100
        if pct <= 20:
            bins["0-20%"] += 1
        elif pct <= 40:
            bins["21-40%"] += 1
        elif pct <= 60:
            bins["41-60%"] += 1
        elif pct <= 80:
            bins["61-80%"] += 1
        else:
            bins["81-100%"] += 1
            
    # Timeline data for last 7 days scans (defaulting to mock dates if list is small)
    timeline = {}
    today = datetime.now().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        timeline[day.strftime("%Y-%m-%d")] = 0
        
    for s in scans_list:
        created_at_val = s.get("created_at")
        if isinstance(created_at_val, str):
            try:
                # parse '2026-07-18T...'
                date_str = created_at_val.split("T")[0]
                if date_str in timeline:
                    timeline[date_str] += 1
            except Exception:
                pass
        elif isinstance(created_at_val, datetime):
            date_str = created_at_val.strftime("%Y-%m-%d")
            if date_str in timeline:
                timeline[date_str] += 1
                
    # Transform timeline dictionary into list of daily scan data objects
    timeline_list = [{"date": k, "scans": v} for k, v in timeline.items()]
    
    return {
        "total_scans": total_scans,
        "fake_count": fake_count,
        "real_count": real_count,
        "fake_ratio": round(fake_ratio, 2),
        "confidence_distribution": bins,
        "timeline_data": timeline_list
    }
