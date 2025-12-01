"""
Repository for academic-related database operations.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging
from app.repositories.base import BaseRepository
from app.api.v1.schemas.enrollment import (
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
            # Convert academic_year_completed to integer for database
            if insert_data.get("academic_year_completed"):
                insert_data["academic_year_completed"] = int(insert_data["academic_year_completed"])
            
            # Check if record already exists for this application_id
            existing = self.get_academic_history_by_application(insert_data["application_id"])
            
            if existing:
                # Update existing record
                logger.info(f"Updating existing academic history for application {insert_data['application_id']}")
                self.supabase.table(self.table_name).update(insert_data).eq("application_id", insert_data["application_id"]).execute()
                logger.info(f"Updated academic history for application {insert_data['application_id']}")
            else:
                # Insert new record
                logger.info(f"Creating new academic history for application {insert_data['application_id']}")
                result = self.supabase.table(self.table_name).insert(insert_data).execute()
                logger.info(f"Created academic history for application {insert_data['application_id']}: {result}")
            
            return str(insert_data.get("application_id", ""))
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
            # Convert academic_year_completed to integer for database if present
            if update_data.get("academic_year_completed"):
                update_data["academic_year_completed"] = int(update_data["academic_year_completed"])
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
