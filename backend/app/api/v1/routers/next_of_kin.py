"""
API routes for next of kin (emergency contact) operations.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any
import logging

from app.api.v1.schemas.enrollment import (
    NextOfKinCreate, NextOfKinResponse, NextOfKinUpdate
)
from app.services.next_of_kin_service import next_of_kin_service
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/next-of-kin", response_model=NextOfKinResponse)
async def create_next_of_kin(
    data: NextOfKinCreate,
    current_user: dict = Depends(get_current_user)
) -> NextOfKinResponse:
    """Create next of kin record"""
    return next_of_kin_service.create_next_of_kin(data, current_user.get("id"))


@router.get("/next-of-kin/{application_id}", response_model=Optional[NextOfKinResponse])
async def get_next_of_kin(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> Optional[NextOfKinResponse]:
    """Get next of kin by application ID"""
    return next_of_kin_service.get_next_of_kin(application_id, current_user.get("id"))


@router.put("/next-of-kin/{application_id}", response_model=NextOfKinResponse)
async def update_next_of_kin(
    application_id: str,
    data: NextOfKinUpdate,
    current_user: dict = Depends(get_current_user)
) -> NextOfKinResponse:
    """Update next of kin record"""
    return next_of_kin_service.update_next_of_kin(application_id, data, current_user.get("id"))


@router.delete("/next-of-kin/{application_id}")
async def delete_next_of_kin(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Delete next of kin record"""
    next_of_kin_service.delete_next_of_kin(application_id, current_user.get("id"))
    return {"message": "Next of kin record deleted successfully"}
