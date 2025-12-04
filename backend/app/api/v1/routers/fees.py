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
    grade: str = Query(..., description="Grade level (e.g., 'Grade R', 'Grade 1', 'Grade 10')")
):
    """
    Get school fees for a specific grade.
    
    Args:
        grade: Grade level (e.g., 'Grade R', 'Grade 1', 'Grade 10')
    
    Returns:
        SchoolFeesResponse: Fee structure for the specified grade
    
    Raises:
        HTTPException: 404 if fee structure not found for the grade
    """
    logger.info(f"API request: Get fees for grade '{grade}'")
    
    fees = fee_repository.get_fees_by_grade(grade)
    
    if not fees:
        logger.warning(f"Fee structure not found for grade: {grade}")
        raise HTTPException(
            status_code=404,
            detail=f"Fee structure not found for grade '{grade}'. Please ensure the grade is valid (e.g., 'Grade R', 'Grade 1', 'Grade 10')"
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
