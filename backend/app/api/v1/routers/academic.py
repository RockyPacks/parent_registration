from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging

from app.api.v1.schemas.academic import (
    AcademicHistoryCreate, AcademicHistoryResponse, AcademicHistoryUpdate
)
from app.services.academic_service import academic_service
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/academic-history", response_model=AcademicHistoryResponse)
async def create_academic_history(
    data: AcademicHistoryCreate,
    current_user: dict = Depends(get_current_user)
) -> AcademicHistoryResponse:
    """Create academic history record"""
    return academic_service.create_academic_history(data, current_user.get("id"))

@router.get("/academic-history/{application_id}", response_model=Optional[AcademicHistoryResponse])
async def get_academic_history(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> Optional[AcademicHistoryResponse]:
    """Get academic history by application ID"""
    return academic_service.get_academic_history(application_id, current_user.get("id"))

@router.put("/academic-history/{application_id}", response_model=AcademicHistoryResponse)
async def update_academic_history(
    application_id: str,
    data: AcademicHistoryUpdate,
    current_user: dict = Depends(get_current_user)
) -> AcademicHistoryResponse:
    """Update academic history record"""
    return academic_service.update_academic_history(application_id, data, current_user.get("id"))

@router.delete("/academic-history/{application_id}")
async def delete_academic_history(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Delete academic history record"""
    academic_service.delete_academic_history(application_id, current_user.get("id"))
    return {"message": "Academic history deleted successfully"}
