"""
Repository for enrollment-related database operations.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
from app.repositories.base import BaseRepository
from app.api.v1.schemas.enrollment import (
    StudentInfo, MedicalInfo, FamilyInfo, FeeResponsibilityInfo,
    ApplicationStatus, StudentInfoPartial, MedicalInfoPartial,
    FamilyInfoPartial, FeeResponsibilityInfoPartial
)
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class EnrollmentRepository(BaseRepository):
    """
    Repository for enrollment-related database operations.

    Handles application creation, updates, and retrieval with proper
    ownership verification and data consistency.
    """

    def __init__(self):
        super().__init__("applications")

    def create_application(self, user_id: str, status: ApplicationStatus = ApplicationStatus.IN_PROGRESS) -> str:
        """
        Create a new application.

        Args:
            user_id: ID of the user creating the application
            status: Initial application status

        Returns:
            Application ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        data = {
            "user_id": user_id,
            "status": status.value
        }
        result = self.insert(data)
        return str(result["id"])

    def get_application_by_id(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get application by ID regardless of ownership.

        Args:
            application_id: Application ID to retrieve

        Returns:
            Application data or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table(self.table_name).select("*").eq("id", application_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve application")

    def get_application_by_id_and_user(self, application_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get application by ID and verify ownership.

        Args:
            application_id: Application ID to retrieve
            user_id: User ID for ownership verification

        Returns:
            Application data or None if not found or not owned by user

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            if user_id is None:
                # Handle NULL user_id case
                result = self.supabase.table(self.table_name).select("*").eq("id", application_id).is_("user_id", None).execute()
            else:
                result = self.supabase.table(self.table_name).select("*").eq("id", application_id).eq("user_id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get application {application_id} for user {user_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve application")

    def get_user_application(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user's application (any status).

        Args:
            user_id: User ID

        Returns:
            Application data or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table(self.table_name).select("*").eq("user_id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get application for user {user_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve application")

    def update_application_status(self, application_id: str, status: ApplicationStatus, submitted_at: bool = False) -> None:
        """
        Update application status.

        Args:
            application_id: Application ID to update
            status: New application status
            submitted_at: Whether to set submission timestamp

        Raises:
            ExternalServiceError: If database operation fails
        """
        data = {"status": status.value}
        if submitted_at:
            data["submitted_at"] = datetime.now().isoformat()
        self.update(application_id, data)

    def save_student_data(self, application_id: str, student_data: StudentInfo) -> None:
        """
        Save student information.

        Args:
            application_id: Application ID
            student_data: Student information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = student_data.model_dump()
            data["application_id"] = application_id
            self.supabase.table("students").upsert(data).execute()
        except Exception as e:
            logger.error(f"Failed to save student data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save student information")

    def save_medical_data(self, application_id: str, medical_data: MedicalInfo) -> None:
        """
        Save medical information.

        Args:
            application_id: Application ID
            medical_data: Medical information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = medical_data.model_dump()
            data["application_id"] = application_id
            self.supabase.table("medical_info").upsert(data).execute()
        except Exception as e:
            logger.error(f"Failed to save medical data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save medical information")

    def save_family_data(self, application_id: str, family_data: FamilyInfo) -> None:
        """
        Save family information.

        Args:
            application_id: Application ID
            family_data: Family information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = family_data.model_dump()
            data["application_id"] = application_id

            # Sanitize and validate inputs with correct casing
            if "next_of_kin_surname" in data:
                data["next_of_kin_surname"] = str(data["next_of_kin_surname"]).strip().title()
            if "next_of_kin_first_name" in data:
                data["next_of_kin_first_name"] = str(data["next_of_kin_first_name"]).strip().title()
            if "next_of_kin_relationship" in data:
                data["next_of_kin_relationship"] = str(data["next_of_kin_relationship"]).strip().lower()
            if "next_of_kin_mobile" in data:
                # Sanitize mobile number - keep only digits, spaces, hyphens, parentheses, plus
                mobile = str(data["next_of_kin_mobile"]).strip()
                import re
                mobile = re.sub(r'[^\d\s\-\(\)\+]', '', mobile)
                data["next_of_kin_mobile"] = mobile
            if "next_of_kin_email" in data:
                data["next_of_kin_email"] = str(data["next_of_kin_email"]).strip().lower()

            # Fields are already in correct snake_case casing for database
            self.supabase.table("family_info").upsert(data).execute()
        except Exception as e:
            logger.error(f"Failed to save family data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save family information")

    def save_fee_data(self, application_id: str, fee_data: FeeResponsibilityInfo) -> None:
        """
        Save fee responsibility information.

        Args:
            application_id: Application ID
            fee_data: Fee responsibility information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = fee_data.model_dump()
            data["application_id"] = application_id

            # Note: selected_plan is now automatically managed by financing_service.save_financing_selection
            # This method no longer populates selected_plan to avoid conflicts

            self.supabase.table("fee_responsibility").upsert(data).execute()
        except Exception as e:
            logger.error(f"Failed to save fee data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save fee responsibility information")

    def save_student_data_partial(self, application_id: str, student_data: StudentInfoPartial) -> None:
        """
        Save partial student information.

        Args:
            application_id: Application ID
            student_data: Partial student information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = student_data.model_dump(exclude_unset=True)
            if data:  # Only update if there's data to update
                data["application_id"] = application_id
                self.supabase.table("students").upsert(data).execute()
        except Exception as e:
            logger.error(f"Failed to save partial student data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save student information")

    def save_medical_data_partial(self, application_id: str, medical_data: MedicalInfoPartial) -> None:
        """
        Save partial medical information.

        Args:
            application_id: Application ID
            medical_data: Partial medical information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = medical_data.model_dump(exclude_unset=True)
            if data:  # Only update if there's data to update
                data["application_id"] = application_id
                self.supabase.table("medical_info").upsert(data).execute()
        except Exception as e:
            logger.error(f"Failed to save partial medical data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save medical information")

    def save_family_data_partial(self, application_id: str, family_data: FamilyInfoPartial) -> None:
        """
        Save partial family information.

        Args:
            application_id: Application ID
            family_data: Partial family information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = family_data.model_dump(exclude_unset=True)
            if data:  # Only update if there's data to update
                data["application_id"] = application_id

                # Sanitize and validate inputs with correct casing
                if "next_of_kin_surname" in data:
                    data["next_of_kin_surname"] = str(data["next_of_kin_surname"]).strip().title()
                if "next_of_kin_first_name" in data:
                    data["next_of_kin_first_name"] = str(data["next_of_kin_first_name"]).strip().title()
                if "next_of_kin_relationship" in data:
                    data["next_of_kin_relationship"] = str(data["next_of_kin_relationship"]).strip().lower()
                if "next_of_kin_mobile" in data:
                    # Sanitize mobile number - keep only digits, spaces, hyphens, parentheses, plus
                    mobile = str(data["next_of_kin_mobile"]).strip()
                    import re
                    mobile = re.sub(r'[^\d\s\-\(\)\+]', '', mobile)
                    data["next_of_kin_mobile"] = mobile
                if "next_of_kin_email" in data:
                    data["next_of_kin_email"] = str(data["next_of_kin_email"]).strip().lower()

                # Fields are already in correct snake_case casing for database
                self.supabase.table("family_info").upsert(data).execute()
        except Exception as e:
            logger.error(f"Failed to save partial family data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save family information")

    def save_fee_data_partial(self, application_id: str, fee_data: FeeResponsibilityInfoPartial) -> None:
        """
        Save partial fee responsibility information.

        Args:
            application_id: Application ID
            fee_data: Partial fee responsibility information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = fee_data.model_dump(exclude_unset=True)
            if data:  # Only update if there's data to update
                data["application_id"] = application_id

                # Note: selected_plan is now automatically managed by financing_service.save_financing_selection
                # This method no longer populates selected_plan to avoid conflicts

                self.supabase.table("fee_responsibility").upsert(data).execute()
        except Exception as e:
            logger.error(f"Failed to save partial fee data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save fee responsibility information")

    def get_full_application(self, application_id: str) -> Dict[str, Any]:
        """
        Get complete application with all related data.

        Args:
            application_id: Application ID to retrieve

        Returns:
            Complete application data with all sections

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            application = self.get_by_id(application_id)
            if not application:
                return {}

            # Get related data
            student_result = self.supabase.table("students").select("*").eq("application_id", application_id).execute()
            medical_result = self.supabase.table("medical_info").select("*").eq("application_id", application_id).execute()
            family_result = self.supabase.table("family_info").select("*").eq("application_id", application_id).execute()
            fee_result = self.supabase.table("fee_responsibility").select("*").eq("application_id", application_id).execute()

            return {
                "id": application_id,
                "status": application.get("status", "in_progress"),
                "created_at": application.get("created_at"),
                "student": student_result.data[0] if student_result.data else {},
                "medical": medical_result.data[0] if medical_result.data else {},
                "family": family_result.data[0] if family_result.data else {},
                "fee": fee_result.data[0] if fee_result.data else {}
            }
        except ExternalServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to get full application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve complete application")

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
            # First try the view
            summary_result = self.supabase.table("application_upload_summary").select("*").eq("application_id", application_id).execute()
            if summary_result.data:
                return {
                    "completed_categories": summary_result.data[0].get("completed_categories", 0),
                    "uploaded_types": summary_result.data[0].get("uploaded_types", [])
                }

            # If no data from view (view only includes applications with documents), manually calculate
            docs_result = self.supabase.table("application_documents").select("document_type, upload_status").eq("application_id", application_id).execute()

            completed_types = []
            for doc in docs_result.data:
                if doc["upload_status"] == "completed":
                    completed_types.append(doc["document_type"])

            return {
                "completed_categories": len(set(completed_types)),
                "uploaded_types": sorted(list(set(completed_types)))
            }
        except Exception as e:
            logger.error(f"Failed to get upload summary for {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve upload summary")


# Global instance
enrollment_repository = EnrollmentRepository()
