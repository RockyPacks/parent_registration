from fastapi import APIRouter
from typing import List
import logging
import os
from pathlib import Path
from supabase import create_client

# Load .env explicitly so os.getenv works regardless of how the process was started
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[4] / ".env", override=False)
except ImportError:
    pass

logger = logging.getLogger(__name__)

router = APIRouter()

# Cache for schools data
_schools_cache = {
    "data": None,
    "timestamp": 0
}
_schools_client = None
CACHE_TTL = 300  # 5 minutes

def get_schools_client():
    global _schools_client
    if _schools_client is None:
        schools_url = os.getenv("SCHOOLS_SUPABASE_URL")
        schools_service_key = os.getenv("SCHOOLS_SUPABASE_SERVICE_KEY")
        if schools_url and schools_service_key:
            _schools_client = create_client(schools_url, schools_service_key)
    return _schools_client

@router.get("/schools", response_model=dict)
async def get_schools():
    """Get list of all schools - public endpoint from dedicated schools database"""
    import time
    
    # Check cache
    current_time = time.time()
    if _schools_cache["data"] is not None and (current_time - _schools_cache["timestamp"]) < CACHE_TTL:
        return _schools_cache["data"]
        
    try:
        schools_client = get_schools_client()
        if not schools_client:
            logger.warning("Schools database credentials not configured")
            return {"data": [], "count": 0, "error": "Schools database not configured"}
        
        response = schools_client.table("organizations").select("id, name").is_("archived_at", None).order("name").execute()
        
        if response.data is None:
            return {"data": [], "count": 0}
        
        # Map 'name' to 'schoolName' to match frontend expectations
        data = [{"id": row["id"], "schoolName": row["name"]} for row in response.data]
        
        result = {
            "data": data,
            "count": len(data)
        }
        
        # Update cache
        _schools_cache["data"] = result
        _schools_cache["timestamp"] = current_time
        
        return result
    except Exception as e:
        logger.error(f"Error fetching schools: {str(e)}")
        return {"data": [], "count": 0, "error": str(e)}
