from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List # Added List import
import logging

from app.api.v1.schemas.enrollment import (
    AutoSaveRequest, AutoSaveResponse, EnrollmentData,
    SubmitEnrollmentResponse, ApplicationResponse,
    UploadSummaryResponse, SubmitApplicationRequest,
    SubmitApplicationResponse, ApplicationSummary,
    AcademicHistorySchema, DeclarationSubmitRequest
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
    except HTTPException:
        # Re-raise HTTP exceptions (like auth errors)
        raise
    except Exception as e:
        logger.error(f"Auto-save failed for user {current_user.get('id')}: {str(e)}", exc_info=True)
        # Return error response so frontend knows save failed
        raise HTTPException(
            status_code=500,
            detail=f"Auto-save failed: {str(e)}"
        )

@router.post("/initiate-application", response_model=Dict[str, Any])
async def initiate_application(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get the user's existing application ID and status, or create a new one.
    School association is read from the JWT user_metadata on first creation.
    """
    return enrollment_service.get_or_create_application_for_user(
        current_user.get("id"),
        user_metadata=current_user.get("user_metadata"),
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

@router.get("/declaration/{application_id}")
async def get_declaration(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get declaration data for an application"""
    return enrollment_service.get_declaration(application_id, current_user.get("id"))

@router.post("/declaration")
async def submit_declaration(
    data: DeclarationSubmitRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Submit declaration data"""
    return enrollment_service.submit_declaration(data, current_user.get("id"))

@router.post("/academic-history", response_model=Dict[str, Any])
async def submit_academic_history(
    data: AcademicHistorySchema,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create or update academic history for a given application.
    """
    return enrollment_service.submit_academic_history(data, current_user.get("id"))
