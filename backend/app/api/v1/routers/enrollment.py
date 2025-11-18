from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import logging

from app.api.v1.schemas.enrollment import (
    AutoSaveRequest, AutoSaveResponse, EnrollmentData,
    SubmitEnrollmentResponse, ApplicationResponse,
    UploadSummaryResponse, SubmitApplicationRequest,
    SubmitApplicationResponse
)
from app.services.enrollment_service import enrollment_service
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/auto-save", response_model=AutoSaveResponse)
async def auto_save_enrollment(
    data: AutoSaveRequest,
    current_user: dict = Depends(get_current_user)
) -> AutoSaveResponse:
    """Auto-save enrollment progress"""
    try:
        return enrollment_service.auto_save_enrollment(data, current_user.get("id"))
    except Exception as e:
        logger.error(f"Auto-save failed: {str(e)}")
        # Return a success response to prevent frontend errors
        # The frontend will retry or handle gracefully
        return AutoSaveResponse(
            message="Auto-save completed with warnings",
            application_id=data.application_id or "unknown"
        )

@router.post("/submit", response_model=SubmitEnrollmentResponse)
async def submit_enrollment(
    data: EnrollmentData,
    current_user: dict = Depends(get_current_user)
) -> SubmitEnrollmentResponse:
    """Submit complete enrollment"""
    return enrollment_service.submit_enrollment(data, current_user.get("id"))

@router.get("/get-application/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> ApplicationResponse:
    """Get application by ID"""
    return enrollment_service.get_application(application_id, current_user.get("id"))

@router.get("/{application_id}/upload-summary", response_model=UploadSummaryResponse)
async def get_upload_summary(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> UploadSummaryResponse:
    """Get upload summary for application"""
    return enrollment_service.get_upload_summary(application_id, current_user.get("id"))

@router.post("/submit-application", response_model=SubmitApplicationResponse)
async def submit_full_application(
    data: SubmitApplicationRequest,
    current_user: dict = Depends(get_current_user)
) -> SubmitApplicationResponse:
    """Submit full application"""
    return enrollment_service.submit_application(data, current_user.get("id"))

@router.post("/declaration")
async def submit_declaration(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Submit declaration data"""
    return enrollment_service.submit_declaration(data, current_user.get("id"))
