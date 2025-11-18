"""
Service for academic business logic.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging
from fastapi import HTTPException

from app.repositories.academic_repository import academic_repository
from app.repositories.enrollment_repository import enrollment_repository
from app.api.v1.schemas.academic import (
    AcademicHistoryCreate, AcademicHistoryResponse, AcademicHistoryUpdate
)

logger = logging.getLogger(__name__)


class AcademicService:
    """Service for academic business logic"""

    def __init__(self):
        self.repository = academic_repository
        self.enrollment_repository = enrollment_repository

    def create_academic_history(self, data: AcademicHistoryCreate, user_id: str) -> AcademicHistoryResponse:
        """Create academic history record"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repository.get_application_by_id_and_user(data.application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            # Check if academic history already exists for this application
            existing = self.repository.get_academic_history_by_application(data.application_id)
            if existing:
                # Update existing record instead of raising error
                update_data = AcademicHistoryUpdate(**data.model_dump())
                return self.update_academic_history(data.application_id, update_data, user_id)

            # Create the record
            record_id = self.repository.create_academic_history(data)

            # Retrieve and return the created record using get_academic_history_by_application
            created_record = self.repository.get_academic_history_by_application(data.application_id)
            if not created_record:
                raise HTTPException(status_code=500, detail="Failed to retrieve created academic history")

            return AcademicHistoryResponse(**created_record)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create academic history: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create academic history: {str(e)}")

    def get_academic_history(self, application_id: str, user_id: str) -> Optional[AcademicHistoryResponse]:
        """Get academic history by application ID"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            record = self.repository.get_academic_history_by_application(application_id)
            if not record:
                return None

            return AcademicHistoryResponse(**record)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get academic history for application {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get academic history: {str(e)}")

    def update_academic_history(self, application_id: str, data: AcademicHistoryUpdate, user_id: str) -> AcademicHistoryResponse:
        """Update academic history record"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            # Get existing record
            existing = self.repository.get_academic_history_by_application(application_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Academic history not found")

            # Update the record using upsert for better handling
            self.repository.update_academic_history_by_application_id(application_id, data)

            # Return updated record
            updated = self.repository.get_academic_history_by_application(application_id)
            if not updated:
                raise HTTPException(status_code=500, detail="Failed to retrieve updated academic history")

            return AcademicHistoryResponse(**updated)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update academic history for application {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update academic history: {str(e)}")

    def delete_academic_history(self, application_id: str, user_id: str) -> None:
        """Delete academic history record"""
        try:
            # Verify user owns this application
            app_check = self.enrollment_repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            # Get existing record
            existing = self.repository.get_academic_history_by_application(application_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Academic history not found")

            # Delete the record using application_id as the key
            self.repository.delete_academic_history(application_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to delete academic history for application {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to delete academic history: {str(e)}")


# Global instance
academic_service = AcademicService()
