"""
Repository for next of kin (emergency contact) database operations.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging
from app.repositories.base import BaseRepository
from app.api.v1.schemas.enrollment import NextOfKinCreate, NextOfKinUpdate
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class NextOfKinRepository(BaseRepository):
    """
    Repository for next of kin database operations.
    
    Handles next of kin record creation, updates, and retrieval with proper
    data validation and error handling.
    """

    def __init__(self):
        super().__init__("next_of_kin")

    def create_next_of_kin(self, data: NextOfKinCreate) -> str:
        """
        Create a next of kin record.

        Args:
            data: Next of kin data to create

        Returns:
            Record ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            insert_data = data.model_dump()
            
            # Check if record already exists for this application_id
            existing = self.get_next_of_kin_by_application(insert_data["application_id"])
            
            if existing:
                # Update existing record
                logger.info(f"Updating existing next of kin for application {insert_data['application_id']}")
                self.supabase.table(self.table_name).update(insert_data).eq("application_id", insert_data["application_id"]).execute()
                logger.info(f"Updated next of kin for application {insert_data['application_id']}")
            else:
                # Insert new record
                logger.info(f"Creating new next of kin for application {insert_data['application_id']}")
                result = self.supabase.table(self.table_name).insert(insert_data).execute()
                logger.info(f"Created next of kin for application {insert_data['application_id']}: {result}")
            
            return str(insert_data.get("application_id", ""))
        except Exception as e:
            logger.error(f"Failed to create next of kin: {str(e)}")
            raise ExternalServiceError("Database", "Failed to create next of kin")

    def get_next_of_kin_by_application(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get next of kin by application ID.

        Args:
            application_id: Application ID to retrieve next of kin for

        Returns:
            Next of kin data or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table(self.table_name).select("*").eq("application_id", application_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get next of kin for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve next of kin")

    def update_next_of_kin(self, application_id: str, data: NextOfKinUpdate) -> None:
        """
        Update next of kin record by application_id.

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
                    logger.warning(f"No next of kin record found for application_id {application_id}")
        except Exception as e:
            logger.error(f"Failed to update next of kin for application_id {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to update next of kin")

    def delete_next_of_kin(self, application_id: str) -> None:
        """
        Delete next of kin record by application_id.

        Args:
            application_id: Application ID to delete

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table(self.table_name).delete().eq("application_id", application_id).execute()
            if not result.data:
                logger.warning(f"No next of kin record found for application_id {application_id}")
        except Exception as e:
            logger.error(f"Failed to delete next of kin for application_id {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to delete next of kin")


# Global instance
next_of_kin_repository = NextOfKinRepository()
