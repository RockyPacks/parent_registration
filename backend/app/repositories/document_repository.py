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

        The uploaded_files table uses a JSONB 'files' array (one row per application).
        This method appends the new file entry to that array, creating the row if needed.

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
            uploaded_by: User who uploaded the file (stored as user_id)

        Returns:
            File entry ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            file_id = str(uuid.uuid4())
            new_file = {
                "id": file_id,
                "filename": filename,
                "original_filename": original_filename,
                "file_size": file_size,
                "content_type": content_type,
                "document_type": document_type,
                "bucket_name": bucket_name,
                "file_path": file_path,
                "download_url": download_url,
                "created_at": datetime.now().isoformat()
            }

            # Check if a row already exists for this application (UNIQUE constraint on application_id)
            existing = self.supabase.table("uploaded_files").select("id, files").eq("application_id", application_id).execute()

            if existing.data:
                # Append to existing files array
                current_files = existing.data[0].get("files") or []
                current_files.append(new_file)
                self.supabase.table("uploaded_files").update({
                    "files": current_files,
                    "updated_at": datetime.now().isoformat()
                }).eq("application_id", application_id).execute()
            else:
                # Insert new row with this file as the first entry
                self.supabase.table("uploaded_files").insert({
                    "application_id": application_id,
                    "user_id": uploaded_by,
                    "files": [new_file]
                }).execute()

            logger.info(f"Saved file record to uploaded_files for application {application_id}: {document_type}")
            return file_id
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
            result = self.supabase.table("uploaded_files").select("files").eq("application_id", application_id).execute()

            all_files = []
            if result.data:
                all_files = result.data[0].get("files") or []

            doc_types = ["proof_of_address", "id_document", "payslip", "bank_statement"]
            requirements = {
                "proof_of_address": 1,
                "id_document": 2,
                "payslip": 3,
                "bank_statement": 1
            }

            summary = []
            for doc_type in doc_types:
                type_docs = [f for f in all_files if f.get("document_type") == doc_type]
                required_count = requirements.get(doc_type, 1)
                summary.append({
                    "document_type": doc_type,
                    "uploaded_count": len(type_docs),
                    "required_count": required_count,
                    "completed": len(type_docs) >= required_count,
                    "files": [{
                        "file_url": f.get("download_url"),
                        "filename": f.get("original_filename") or f.get("filename") or f"{doc_type}.pdf"
                    } for f in type_docs]
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
            List of uploaded file details (from the JSONB files array)

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table("uploaded_files").select("files").eq("application_id", application_id).execute()

            if not result.data:
                return []

            files_data = result.data[0].get("files") or []
            return [
                {
                    "id": f.get("id", ""),
                    "filename": f.get("filename", ""),
                    "original_filename": f.get("original_filename", ""),
                    "file_size": f.get("file_size", 0),
                    "content_type": f.get("content_type", "application/octet-stream"),
                    "document_type": f.get("document_type", "unknown"),
                    "download_url": f.get("download_url", ""),
                    "created_at": f.get("created_at", "")
                }
                for f in files_data
            ]
        except Exception as e:
            logger.error(f"Failed to get uploaded files for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve uploaded files")

    def delete_file(self, file_id: str, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Delete a file entry from the JSONB files array in uploaded_files.

        Args:
            file_id: File entry ID (inside the files JSONB array)
            application_id: Application ID for row lookup

        Returns:
            The deleted file data, or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table("uploaded_files").select("id, files").eq("application_id", application_id).execute()
            if not result.data:
                return None

            files_data = result.data[0].get("files") or []
            file_to_delete = next((f for f in files_data if f.get("id") == file_id), None)
            if not file_to_delete:
                return None

            new_files = [f for f in files_data if f.get("id") != file_id]
            self.supabase.table("uploaded_files").update({
                "files": new_files,
                "updated_at": datetime.now().isoformat()
            }).eq("application_id", application_id).execute()

            logger.info(f"Deleted file {file_id} for application {application_id}")
            return file_to_delete

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
            result = self.supabase.table("uploaded_files").select("files").eq("application_id", application_id).execute()

            if not result.data:
                return {"completed_categories": 0, "uploaded_types": [], "total_files": 0}

            files_data = result.data[0].get("files") or []

            doc_types = set()
            for f in files_data:
                doc_type = f.get("document_type")
                if doc_type:
                    doc_types.add(doc_type)

            required_types = {"proof_of_address", "id_document", "payslip", "bank_statement"}
            completed_count = len(doc_types.intersection(required_types))

            return {
                "completed_categories": completed_count,
                "uploaded_types": list(doc_types),
                "total_files": len(files_data)
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
