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
            logger.debug(f"Saving student data for application {application_id}: {data}")
            
            # First, check if a student record already exists for this application
            existing = self.supabase.table("students").select("*").eq("application_id", application_id).execute()
            
            if existing.data and len(existing.data) > 0:
                # Update existing record
                existing_id = existing.data[0]['id']
                result = self.supabase.table("students").update(data).eq("id", existing_id).execute()
                logger.info(f"Updated existing student record {existing_id} for application {application_id}")
            else:
                # Insert new record
                result = self.supabase.table("students").insert(data).execute()
                logger.info(f"Inserted new student record for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to save student data for application {application_id}: {str(e)}", exc_info=True)
            raise ExternalServiceError("Database", f"Failed to save student information: {str(e)}")

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
            
            # Check if record already exists for this application
            existing = self.supabase.table("medical_info").select("id").eq("application_id", application_id).execute()
            
            if existing.data and len(existing.data) > 0:
                # Update existing record
                self.supabase.table("medical_info").update(data).eq("application_id", application_id).execute()
                logger.info(f"Updated medical info for application {application_id}")
            else:
                # Insert new record
                self.supabase.table("medical_info").insert(data).execute()
                logger.info(f"Inserted medical info for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to save medical data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save medical information")

    def save_family_data(self, application_id: str, family_data: FamilyInfo) -> None:
        """
        Save family information to parents table.
        
        The parents table uses a normalized structure with one row per parent:
        - Each parent (father/mother) is stored as a separate row
        - The 'relationship' column indicates 'father' or 'mother'

        Args:
            application_id: Application ID
            family_data: Family information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Delete existing parent records for this application to avoid duplicates
            self.supabase.table("parents").delete().eq("application_id", application_id).execute()
            logger.info(f"Cleared existing parent records for application {application_id}")
            
            # Insert father data if provided
            if family_data.father_surname and family_data.father_first_name:
                father_data = {
                    "application_id": application_id,
                    "relationship": "father",
                    "surname": family_data.father_surname,
                    "first_name": family_data.father_first_name,
                    "id_number": family_data.father_id_number,
                    "mobile": family_data.father_mobile,
                    "email": family_data.father_email,
                    "is_primary": True  # Father is primary by default
                }
                self.supabase.table("parents").insert(father_data).execute()
                logger.info(f"Inserted father record for application {application_id}")
            
            # Insert mother data if provided
            if family_data.mother_surname and family_data.mother_first_name:
                mother_data = {
                    "application_id": application_id,
                    "relationship": "mother",
                    "surname": family_data.mother_surname,
                    "first_name": family_data.mother_first_name,
                    "id_number": family_data.mother_id_number,
                    "mobile": family_data.mother_mobile,
                    "email": family_data.mother_email,
                    "is_primary": False  # Mother is secondary by default
                }
                self.supabase.table("parents").insert(mother_data).execute()
                logger.info(f"Inserted mother record for application {application_id}")

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

            # Check if record already exists for this application
            existing = self.supabase.table("fee_responsibility").select("id").eq("application_id", application_id).execute()
            
            if existing.data and len(existing.data) > 0:
                # Update existing record
                self.supabase.table("fee_responsibility").update(data).eq("application_id", application_id).execute()
                logger.info(f"Updated fee responsibility for application {application_id}")
            else:
                # Insert new record
                self.supabase.table("fee_responsibility").insert(data).execute()
                logger.info(f"Inserted fee responsibility for application {application_id}")
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
                # Try update first, if no rows affected, insert new
                result = self.supabase.table("students").update(data).eq("application_id", application_id).execute()
                if not result.data:
                    # No existing record, insert instead
                    self.supabase.table("students").insert(data).execute()
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
                
                # Check if record already exists for this application
                existing = self.supabase.table("medical_info").select("id").eq("application_id", application_id).execute()
                
                if existing.data and len(existing.data) > 0:
                    # Update existing record
                    self.supabase.table("medical_info").update(data).eq("application_id", application_id).execute()
                    logger.info(f"Updated partial medical info for application {application_id}")
                else:
                    # Insert new record
                    self.supabase.table("medical_info").insert(data).execute()
                    logger.info(f"Inserted partial medical info for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to save partial medical data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save medical information")

    def save_family_data_partial(self, application_id: str, family_data: FamilyInfoPartial) -> None:
        """
        Save partial family information to parents table.
        
        The parents table uses a normalized structure with one row per parent.

        Args:
            application_id: Application ID
            family_data: Partial family information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Check if father data is being updated
            has_father_data = (
                (family_data.father_surname is not None and family_data.father_surname) or
                (family_data.father_first_name is not None and family_data.father_first_name)
            )
            
            # Check if mother data is being updated
            has_mother_data = (
                (family_data.mother_surname is not None and family_data.mother_surname) or
                (family_data.mother_first_name is not None and family_data.mother_first_name)
            )
            
            if has_father_data:
                # Build father update data
                father_data = {"application_id": application_id, "relationship": "father"}
                if family_data.father_surname is not None:
                    father_data["surname"] = family_data.father_surname
                if family_data.father_first_name is not None:
                    father_data["first_name"] = family_data.father_first_name
                if family_data.father_id_number is not None:
                    father_data["id_number"] = family_data.father_id_number
                if family_data.father_mobile is not None:
                    father_data["mobile"] = family_data.father_mobile
                if family_data.father_email is not None:
                    father_data["email"] = family_data.father_email
                father_data["is_primary"] = True
                
                # Check if father record exists
                existing_father = self.supabase.table("parents").select("*").eq("application_id", application_id).eq("relationship", "father").execute()
                
                if existing_father.data and len(existing_father.data) > 0:
                    # Update existing father record
                    self.supabase.table("parents").update(father_data).eq("id", existing_father.data[0]['id']).execute()
                    logger.info(f"Updated father record (partial) for application {application_id}")
                elif father_data.get("surname") and father_data.get("first_name"):
                    # Insert new father record only if we have required fields
                    self.supabase.table("parents").insert(father_data).execute()
                    logger.info(f"Inserted father record (partial) for application {application_id}")
            
            if has_mother_data:
                # Build mother update data
                mother_data = {"application_id": application_id, "relationship": "mother"}
                if family_data.mother_surname is not None:
                    mother_data["surname"] = family_data.mother_surname
                if family_data.mother_first_name is not None:
                    mother_data["first_name"] = family_data.mother_first_name
                if family_data.mother_id_number is not None:
                    mother_data["id_number"] = family_data.mother_id_number
                if family_data.mother_mobile is not None:
                    mother_data["mobile"] = family_data.mother_mobile
                if family_data.mother_email is not None:
                    mother_data["email"] = family_data.mother_email
                mother_data["is_primary"] = False
                
                # Check if mother record exists
                existing_mother = self.supabase.table("parents").select("*").eq("application_id", application_id).eq("relationship", "mother").execute()
                
                if existing_mother.data and len(existing_mother.data) > 0:
                    # Update existing mother record
                    self.supabase.table("parents").update(mother_data).eq("id", existing_mother.data[0]['id']).execute()
                    logger.info(f"Updated mother record (partial) for application {application_id}")
                elif mother_data.get("surname") and mother_data.get("first_name"):
                    # Insert new mother record only if we have required fields
                    self.supabase.table("parents").insert(mother_data).execute()
                    logger.info(f"Inserted mother record (partial) for application {application_id}")

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

                # Check if record already exists for this application
                existing = self.supabase.table("fee_responsibility").select("id").eq("application_id", application_id).execute()
                
                if existing.data and len(existing.data) > 0:
                    # Update existing record
                    self.supabase.table("fee_responsibility").update(data).eq("application_id", application_id).execute()
                    logger.info(f"Updated partial fee responsibility for application {application_id}")
                else:
                    # Insert new record
                    self.supabase.table("fee_responsibility").insert(data).execute()
                    logger.info(f"Inserted partial fee responsibility for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to save partial fee data for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save fee responsibility information")

    def get_full_application(self, application_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get complete application with all related data and verify ownership.

        Args:
            application_id: Application ID to retrieve
            user_id: User ID for ownership verification

        Returns:
            Complete application data with all sections

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Use the ownership-verified method
            application = self.get_application_by_id_and_user(application_id, user_id)
            if not application:
                # If application is not found or not owned by the user, return empty or raise specific error
                # Based on get_application in service, a 403/404 will be raised there.
                # Here we return empty if it's not found/owned.
                return {}

            # Get related data
            student_result = self.supabase.table("students").select("*").eq("application_id", application_id).execute()
            medical_result = self.supabase.table("medical_info").select("*").eq("application_id", application_id).execute()
            family_result = self.supabase.table("parents").select("*").eq("application_id", application_id).execute()
            fee_result = self.supabase.table("fee_responsibility").select("*").eq("application_id", application_id).execute()
            academic_history_result = self.supabase.table("academic_history").select("*").eq("application_id", application_id).execute()
            # Use uploaded_files table for file storage
            documents_result = self.supabase.table("uploaded_files").select("*").eq("application_id", application_id).execute()
            # financing_result = self.supabase.table("financing_selections").select("*").eq("application_id", application_id).execute()  # Table removed
            declaration_result = self.supabase.table("declarations").select("*").eq("application_id", application_id).execute()
            # Get next of kin data from separate table
            next_of_kin_result = self.supabase.table("next_of_kin").select("*").eq("application_id", application_id).execute()

            # Transform normalized parent rows into the format frontend expects
            family_data = {}
            if family_result.data:
                for parent in family_result.data:
                    relationship = parent.get("relationship", "").lower()
                    if relationship == "father":
                        family_data["father_surname"] = parent.get("surname")
                        family_data["father_first_name"] = parent.get("first_name")
                        family_data["father_id_number"] = parent.get("id_number")
                        family_data["father_mobile"] = parent.get("mobile")
                        family_data["father_email"] = parent.get("email")
                    elif relationship == "mother":
                        family_data["mother_surname"] = parent.get("surname")
                        family_data["mother_first_name"] = parent.get("first_name")
                        family_data["mother_id_number"] = parent.get("id_number")
                        family_data["mother_mobile"] = parent.get("mobile")
                        family_data["mother_email"] = parent.get("email")

            return {
                "id": application_id,
                "status": application.get("status", "in_progress"),
                "created_at": application.get("created_at"),
                "submitted_at": application.get("submitted_at"),
                "student": student_result.data[0] if student_result.data else {},
                "medical": medical_result.data[0] if medical_result.data else {},
                "family": family_data,
                "fee": fee_result.data[0] if fee_result.data else {},
                "academic_history": academic_history_result.data if academic_history_result.data else [],
                "documents": documents_result.data if documents_result.data else [],
                "financing_selections": self._get_financing_from_fee_responsibility(fee_result),  # Get from fee_responsibility.selected_plan
                "declaration": declaration_result.data[0] if declaration_result.data else {},
                "next_of_kin": next_of_kin_result.data[0] if next_of_kin_result.data else {}
            }
        except ExternalServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to get full application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve complete application")

    def _get_financing_from_fee_responsibility(self, fee_result) -> list:
        """
        Extract financing selection (selected_plan) from fee_responsibility result.
        
        Args:
            fee_result: The fee_responsibility query result
            
        Returns:
            List with single dict containing plan_type, or empty list if no plan selected
        """
        if fee_result.data and len(fee_result.data) > 0:
            selected_plan = fee_result.data[0].get("selected_plan")
            if selected_plan:
                return [{"plan_type": selected_plan}]
        return []

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
            files_result = self.supabase.table("uploaded_files").select("*").eq("application_id", application_id).execute()
            
            if not files_result.data:
                return {
                    "completed_categories": 0,
                    "uploaded_types": [],
                    "total_files": 0
                }
            
            # Extract unique document types from uploaded files
            doc_types = set()
            for file_data in files_result.data:
                doc_type = file_data.get("document_type")
                if doc_type:
                    doc_types.add(doc_type)
            
            # Define required document categories
            required_types = {"proof_of_address", "id_document", "payslip", "bank_statement"}
            
            # Count how many categories have at least one file
            completed_count = len(doc_types.intersection(required_types))
            
            return {
                "completed_categories": completed_count,
                "uploaded_types": sorted(list(doc_types)),
                "total_files": len(files_result.data)
            }
        except Exception as e:
            logger.error(f"Failed to get upload summary for {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve upload summary")


    def get_applications_by_user_email(self, user_email: str, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all applications associated with a user email, verifying ownership.

        Args:
            user_email: The email of the user to search for applications.
            user_id: The ID of the authenticated user for ownership verification.

        Returns:
            A list of application dictionaries.

        Raises:
            ExternalServiceError: If database operation fails.
        """
        try:
            # First, check if there's a user in the 'users' table matching the email
            # This step is important for security and data integrity.
            user_check_result = self.supabase.table("users").select("id").eq("email", user_email).execute()

            if not user_check_result.data:
                logger.warning(f"No user found with email {user_email}.")
                return [] # No user found, so no applications.

            target_user_id = user_check_result.data[0]['id']

            # Ensure the authenticated user (user_id) is either the target user
            # or has appropriate permissions (not implemented here, but good to consider).
            # For now, we'll assume the user can only fetch their own applications by email.
            if str(user_id) != str(target_user_id):
                logger.warning(f"User {user_id} attempted to access applications for email {user_email} (ID: {target_user_id}) without ownership.")
                return [] # Deny access if not the owner

            result = self.supabase.table(self.table_name).select("id").eq("user_id", target_user_id).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Failed to get applications for user email {user_email}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to retrieve applications for email {user_email}")


# Global instance
enrollment_repository = EnrollmentRepository()
