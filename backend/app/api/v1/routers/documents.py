from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form, status
from typing import Dict, Any

from app.api.v1.schemas.enrollment import (
    DocumentStatusResponse, FileUploadResponse, UploadedFilesResponse,
    DeleteFileResponse, CompleteUploadResponse, UploadSummaryResponse
)
from app.services.document_service import document_service
from app.services.bank_statement_service import bank_statement_service
from app.repositories.enrollment_repository import enrollment_repository
from app.core.security import get_current_user
from app.core.file_rate_limit import check_file_upload_limit
from app.db.supabase_client import supabase_service

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _is_admin(current_user: dict) -> bool:
    """
    Returns True when the caller holds an admin role.
    Checks both the top-level JWT 'role' claim and app_metadata.role,
    matching the pattern used in the RLS policy for bank_statement_analyses.
    """
    role = current_user.get("role", "")
    if role in ("admin", "service_role"):
        return True
    app_metadata = current_user.get("app_metadata") or {}
    user_metadata = current_user.get("user_metadata") or {}
    return (
        app_metadata.get("role") == "admin"
        or user_metadata.get("role") == "admin"
    )


@router.get("/{application_id}", response_model=DocumentStatusResponse)
async def get_document_status(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> DocumentStatusResponse:
    """Get document upload status"""
    return document_service.get_document_status(application_id, current_user.get("id"))


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    application_id: str = Form(...),
    document_type: str = Form(...),
    current_user: dict = Depends(get_current_user)
) -> FileUploadResponse:
    """Upload file to Supabase Storage with rate limiting.

    When document_type == 'bank_statement', automatically queues AI analysis
    as a background task so the upload response is not delayed.
    """
    # Get file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    # Check file upload rate limit
    check_file_upload_limit(current_user.get("id"), file_size)

    upload_response = document_service.upload_file(file, application_id, document_type, current_user.get("id"))

    # Auto-trigger AI analysis for bank statements
    if document_type == "bank_statement" and upload_response.file:
        file_id = upload_response.file.get("id")
        user_id = current_user.get("id")
        if file_id:
            background_tasks.add_task(
                bank_statement_service.analyse_bank_statement,
                application_id,
                file_id,
                user_id
            )
            logger.info(
                f"Bank statement analysis queued: application={application_id}, file={file_id}"
            )

    return upload_response


@router.get("/{application_id}/files", response_model=UploadedFilesResponse)
async def get_uploaded_files(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> UploadedFilesResponse:
    """Get uploaded files for application"""
    return document_service.get_uploaded_files(application_id, current_user.get("id"))


@router.delete("/{application_id}/files/{file_id}", response_model=DeleteFileResponse)
async def delete_file(
    application_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user)
) -> DeleteFileResponse:
    """Delete uploaded file"""
    return document_service.delete_file(application_id, file_id, current_user.get("id"))


@router.post("/complete", response_model=CompleteUploadResponse)
async def complete_document_upload(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
) -> CompleteUploadResponse:
    """Mark document upload as complete"""
    return document_service.complete_upload(data, current_user.get("id"))


@router.get("/{application_id}/upload-summary", response_model=UploadSummaryResponse)
async def get_upload_summary(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> UploadSummaryResponse:
    """Get upload summary for application"""
    return document_service.get_upload_summary(application_id, current_user.get("id"))


@router.post("/{application_id}/mark-complete/{doc_type}")
async def mark_document_complete(
    application_id: str,
    doc_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark document type as complete"""
    return document_service.mark_complete(application_id, doc_type, current_user.get("id"))


@router.post("/{application_id}/analyse-bank-statement/{file_id}")
async def trigger_bank_statement_analysis(
    application_id: str,
    file_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Manually trigger async AI analysis of an uploaded bank statement.

    - Verifies the caller owns the application
    - Verifies the file exists in the bank_statements bucket
    - Skips re-analysis if a 'complete' record already exists for this file
    - Returns immediately; analysis runs in the background
    """
    user_id = current_user.get("id")

    # Verify user owns this application
    app_check = enrollment_repository.get_application_by_id_and_user(application_id, user_id)
    if not app_check:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Verify file exists and belongs to bank_statements
    try:
        files_result = supabase_service.table("uploaded_files").select("files").eq(
            "application_id", application_id
        ).execute()

        found_file = None
        if files_result.data:
            files_array = files_result.data[0].get("files") or []
            for f in files_array:
                if (f.get("id") or f.get("fileId")) == file_id:
                    found_file = f
                    break

        if not found_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File {file_id} not found for application {application_id}"
            )

        doc_type = found_file.get("document_type") or found_file.get("documentType", "")
        if doc_type != "bank_statement":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a bank statement document"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying file for analysis trigger: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # Check for existing complete analysis — avoid duplicate runs
    try:
        existing = supabase_service.table("bank_statement_analyses").select("id, status").eq(
            "application_id", application_id
        ).eq("file_id", file_id).eq("status", "complete").execute()

        if existing.data and len(existing.data) > 0:
            return {
                "status": "already_complete",
                "file_id": file_id,
                "message": "A complete analysis already exists for this file."
            }
    except Exception as e:
        logger.warning(f"Could not check existing analysis, proceeding anyway: {e}")

    # Enqueue background task
    background_tasks.add_task(
        bank_statement_service.analyse_bank_statement,
        application_id,
        file_id,
        user_id
    )
    logger.info(
        f"Bank statement analysis manually queued: application={application_id}, file={file_id}"
    )

    return {"status": "analysis_queued", "file_id": file_id}


@router.get("/{application_id}/bank-statement-analysis")
async def get_bank_statement_analysis(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Returns the most recent bank statement analysis for an application.

    Admin callers only — parents/authenticated users receive 403.
    Returns 404 if no analysis record exists yet.
    """
    # Admin-only gate
    if not _is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: admin role required to view analysis results"
        )

    try:
        result = supabase_service.table("bank_statement_analyses").select("*").eq(
            "application_id", application_id
        ).order("created_at", desc=True).limit(1).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No bank statement analysis found for application {application_id}"
            )

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching bank statement analysis for {application_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
