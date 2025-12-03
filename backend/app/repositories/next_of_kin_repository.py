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


def sync_to_financing_selections(application_id: str) -> None:
    """
    Helper function to sync next_of_kin data to financing_selections table.
    Imported lazily to avoid circular imports.
    """
    try:
        from app.repositories.financing_repository import financing_repository
        financing_repository.sync_next_of_kin_to_financing(application_id)
    except Exception as e:
        logger.warning(f"Failed to sync next_of_kin to financing_selections: {str(e)}")


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
            logger.info(f"=== CREATE_NEXT_OF_KIN CALLED ===")
            logger.info(f"Data received: {data}")
            
            insert_data = data.model_dump()
            logger.info(f"Insert data after model_dump: {insert_data}")
            
            application_id = insert_data["application_id"]
            
            # Check if record already exists for this application_id
            existing = self.get_next_of_kin_by_application(application_id)
            
            if existing:
                # Update existing record
                logger.info(f"Updating existing next of kin for application {application_id}")
                logger.info(f"Executing UPDATE query with data: {insert_data}")
                result = self.supabase.table(self.table_name).update(insert_data).eq("application_id", application_id).execute()
                logger.info(f"UPDATE result: {result}")
            else:
                # Insert new record
                logger.info(f"Creating new next of kin for application {application_id}")
                logger.info(f"Executing INSERT query with data: {insert_data}")
                result = self.supabase.table(self.table_name).insert(insert_data).execute()
                logger.info(f"INSERT result: {result}")
                logger.info(f"INSERT result data: {result.data if hasattr(result, 'data') else 'no data attr'}")
            
            # Sync to financing_selections table - DISABLED: table removed
            # sync_to_financing_selections(application_id)
            
            logger.info(f"✅ Successfully saved next of kin for application {application_id}")
            return str(application_id)
        except Exception as e:
            logger.error(f"❌ Failed to create next of kin: {str(e)}")
            logger.exception("Full error details:")
            raise ExternalServiceError("Database", f"Failed to create next of kin: {str(e)}")

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
                # else:
                    # Sync to financing_selections table - DISABLED: table removed
                    # sync_to_financing_selections(application_id)
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
