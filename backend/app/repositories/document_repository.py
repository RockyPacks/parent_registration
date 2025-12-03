"""
Repository for document-related database operations.
"""

from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
import logging
from app.repositories.base import BaseRepository
from app.api.v1.schemas.enrollment import DocumentType
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class DocumentRepository(BaseRepository):
    """
    Repository for document-related database operations.

    Handles file uploads, metadata storage, and document status tracking
    with proper error handling and data consistency.
    
    Note: This repository primarily uses the 'uploaded_files' table for all
    file storage operations. The 'application_documents' table is deprecated.
    """

    def __init__(self):
        super().__init__("uploaded_files")

    def save_document_metadata(self, user_id: str, application_id: str, document_type: str,
                             file_url: str, upload_status: str = "completed") -> str:
        """
        Save document metadata to uploaded_files table.
        
        Note: This is a simplified wrapper that calls save_file_record internally.
        For new code, prefer using save_file_record directly for more complete metadata.

        Args:
            user_id: ID of the user uploading the document
            application_id: Application ID
            document_type: Type of document being uploaded
            file_url: URL of the uploaded file
            upload_status: Upload status (default: completed)

        Returns:
            Document metadata ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Extract filename from URL if possible
            filename = file_url.split("/")[-1] if file_url else f"{document_type}_{uuid.uuid4()}"
            
            return self.save_file_record(
                application_id=application_id,
                filename=filename,
                original_filename=filename,
                file_size=0,  # Unknown from URL only
                content_type="application/octet-stream",
                document_type=document_type,
                bucket_name="documents",
                file_path=file_url,
                download_url=file_url,
                uploaded_by=user_id
            )
        except Exception as e:
            logger.error(f"Failed to save document metadata for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save document metadata")

    def save_file_record(self, application_id: str, filename: str, original_filename: str,
                        file_size: int, content_type: str, document_type: str,
                        bucket_name: str, file_path: str, download_url: str,
                        uploaded_by: str) -> str:
        """
        Save file record to uploaded_files table.
        
        Each file is stored as a separate row in the uploaded_files table.

        Args:
            application_id: Application ID
            filename: Processed filename
            original_filename: Original uploaded filename
            file_size: Size of the file in bytes
            content_type: MIME type of the file
            document_type: Type of document
            bucket_name: Storage bucket name
            file_path: Path in storage
            download_url: Public download URL
            uploaded_by: User who uploaded the file

        Returns:
            File record ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            file_id = str(uuid.uuid4())
            uploaded_files_data = {
                "id": file_id,
                "application_id": application_id,
                "filename": filename,
                "original_filename": original_filename,
                "file_size": file_size,
                "content_type": content_type,
                "document_type": document_type,
                "bucket_name": bucket_name,
                "file_path": file_path,
                "download_url": download_url,
                "uploaded_by": uploaded_by,
                "created_at": datetime.now().isoformat()
            }
            result = self.supabase.table("uploaded_files").insert(uploaded_files_data).execute()
            logger.info(f"Saved file record to uploaded_files for application {application_id}: {document_type}")
            
            return str(result.data[0]["id"])
        except Exception as e:
            logger.error(f"Failed to save file record for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save file record")

    def get_document_status(self, application_id: str) -> List[Dict[str, Any]]:
        """
        Get document upload status for application.

        Args:
            application_id: Application ID

        Returns:
            List of document status summaries by type

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Query uploaded_files table instead of application_documents
            docs_result = self.supabase.table("uploaded_files").select("*").eq("application_id", application_id).execute()

            # Group by document type
            summary = []
            doc_types = ["proof_of_address", "id_document", "payslip", "bank_statement"]

            # Define requirements for each document type
            requirements = {
                "proof_of_address": 1,
                "id_document": 2,
                "payslip": 3,
                "bank_statement": 1
            }

            for doc_type in doc_types:
                type_docs = [doc for doc in docs_result.data if doc.get("document_type") == doc_type]
                # All files in uploaded_files are considered completed
                completed_count = len(type_docs)
                required_count = requirements.get(doc_type, 1)

                summary.append({
                    "document_type": doc_type,
                    "uploaded_count": len(type_docs),
                    "required_count": required_count,
                    "completed": completed_count >= required_count,
                    "files": [{
                        "file_url": doc.get("download_url"),
                        "filename": doc.get("original_filename") or doc.get("filename") or f"{doc_type}_{doc.get('id', '')[:8]}.pdf"
                    } for doc in type_docs]
                })

            return summary
        except Exception as e:
            logger.error(f"Failed to get document status for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve document status")

    def get_uploaded_files(self, application_id: str) -> List[Dict[str, Any]]:
        """
        Get uploaded files for application.

        Args:
            application_id: Application ID

        Returns:
            List of uploaded file details

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Query uploaded_files table for file records
            result = self.supabase.table("uploaded_files").select("*").eq("application_id", application_id).execute()

            files = []
            for file_data in result.data:
                files.append({
                    "id": str(file_data["id"]),
                    "filename": file_data.get("filename", ""),
                    "original_filename": file_data.get("original_filename", ""),
                    "file_size": file_data.get("file_size", 0),
                    "content_type": file_data.get("content_type", "application/octet-stream"),
                    "document_type": file_data.get("document_type", "unknown"),
                    "download_url": file_data.get("download_url", ""),
                    "created_at": file_data.get("created_at", "")
                })

            return files
        except Exception as e:
            logger.error(f"Failed to get uploaded files for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve uploaded files")

    def delete_file(self, file_id: str, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Delete file record from uploaded_files table.

        Args:
            file_id: File record ID to delete
            application_id: Application ID for verification

        Returns:
            File data for cleanup or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Get file info before deletion
            file_result = self.supabase.table("uploaded_files").select("*").eq("id", file_id).eq("application_id", application_id).execute()
            if not file_result.data:
                return None

            file_data = file_result.data[0]

            # Delete from uploaded_files table
            self.supabase.table("uploaded_files").delete().eq("id", file_id).execute()
            
            logger.info(f"Deleted file {file_id} for application {application_id}")
            return file_data
            
        except Exception as e:
            logger.error(f"Failed to delete file {file_id} for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to delete file")

    def mark_upload_complete(self, application_id: str) -> None:
        """
        Mark document upload as complete.
        
        Note: This is now a no-op since we only use uploaded_files table.
        Upload completion is determined by counting files in uploaded_files.

        Args:
            application_id: Application ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # No-op - completion is determined by uploaded_files count
            logger.info(f"Upload marked complete for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to mark upload complete for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to mark upload complete")

    def get_upload_summary(self, application_id: str) -> Dict[str, Any]:
        """
        Get upload summary for application.

        Args:
            application_id: Application ID

        Returns:
            Upload summary with completion status

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Get all uploaded files for this application
            result = self.supabase.table("uploaded_files").select("*").eq("application_id", application_id).execute()
            
            if not result.data:
                return {"completed_categories": 0, "uploaded_types": [], "total_files": 0}
            
            # Get unique document types
            doc_types = set()
            for file_data in result.data:
                doc_type = file_data.get("document_type")
                if doc_type:
                    doc_types.add(doc_type)
            
            # Determine completion (all 4 categories must have files)
            required_types = {"proof_of_address", "id_document", "payslip", "bank_statement"}
            completed_count = len(doc_types.intersection(required_types))
            
            return {
                "completed_categories": completed_count,
                "uploaded_types": list(doc_types),
                "total_files": len(result.data)
            }
        except Exception as e:
            logger.error(f"Failed to get upload summary for {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve upload summary")

    def mark_document_type_complete(self, application_id: str, doc_type: str) -> None:
        """
        Mark document type as complete using database function.

        Args:
            application_id: Application ID
            doc_type: Document type to mark complete

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            self.supabase.rpc("mark_upload_complete", {
                "app_id": application_id,
                "doc_type": doc_type
            }).execute()
        except Exception as e:
            logger.error(f"Failed to mark document type {doc_type} complete for {application_id}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to mark {doc_type} complete")


# Global instance
document_repository = DocumentRepository()
