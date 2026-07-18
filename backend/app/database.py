from app.core.config import supabase

async def prune_old_scans(user_id: str, max_scans: int = 50):
    if not supabase:
        return
    try:
        # Fetch scans for this user ordered by created_at (oldest first)
        res = supabase.table("scans").select("id", "image_url", "heatmap_url").eq("user_id", user_id).order("created_at", desc=False).execute()
        scans = res.data
        if len(scans) > max_scans:
            num_to_delete = len(scans) - max_scans
            to_delete = scans[:num_to_delete]
            
            bucket_name = "scans"
            files_to_remove = []
            ids_to_delete = []
            
            for scan in to_delete:
                ids_to_delete.append(scan["id"])
                for url_key in ["image_url", "heatmap_url"]:
                    url = scan.get(url_key)
                    if url and bucket_name in url:
                        # Extract the path after /scans/
                        parts = url.split(f"/{bucket_name}/")
                        if len(parts) > 1:
                            files_to_remove.append(parts[1])
            
            # 1. Delete files from storage
            if files_to_remove:
                try:
                    supabase.storage.from_(bucket_name).remove(files_to_remove)
                    print(f"[CLEANUP] Deleted {len(files_to_remove)} files from Supabase Storage.")
                except Exception as se:
                    print(f"[CLEANUP] Failed to delete storage files: {se}")
                    
            # 2. Delete rows from database
            if ids_to_delete:
                supabase.table("scans").delete().in_("id", ids_to_delete).execute()
                print(f"[CLEANUP] Pruned {len(ids_to_delete)} oldest scan records for user {user_id}.")
                
    except Exception as e:
        print(f"[CLEANUP] Error during scan pruning: {e}")
