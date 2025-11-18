"""
Repository for document-related database operations.
"""

from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
import logging
from app.repositories.base import BaseRepository
from app.api.v1.schemas.documents import DocumentType
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class DocumentRepository(BaseRepository):
    """
    Repository for document-related database operations.

    Handles file uploads, metadata storage, and document status tracking
    with proper error handling and data consistency.
    """

    def __init__(self):
        super().__init__("application_documents")

    def save_document_metadata(self, user_id: str, application_id: str, document_type: str,
                             file_url: str, upload_status: str = "completed") -> str:
        """
        Save document metadata.

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
        data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "application_id": application_id,
            "document_type": document_type,
            "file_url": file_url,
            "upload_status": upload_status
        }
        result = self.insert(data)
        return str(result["id"])

    def save_file_record(self, application_id: str, filename: str, original_filename: str,
                        file_size: int, content_type: str, document_type: str,
                        bucket_name: str, file_path: str, download_url: str,
                        uploaded_by: str) -> str:
        """
        Save file record to documents table.

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
            data = {
                "id": str(uuid.uuid4()),
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
            result = self.supabase.table("documents").insert(data).execute()
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
            docs_result = self.supabase.table("application_documents").select("*").eq("application_id", application_id).execute()

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
                completed_count = len([doc for doc in type_docs if doc.get("upload_status") == "completed"])
                required_count = requirements.get(doc_type, 1)

                summary.append({
                    "document_type": doc_type,
                    "uploaded_count": len(type_docs),
                    "required_count": required_count,
                    "completed": completed_count >= required_count,
                    "files": [{
                        "file_url": doc.get("file_url"),
                        "filename": f"{doc_type}_{doc.get('id')[:8]}.pdf"  # Mock filename
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
            files_result = self.supabase.table("documents").select("*").eq("application_id", application_id).execute()

            files = []
            for file_data in files_result.data:
                files.append({
                    "id": str(file_data["id"]),
                    "filename": file_data["filename"],
                    "original_filename": file_data["original_filename"],
                    "file_size": file_data["file_size"],
                    "content_type": file_data["content_type"],
                    "document_type": file_data["document_type"],
                    "download_url": file_data["download_url"],
                    "created_at": file_data["created_at"]
                })

            return files
        except Exception as e:
            logger.error(f"Failed to get uploaded files for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve uploaded files")

    def delete_file(self, file_id: str, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Delete file record and return file data for cleanup.

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
            file_result = self.supabase.table("documents").select("*").eq("id", file_id).eq("application_id", application_id).execute()
            if not file_result.data:
                return None

            file_data = file_result.data[0]

            # Delete from both tables
            self.supabase.table("documents").delete().eq("id", file_id).execute()
            self.supabase.table("application_documents").delete().eq("file_url", file_data["download_url"]).execute()

            return file_data
        except Exception as e:
            logger.error(f"Failed to delete file {file_id} for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to delete file")

    def mark_upload_complete(self, application_id: str) -> None:
        """
        Mark document upload as complete.

        Args:
            application_id: Application ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            self.supabase.table("applications").update({
                "documents_completed": True
            }).eq("id", application_id).execute()
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
            summary_result = self.supabase.table("application_upload_summary").select("*").eq("application_id", application_id).execute()
            if summary_result.data:
                return {
                    "completed_categories": summary_result.data[0].get("completed_categories", 0),
                    "uploaded_types": summary_result.data[0].get("uploaded_types", [])
                }
            return {"completed_categories": 0, "uploaded_types": []}
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
