import os
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Server paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMP_DIR = os.path.join(BASE_DIR, "static")
TEMP_FILES_DIR = os.path.join(TEMP_DIR, "temp")
os.makedirs(TEMP_FILES_DIR, exist_ok=True)

class Settings:
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()

# Supabase Client Initialization
supabase: Optional[Client] = None

if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        print("Connected to Supabase successfully!")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
else:
    print("WARNING: Supabase URL/Key missing. App will run in local-only mock mode.")
