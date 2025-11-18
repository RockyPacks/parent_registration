"""
Repository for academic-related database operations.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging
from app.repositories.base import BaseRepository
from app.api.v1.schemas.academic import (
    AcademicHistoryCreate, AcademicHistoryUpdate
)
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class AcademicRepository(BaseRepository):
    """
    Repository for academic-related database operations.

    Handles academic history creation, updates, and retrieval with proper
    ownership verification and data consistency.
    """

    def __init__(self):
        super().__init__("academic_history")

    def create_academic_history(self, data: AcademicHistoryCreate) -> str:
        """
        Create or update academic history record.

        Args:
            data: Academic history data to create or update

        Returns:
            Record ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            insert_data = data.model_dump()
            logger.info(f"Upserting academic history data: {insert_data}")
            result = self.upsert(insert_data, on_conflict_fields=["application_id"])
            logger.info(f"Upsert result: {result}")
            return str(result.get("application_id", ""))
        except Exception as e:
            logger.error(f"Failed to create academic history: {str(e)}")
            raise ExternalServiceError("Database", "Failed to create academic history")

    def get_academic_history_by_application(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get academic history by application ID.

        Args:
            application_id: Application ID to retrieve academic history for

        Returns:
            Academic history data or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table(self.table_name).select("*").eq("application_id", application_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get academic history for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve academic history")

    def update_academic_history(self, application_id: str, data: AcademicHistoryUpdate) -> None:
        """
        Update academic history record by application_id.

        Args:
            application_id: Application ID to update
            data: Updated data

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            update_data = data.model_dump(exclude_unset=True)
            if update_data:
                result = self.supabase.table(self.table_name).update(update_data).eq("application_id", application_id).execute()
                if not result.data:
                    logger.warning(f"No academic history record found for application_id {application_id}")
        except Exception as e:
            logger.error(f"Failed to update academic history for application_id {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to update academic history")

    def update_academic_history_by_application_id(self, application_id: str, data: AcademicHistoryUpdate) -> None:
        """
        Update academic history record by application_id using direct update.

        Args:
            application_id: Application ID to update
            data: Updated data

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            update_data = data.model_dump(exclude_unset=True)
            if update_data:
                result = self.supabase.table(self.table_name).update(update_data).eq("application_id", application_id).execute()
                if not result.data:
                    logger.warning(f"No academic history record found for application_id {application_id}")
                logger.info(f"Update result: {result}")
        except Exception as e:
            logger.error(f"Failed to update academic history for application_id {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to update academic history")

    def delete_academic_history(self, application_id: str) -> None:
        """
        Delete academic history record by application_id.

        Args:
            application_id: Application ID to delete

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table(self.table_name).delete().eq("application_id", application_id).execute()
            if not result.data:
                logger.warning(f"No academic history record found for application_id {application_id}")
        except Exception as e:
            logger.error(f"Failed to delete academic history for application_id {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to delete academic history")


# Global instance
academic_repository = AcademicRepository()
