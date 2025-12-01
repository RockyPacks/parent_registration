"""
Service for next of kin (emergency contact) business logic.
"""

from typing import Optional
import logging
from fastapi import HTTPException

from app.repositories.next_of_kin_repository import next_of_kin_repository
from app.repositories.enrollment_repository import enrollment_repository
from app.api.v1.schemas.enrollment import (
    NextOfKinCreate, NextOfKinResponse, NextOfKinUpdate
)

logger = logging.getLogger(__name__)


class NextOfKinService:
    """Service for next of kin business logic"""

    def __init__(self):
        self.repository = next_of_kin_repository
        self.enrollment_repository = enrollment_repository

    def create_next_of_kin(self, data: NextOfKinCreate, user_id: str) -> NextOfKinResponse:
        """Create next of kin record"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repository.get_application_by_id_and_user(data.application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            # Check if next of kin already exists for this application
            existing = self.repository.get_next_of_kin_by_application(data.application_id)
            if existing:
                # Update existing record instead of raising error
                update_data = NextOfKinUpdate(**data.model_dump())
                return self.update_next_of_kin(data.application_id, update_data, user_id)

            # Create the record
            record_id = self.repository.create_next_of_kin(data)

            # Retrieve and return the created record
            created_record = self.repository.get_next_of_kin_by_application(data.application_id)
            if not created_record:
                raise HTTPException(status_code=500, detail="Failed to retrieve created next of kin record")

            return NextOfKinResponse(**created_record)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create next of kin: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create next of kin: {str(e)}")

    def get_next_of_kin(self, application_id: str, user_id: str) -> Optional[NextOfKinResponse]:
        """Get next of kin by application ID"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            record = self.repository.get_next_of_kin_by_application(application_id)
            if not record:
                return None

            return NextOfKinResponse(**record)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get next of kin for application {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get next of kin: {str(e)}")

    def update_next_of_kin(self, application_id: str, data: NextOfKinUpdate, user_id: str) -> NextOfKinResponse:
        """Update next of kin record"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            # Get existing record
            existing = self.repository.get_next_of_kin_by_application(application_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Next of kin record not found")

            # Update the record
            self.repository.update_next_of_kin(application_id, data)

            # Return updated record
            updated = self.repository.get_next_of_kin_by_application(application_id)
            if not updated:
                raise HTTPException(status_code=500, detail="Failed to retrieve updated next of kin record")

            return NextOfKinResponse(**updated)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update next of kin for application {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update next of kin: {str(e)}")

    def delete_next_of_kin(self, application_id: str, user_id: str) -> None:
        """Delete next of kin record"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            # Get existing record
            existing = self.repository.get_next_of_kin_by_application(application_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Next of kin record not found")

            # Delete the record
            self.repository.delete_next_of_kin(application_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to delete next of kin for application {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to delete next of kin: {str(e)}")


# Global instance
next_of_kin_service = NextOfKinService()
