from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
import logging
from fastapi import HTTPException, UploadFile
from app.repositories.document_repository import document_repository
from app.repositories.enrollment_repository import enrollment_repository
from app.api.v1.schemas.documents import (
    DocumentStatusResponse, FileUploadResponse, UploadedFilesResponse,
    DeleteFileResponse, CompleteUploadResponse, UploadSummaryResponse
)
from app.core.config import settings
from app.db.supabase_client import supabase_service

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for document management business logic"""

    def __init__(self):
        self.repository = document_repository
        self.enrollment_repo = enrollment_repository

    def get_document_status(self, application_id: str, user_id: str) -> DocumentStatusResponse:
        """Get document upload status"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repo.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=404, detail="Application not found")

            summary = self.repository.get_document_status(application_id)

            return DocumentStatusResponse(
                application_id=application_id,
                summary=summary
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get document status for {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get document status: {str(e)}")

    def upload_file(self, file: UploadFile, application_id: str, document_type: str, user_id: str) -> FileUploadResponse:
        """Upload file to Supabase Storage with security validations"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repo.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            # Validate document type
            bucket_mapping = {
                "proof_of_address": "proof_of_address",
                "id_document": "id_documents",
                "payslip": "payslips",
                "bank_statement": "bank_statements",
                "academic_history": "academic_history",
                "transcript": "id_documents"
            }
            if document_type not in bucket_mapping:
                raise HTTPException(status_code=400, detail="Invalid document type")

            # Security: Validate file size (max 10MB)
            max_file_size = 10 * 1024 * 1024  # 10MB
            file_content = file.file.read()
            if len(file_content) > max_file_size:
                raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")

            # Security: Additional validation - prevent empty files
            if len(file_content) == 0:
                raise HTTPException(status_code=400, detail="File cannot be empty")

            # Security: Validate file type
            allowed_content_types = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
            if file.content_type not in allowed_content_types:
                raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, images, and Word documents are allowed")

            # Security: Validate file extension matches content type
            file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
            allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx']
            if file_extension not in allowed_extensions:
                raise HTTPException(status_code=400, detail="Invalid file extension")

            # Generate unique filename with security
            unique_filename = f"{user_id}/{application_id}/{document_type}_{uuid.uuid4()}.{file_extension}"

            # Upload to Supabase Storage
            bucket_name = bucket_mapping[document_type]
            try:
                storage_response = supabase_service.storage.from_(bucket_name).upload(
                    unique_filename,
                    file_content,
                    file_options={
                        "content-type": file.content_type or "application/pdf",
                        "upsert": False
                    }
                )
            except Exception as storage_error:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to upload file to storage: {str(storage_error)}"
                )

            # Get public URL
            file_url = supabase_service.storage.from_(bucket_name).get_public_url(unique_filename)

            # Save document metadata
            doc_id = self.repository.save_document_metadata(user_id, application_id, document_type, file_url)

            # Save file record
            file_id = self.repository.save_file_record(
                application_id=application_id,
                filename=f"{document_type}_{doc_id[:8]}.{file_extension}",
                original_filename=file.filename,
                file_size=len(file_content),
                content_type=file.content_type or "application/pdf",
                document_type=document_type,
                bucket_name=bucket_name,
                file_path=unique_filename,
                download_url=file_url,
                uploaded_by=user_id
            )

            return FileUploadResponse(
                success=True,
                message="File uploaded successfully",
                file={
                    "id": file_id,
                    "filename": file.filename,
                    "size": len(file_content),
                    "content_type": file.content_type or "application/pdf",
                    "document_type": document_type,
                    "bucket_name": bucket_name,
                    "download_url": file_url,
                    "created_at": datetime.now().isoformat()
                }
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to upload file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    def get_uploaded_files(self, application_id: str, user_id: str) -> UploadedFilesResponse:
        """Get uploaded files for application"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repo.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=404, detail="Application not found")

            files = self.repository.get_uploaded_files(application_id)

            return UploadedFilesResponse(files=files)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get uploaded files for {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get uploaded files: {str(e)}")

    def delete_file(self, application_id: str, file_id: str, user_id: str) -> DeleteFileResponse:
        """Delete uploaded file"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repo.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            file_data = self.repository.delete_file(file_id, application_id)
            if not file_data:
                raise HTTPException(status_code=404, detail="File not found")

            # Delete from storage
            try:
                supabase_service.storage.from_(file_data["bucket_name"]).remove([file_data["file_path"]])
            except Exception as e:
                # Log but don't fail if storage deletion fails
                logger.warning(f"Failed to delete from storage: {str(e)}")

            return DeleteFileResponse(message="File deleted successfully")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to delete file {file_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

    def complete_upload(self, data: Dict[str, Any], user_id: str) -> CompleteUploadResponse:
        """Mark document upload as complete"""
        try:
            application_id = data.get("application_id")

            # Verify user owns this application
            app_check = self.enrollment_repo.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            self.repository.mark_upload_complete(application_id)

            return CompleteUploadResponse(message="Document upload completed")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to complete upload for {data.get('application_id')}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to complete document upload: {str(e)}")

    def get_upload_summary(self, application_id: str, user_id: str) -> UploadSummaryResponse:
        """Get upload summary for application"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repo.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=404, detail="Application not found")

            summary_data = self.repository.get_upload_summary(application_id)

            return UploadSummaryResponse(**summary_data)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get upload summary for {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get upload summary: {str(e)}")

    def mark_complete(self, application_id: str, doc_type: str, user_id: str) -> Dict[str, str]:
        """Mark document type as complete"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repo.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            self.repository.mark_document_type_complete(application_id, doc_type)

            return {"message": f"Document type {doc_type} marked as complete"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to mark document type {doc_type} complete for {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to mark document complete: {str(e)}")


# Global instance
document_service = DocumentService()
