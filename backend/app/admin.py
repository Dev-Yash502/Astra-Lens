import os
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.auth import get_current_user
from app.core.config import supabase
from app.mock_db import MOCK_PREDICTIONS, MOCK_LOGINS, MOCK_SIGNUPS, USER_METADATA_MAP

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

@router.get("/users")
async def list_registered_users(user = Depends(verify_admin_privilege)):
    users_list = []
    
    # 1. Fetch from Supabase if active
    if supabase:
        try:
            users_res = supabase.auth.admin.list_users()
            for u in users_res.users:
                users_list.append({
                    "id": u.id,
                    "email": u.email,
                    "full_name": u.user_metadata.get("full_name", u.email.split("@")[0]) if u.user_metadata else u.email.split("@")[0],
                    "created_at": u.created_at,
                    "last_sign_in_at": u.last_sign_in_at
                })
        except Exception:
            # Fallback: aggregate from database scans
            try:
                res = supabase.table("scans").select("user_id, created_at").execute()
                scans = res.data or []
                unique_users = {}
                for s in scans:
                    uid = s.get("user_id")
                    if uid and uid not in unique_users:
                        meta = USER_METADATA_MAP.get(str(uid), {})
                        user_email = meta.get("email") or f"user_{uid[:6]}@supabase.com"
                        user_fullname = meta.get("full_name") or f"User {uid[:6]}"
                        
                        unique_users[uid] = {
                            "id": uid,
                            "email": user_email,
                            "full_name": user_fullname,
                            "created_at": s.get("created_at"),
                            "last_sign_in_at": s.get("created_at")
                        }
                users_list.extend(list(unique_users.values()))
            except Exception as db_err:
                print(f"[ADMIN WARNING] Supabase listing failed: {db_err}", flush=True)

    # 2. Always merge with mock users and tracked metadata so dashboard displays real names & gmail IDs
    for key, meta in USER_METADATA_MAP.items():
        if isinstance(meta, dict) and "email" in meta and "id" in meta:
            if not any(x["email"].lower() == meta["email"].lower() for x in users_list):
                users_list.append({
                    "id": meta.get("id"),
                    "email": meta.get("email"),
                    "full_name": meta.get("full_name", meta.get("email").split("@")[0]),
                    "created_at": meta.get("created_at", "2026-07-18T12:00:00Z"),
                    "last_sign_in_at": meta.get("last_sign_in_at", "2026-07-19T18:00:00Z")
                })

    # Demo User
    if not any(u["email"].lower() == "demo@example.com" for u in users_list):
        users_list.append({
            "id": "00000000-0000-0000-0000-000000000000",
            "email": "demo@example.com",
            "full_name": "Demo User",
            "created_at": "2026-07-15T12:00:00Z",
            "last_sign_in_at": "2026-07-18T18:00:00Z"
        })

    # Mock Signups
    for u in MOCK_SIGNUPS:
        if not any(x["email"].lower() == u.get("email").lower() for x in users_list):
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
    scans_list = []
    
    # 1. Fetch live scans from Supabase
    if supabase:
        try:
            res = supabase.table("scans").select("*").order("created_at", desc=True).execute()
            scans_list = res.data or []
        except Exception as e:
            print(f"[ADMIN WARNING] Supabase scans select failed: {e}", flush=True)
            
    # 2. Merge with mock scans to populate the dashboard with visual details
    mock_scans = list(MOCK_PREDICTIONS.values())
    for ms in mock_scans:
        # Avoid duplicate mock files
        if not any(s.get("filename") == ms.get("filename") for s in scans_list):
            scans_list.append(ms)
            
    # Sort all by created_at descending safely handling both datetime objects and ISO strings
    scans_list.sort(key=lambda x: str(x.get("created_at")) if x.get("created_at") is not None else "", reverse=True)
    return scans_list

@router.get("/stats")
async def get_admin_stats(user = Depends(verify_admin_privilege)):
    try:
        # Fetch merged users and scans
        merged_users = await list_registered_users(user=user)
        merged_scans = await list_all_scans(user=user)
        
        total_scans = len(merged_scans)
        fake_count = sum(1 for s in merged_scans if s.get("prediction") == "FAKE")
        real_count = total_scans - fake_count
        
        times = [s.get("processing_time_ms") for s in merged_scans if s.get("processing_time_ms") is not None]
        avg_time = sum(times) / len(times) if times else 380 # default average fallback
        
        return {
            "total_users": len(merged_users),
            "total_scans": total_scans,
            "fake_count": fake_count,
            "real_count": real_count,
            "avg_processing_time_ms": int(avg_time)
        }
    except Exception as e:
        print(f"[ADMIN WARNING] Merging stats failed: {e}", flush=True)
        # Total fallback
        return {
            "total_users": len(MOCK_SIGNUPS) + 1,
            "total_scans": len(MOCK_PREDICTIONS),
            "fake_count": sum(1 for s in MOCK_PREDICTIONS.values() if s.get("prediction") == "FAKE"),
            "real_count": sum(1 for s in MOCK_PREDICTIONS.values() if s.get("prediction") == "REAL"),
            "avg_processing_time_ms": 380
        }
