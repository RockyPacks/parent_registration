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

from fastapi import HTTPException, status
from pydantic import BaseModel, Field
from app.db.supabase_client import supabase_service

class ProspectCreate(BaseModel):
    parent_name: str = Field(..., alias="parentName")
    contact_number: str = Field(..., alias="contactNumber")
    email: str = Field(..., description="Email address")
    grade: str = Field(..., description="Grade applying for")
    academic_year: str = Field(..., alias="academicYear")

    class Config:
        populate_by_name = True

@router.get("/schools/{school_id}/public", response_model=dict)
async def get_public_school(school_id: str):
    """Fetch public school details (branding) - public endpoint, no auth"""
    try:
        # Validate UUID format
        try:
            from uuid import UUID
            UUID(school_id)
        except ValueError:
            raise HTTPException(status_code=404, detail="Invalid school ID format")

        schools_client = get_schools_client()
        if not schools_client:
            logger.warning("Schools database client not initialized")
            raise HTTPException(status_code=500, detail="Schools database not configured")
        
        response = schools_client.table("organizations").select("id, name").eq("id", school_id).is_("archived_at", None).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="School not found")
            
        return {
            "id": response.data[0]["id"],
            "name": response.data[0]["name"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching public school {school_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch school details: {str(e)}")

@router.post("/schools/{school_id}/prospects", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_prospect(school_id: str, prospect: ProspectCreate):
    """Create a prospect inquiry - public endpoint, no auth"""
    try:
        # Validate UUID format
        try:
            from uuid import UUID
            UUID(school_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid school ID format")

        # 1. Verify school exists
        schools_client = get_schools_client()
        if not schools_client:
            logger.warning("Schools database client not initialized")
            raise HTTPException(status_code=500, detail="Schools database not configured")

        school_response = schools_client.table("organizations").select("id, name").eq("id", school_id).is_("archived_at", None).execute()
        if not school_response.data or len(school_response.data) == 0:
            raise HTTPException(status_code=404, detail="School not found")

        # 2. Save prospect to public.prospects in main database
        if not supabase_service:
            logger.error("Main Supabase service client not initialized")
            raise HTTPException(status_code=500, detail="Database connection not available")

        prospect_data = {
            "school_id": school_id,
            "parent_name": prospect.parent_name,
            "contact_number": prospect.contact_number,
            "email": prospect.email,
            "grade": prospect.grade,
            "academic_year": prospect.academic_year,
            "status": "inquiry"
        }

        logger.info(f"Saving prospect: {prospect_data}")
        result = supabase_service.table("prospects").insert(prospect_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save prospect to database")

        saved_prospect = result.data[0]

        # 3. Log the ledger event INQUIRY_RECEIVED
        logger.info(f"[Ledger Event] INQUIRY_RECEIVED: Prospect {prospect.parent_name} ({prospect.email}) submitted inquiry for School {school_id}")

        return {
            "message": "Inquiry submitted successfully",
            "prospect_id": saved_prospect["id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating prospect for school {school_id}: {str(e)}")
        # Check if it's a validation error or database error
        error_msg = str(e)
        if "violates" in error_msg.lower() or "invalid" in error_msg.lower():
            raise HTTPException(status_code=400, detail=f"Invalid field values: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to submit inquiry: {error_msg}")

@router.get("/schools/config/{school_key}", response_model=dict)
async def get_school_config(school_key: str):
    """
    Return school-specific config (bank details, branding) from the main schools table.
    Looked up by school_key (e.g. 'MASEALA_PROG_001').
    Public endpoint — no auth required.
    """
    try:
        if not supabase_service:
            raise HTTPException(status_code=500, detail="Database connection not available")

        result = supabase_service.table("schools")\
            .select("id, name, short_name, school_key, email, bank_name, account_holder, account_number, branch_code, branch_name, payment_reference_format, active")\
            .eq("school_key", school_key)\
            .eq("active", True)\
            .limit(1)\
            .execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail=f"No active school found for key '{school_key}'")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching school config for key '{school_key}': {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch school configuration")
