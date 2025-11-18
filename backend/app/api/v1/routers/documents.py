from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Dict, Any

from app.api.v1.schemas.documents import (
    DocumentStatusResponse, FileUploadResponse, UploadedFilesResponse,
    DeleteFileResponse, CompleteUploadResponse, UploadSummaryResponse
)
from app.services.document_service import document_service
from app.core.security import get_current_user

router = APIRouter()

@router.get("/{application_id}", response_model=DocumentStatusResponse)
async def get_document_status(
    application_id: str,
    current_user: dict = Depends(get_current_user)
) -> DocumentStatusResponse:
    """Get document upload status"""
    return document_service.get_document_status(application_id, current_user.get("id"))

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    document_type: str = Form(...),
    current_user: dict = Depends(get_current_user)
) -> FileUploadResponse:
    """Upload file to Supabase Storage"""
    return document_service.upload_file(file, application_id, document_type, current_user.get("id"))

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
