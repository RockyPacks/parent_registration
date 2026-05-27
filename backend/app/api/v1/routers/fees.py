"""
Fees Router
API endpoints for school fees
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from pydantic import BaseModel
from app.repositories.fee_repository import fee_repository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fees", tags=["fees"])


class SchoolFeesResponse(BaseModel):
    """Response model for school fees"""
    id: str
    grade: str
    annual_fee: int
    term_fee: int
    registration_fee: int
    re_registration_fee: int
    sport_fee: int
    created_at: str
    updated_at: str


@router.get("/", response_model=SchoolFeesResponse)
async def get_school_fees(
    grade: str = Query(..., description="Grade level (e.g., 'Grade R', 'Grade 1', 'Grade 10')"),
    school_key: Optional[str] = Query(None, description="School key for school-specific fees (e.g., 'MASEALA_PROG_001')")
):
    """
    Get school fees for a specific grade, optionally scoped to a school.
    """
    logger.info(f"API request: Get fees for grade '{grade}', school_key='{school_key}'")
    
    fees = fee_repository.get_fees_by_grade(grade, school_key)
    
    if not fees:
        logger.warning(f"Fee structure not found for grade: {grade}, school_key: {school_key}")
        raise HTTPException(
            status_code=404,
            detail=f"Fee structure not found for grade '{grade}'. Please ensure the grade is valid."
        )
    
    logger.info(f"Successfully retrieved fees for grade: {grade}")
    return fees


@router.get("/all", response_model=List[SchoolFeesResponse])
async def get_all_school_fees():
    """
    Get all school fees.
    
    Returns:
        List[SchoolFeesResponse]: List of all fee structures
    """
    logger.info("API request: Get all school fees")
    
    fees = fee_repository.get_all_fees()
    
    logger.info(f"Successfully retrieved {len(fees)} fee structures")
    return fees
