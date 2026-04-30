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

@router.get("/schools", response_model=dict)
async def get_schools():
    """Get list of all schools - public endpoint from dedicated schools database"""
    try:
        # Use dedicated schools database
        schools_url = os.getenv("SCHOOLS_SUPABASE_URL")
        schools_service_key = os.getenv("SCHOOLS_SUPABASE_SERVICE_KEY")
        
        if not schools_url or not schools_service_key:
            logger.warning("Schools database credentials not configured")
            return {"data": [], "count": 0, "error": "Schools database not configured"}
        
        # Create a Supabase client for schools database using service key
        schools_client = create_client(schools_url, schools_service_key)
        response = schools_client.table("organizations").select("id, name").is_("archived_at", None).order("name").execute()
        
        if response.data is None:
            return {"data": [], "count": 0}
        
        # Map 'name' to 'schoolName' to match frontend expectations
        data = [{"id": row["id"], "schoolName": row["name"]} for row in response.data]
        
        return {
            "data": data,
            "count": len(data)
        }
    except Exception as e:
        logger.error(f"Error fetching schools: {str(e)}")
        return {"data": [], "count": 0, "error": str(e)}
