from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from fastapi import HTTPException

from app.repositories.enrollment_repository import enrollment_repository
from app.repositories.declaration_repository import declaration_repository
from app.repositories.academic_repository import academic_repository
from app.repositories.next_of_kin_repository import next_of_kin_repository
from app.api.v1.schemas.enrollment import (
    AutoSaveRequest, AutoSaveResponse, EnrollmentData,
    SubmitEnrollmentResponse, ApplicationResponse,
    UploadSummaryResponse, SubmitApplicationRequest,
    SubmitApplicationResponse, ApplicationStatus, AcademicHistorySchema,
    ApplicationSummary, AcademicHistoryCreate, NextOfKinCreate,
    StudentInfoPartial, MedicalInfoPartial, FamilyInfoPartial, FeeResponsibilityInfoPartial
)

logger = logging.getLogger(__name__)


class EnrollmentService:
    """Service for enrollment business logic"""

    def __init__(self):
        self.repository = enrollment_repository

    def create_academic_history_from_student_data(self, application_id: str, student_data: Any) -> None:
        """
        Create academic history record from student information.
        
        Maps student fields to academic_history table:
        - previousSchool -> school_name
        - previousGrade -> last_grade_completed
        - gradeAppliedFor -> (used for context, not directly mapped)
        
        Args:
            application_id: Application ID
            student_data: Student information containing school details
        """
        try:
            # Only proceed if we have the required fields
            if not hasattr(student_data, 'previous_school') or not student_data.previous_school:
                logger.info(f"Skipping academic history creation - no previous_school for app {application_id}")
                return
            
            # Create academic history record from student information
            academic_data = AcademicHistoryCreate(
                application_id=application_id,
                school_name=student_data.previous_school,
                school_type='public',  # Default value, can be enhanced later
                last_grade_completed=student_data.previous_grade if hasattr(student_data, 'previous_grade') else 'Unknown',
                academic_year_completed=datetime.now().year - 1  # Last academic year
            )
            
            # Save to academic_repository
            academic_repository.create(academic_data)
            logger.info(f"Created academic history for application {application_id} with school: {student_data.previous_school}")
        except Exception as e:
            logger.warning(f"Failed to create academic history for application {application_id}: {str(e)}")
            # Don't raise - this is not critical to the main enrollment flow

    def get_or_create_application_for_user(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieves an existing application for a user or creates a new one.
        This ensures every authenticated user has an application ID upon login.
        """
        try:
            # Check if user already has ANY application (in_progress or submitted)
            existing_app = self.repository.get_user_application(user_id)

            if existing_app:
                application_id = str(existing_app['id'])
                status = existing_app.get('status', ApplicationStatus.IN_PROGRESS)
                logger.info(f"Found existing application {application_id} for user {user_id}")
                return {"application_id": application_id, "status": status}
            else:
                # Create a new application if none exists
                application_id = self.repository.create_application(user_id)
                logger.info(f"Created new application {application_id} for user {user_id}")
                return {"application_id": application_id, "status": ApplicationStatus.IN_PROGRESS}
        except Exception as e:
            logger.error(f"Failed to get or create application for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Could not retrieve or create user application.")

    def auto_save_enrollment(self, data: AutoSaveRequest, user_id: str) -> AutoSaveResponse:
        """Auto-save enrollment progress"""
        try:
            # This is the single source of truth. Get the application ID based ONLY on the authenticated user.
            # Ignore any application_id that might be sent in the request body.
            existing_app = self.repository.get_user_application(user_id)
            if existing_app:
                application_id = str(existing_app['id'])
                logger.info(f"Using existing application: {application_id}")
            else:
                application_id = self.repository.create_application(user_id)
                logger.info(f"Created new application with ID: {application_id} for auto-save")
 
            # Save provided data sections with error handling for each section
            saved_sections = []
            failed_sections = []

            if data.student:
                try:
                    self.repository.save_student_data_partial(application_id, data.student)
                    saved_sections.append("student")
                    # Create academic history from student data
                    self.create_academic_history_from_student_data(application_id, data.student)
                except Exception as e:
                    logger.warning(f"Failed to save student data: {str(e)}")
                    failed_sections.append("student")

            if data.medical:
                try:
                    self.repository.save_medical_data_partial(application_id, data.medical)
                    saved_sections.append("medical")
                except Exception as e:
                    logger.warning(f"Failed to save medical data: {str(e)}")
                    failed_sections.append("medical")

            if data.family:
                try:
                    self.repository.save_family_data_partial(application_id, data.family)
                    saved_sections.append("family")
                except Exception as e:
                    logger.warning(f"Failed to save family data: {str(e)}")
                    failed_sections.append("family")

            if data.fee:
                try:
                    self.repository.save_fee_data_partial(application_id, data.fee)
                    saved_sections.append("fee")
                except Exception as e:
                    logger.warning(f"Failed to save fee data: {str(e)}")
                    failed_sections.append("fee")

            if data.next_of_kin:
                try:
                    logger.info(f"=== NEXT OF KIN DATA RECEIVED IN AUTO-SAVE ===")
                    logger.info(f"Type: {type(data.next_of_kin)}")
                    logger.info(f"Data: {data.next_of_kin}")
                    self.save_next_of_kin_data_partial(application_id, data.next_of_kin)
                    saved_sections.append("next_of_kin")
                except Exception as e:
                    logger.warning(f"Failed to save next of kin data: {str(e)}")
                    logger.exception("Full next_of_kin save error:")
                    failed_sections.append("next_of_kin")
            else:
                logger.info(f"=== NO NEXT OF KIN DATA IN AUTO-SAVE REQUEST ===")

            message = "Progress saved successfully"
            if failed_sections:
                message = f"Progress saved partially. Sections saved: {', '.join(saved_sections)}. Failed: {', '.join(failed_sections)}"
                logger.warning(f"Auto-save partial success: {message}")

            return AutoSaveResponse(
                message=message,
                application_id=application_id
            )
        except Exception as e:
            logger.error(f"Failed to auto-save enrollment: {str(e)}")
            # Instead of raising HTTPException, return a graceful response
            # This prevents the frontend from getting 422/500 errors
            return AutoSaveResponse(
                message="Auto-save encountered a critical error.",
                application_id="unknown"
            )

    def submit_enrollment(self, data: EnrollmentData, user_id: str) -> SubmitEnrollmentResponse:
        """Submit complete enrollment"""
        try:
            logger.info(f"Submit enrollment called for user {user_id}")
            
            # Validate user_id is not None or empty
            if not user_id or user_id == "unknown":
                logger.error("Invalid user_id for enrollment submission")
                raise HTTPException(status_code=401, detail="User authentication required")
            
            # Check if user already has an application
            existing_app = self.repository.get_user_application(user_id)
            if existing_app:
                application_id = str(existing_app['id'])
                # Update status to submitted
                self.repository.update_application_status(application_id, ApplicationStatus.SUBMITTED, submitted_at=True)
                logger.info(f"Updating existing application {application_id} to submitted status")
            else:
                # Create new application if none exists (shouldn't happen in normal flow)
                application_id = self.repository.create_application(user_id, ApplicationStatus.SUBMITTED)
                logger.info(f"Created new submitted application with ID: {application_id}")

            # Log the data being inserted
            logger.info(f"Submitting enrollment for user {user_id}, application {application_id}")

            # Save all enrollment data with error handling for each step
            try:
                self.repository.save_student_data(application_id, data.student)
                # Create academic history from student data
                self.create_academic_history_from_student_data(application_id, data.student)
            except Exception as e:
                logger.error(f"Failed to save student data: {str(e)}")
                raise
                
            try:
                self.repository.save_medical_data(application_id, data.medical)
            except Exception as e:
                logger.error(f"Failed to save medical data: {str(e)}")
                raise
                
            try:
                self.repository.save_family_data(application_id, data.family)
            except Exception as e:
                logger.error(f"Failed to save family data: {str(e)}")
                raise
                
            try:
                self.repository.save_fee_data(application_id, data.fee)
            except Exception as e:
                logger.error(f"Failed to save fee data: {str(e)}")
                raise

            if data.next_of_kin:
                try:
                    self.save_next_of_kin_data(application_id, data.next_of_kin)
                except Exception as e:
                    logger.error(f"Failed to save next of kin data: {str(e)}")
                    raise

            logger.info(f"Successfully submitted enrollment for application {application_id}")
            return SubmitEnrollmentResponse(
                message="Enrollment submitted successfully",
                application_id=application_id
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to submit enrollment: {str(e)}", exc_info=True)
            # Provide more specific error information
            error_detail = str(e)
            if "unique constraint" in error_detail.lower() or "duplicate" in error_detail.lower():
                raise HTTPException(status_code=409, detail="Application data conflict. Please refresh and try again.")
            elif "foreign key" in error_detail.lower():
                raise HTTPException(status_code=400, detail="Invalid application reference. Please start fresh.")
            elif "authentication" in error_detail.lower() or "unauthorized" in error_detail.lower():
                raise HTTPException(status_code=401, detail="Authentication failed. Please log in again.")
            else:
                raise HTTPException(status_code=500, detail=f"Failed to submit enrollment: {error_detail}")

    def get_application(self, application_id: str, user_id: str) -> ApplicationResponse:
        """Get application by ID"""
        try:
            # First check if user owns this application
            app_check = self.repository.get_application_by_id_and_user(application_id, user_id)

            if not app_check:
                # If the user does not own the application, deny access.
                # We can also check if the app exists to return a 404 vs 403, but a 404 is often better for security.
                raise HTTPException(status_code=404, detail="Application not found or access denied")
 
            application_data = self.repository.get_full_application(application_id, user_id)

            return ApplicationResponse(**application_data)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get application {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get application: {str(e)}")

    def get_upload_summary(self, application_id: str, user_id: str) -> UploadSummaryResponse:
        """Get upload summary for application"""
        try:
            # Verify user owns this application
            app_check = self.repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=404, detail="Application not found")

            summary_data = self.repository.get_upload_summary(application_id)

            return UploadSummaryResponse(**summary_data)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get upload summary for {application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get upload summary: {str(e)}")

    def submit_application(self, data: SubmitApplicationRequest, user_id: str) -> SubmitApplicationResponse:
        """Submit full application"""
        try:
            # Check if user already has an application
            existing_app = self.repository.get_user_application(user_id)
            if existing_app:
                application_id = str(existing_app['id'])
                logger.info(f"Using existing application {application_id} for submission")
            else:
                # Create new application if none exists (shouldn't happen in normal flow)
                application_id = self.repository.create_application(user_id, ApplicationStatus.SUBMITTED)
                logger.info(f"Created new submitted application with ID: {application_id}")

            # Save all provided data sections
            if data.student:
                self.repository.save_student_data(application_id, data.student)
            if data.medical:
                self.repository.save_medical_data(application_id, data.medical)
            if data.family:
                self.repository.save_family_data(application_id, data.family)
            if data.fee:
                self.repository.save_fee_data(application_id, data.fee)

            # Save academic history if provided
            if data.academic_history:
                from app.repositories.academic_repository import academic_repository
                academic_data = AcademicHistoryCreate(
                    application_id=application_id,
                    school_name=data.academic_history.get("schoolName") or "N/A",
                    school_type=data.academic_history.get("schoolType") or "public",
                    last_grade_completed=data.academic_history.get("lastGradeCompleted") or "N/A",
                    academic_year_completed=str(data.academic_history.get("academicYearCompleted") or "2023"),
                    reason_for_leaving=data.academic_history.get("reasonForLeaving") or None,
                    principal_name=data.academic_history.get("principalName") or None,
                    school_phone_number=data.academic_history.get("schoolPhoneNumber") or None,
                    school_email=data.academic_history.get("schoolEmail") or None,
                    school_address=data.academic_history.get("schoolAddress") or None,
                    additional_notes=data.academic_history.get("additionalNotes") or None,
                    report_card_url=data.academic_history.get("reportCardUrl") or ""
                )
                academic_repository.create_academic_history(academic_data)

            # Update declaration fields if provided
            if data.declaration:
                update_data = {}
                if "agreeAuditStorage" in data.declaration:
                    update_data["agree_audit_storage"] = data.declaration["agreeAuditStorage"]
                if "agreeAffordabilityProcessing" in data.declaration:
                    update_data["agree_affordability_processing"] = data.declaration["agreeAffordabilityProcessing"]
                if update_data:
                    self.repository.update(application_id, update_data)

            # Update application status to submitted
            self.repository.update_application_status(application_id, ApplicationStatus.SUBMITTED, submitted_at=True)
            logger.info(f"Application {application_id} status updated to SUBMITTED - Step 6 is now complete")

            return SubmitApplicationResponse(
                message="Application submitted successfully",
                application_id=application_id
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to submit application: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to submit application: {str(e)}")

    def get_declaration(self, application_id: str, user_id: str) -> Dict[str, Any]:
        """Get declaration data for an application"""
        try:
            # Verify user owns this application
            app_check = self.repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied")

            # Get declaration data
            declaration_data = declaration_repository.get_declaration(application_id)
            
            if not declaration_data:
                # Return empty declaration object with default values instead of 404
                # This allows the frontend to start with a fresh form
                return {
                    "application_id": application_id,
                    "agree_truth": False,
                    "agree_policies": False,
                    "agree_financial": False,
                    "agree_verification": False,
                    "agree_data_processing": False,
                    "agree_audit_storage": False,
                    "agree_affordability_processing": False,
                    "full_name": "",
                    "city": "",
                    "signed": False
                }
            
            return declaration_data

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving declaration: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve declaration")

    def submit_declaration(self, data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Submit declaration data"""
        try:
            application_id = data.get('application_id')

            # Verify user owns this application
            if application_id:
                app_check = self.repository.get_application_by_id_and_user(application_id, user_id)
                if not app_check:
                    raise HTTPException(status_code=403, detail="Access denied")

            # Create application if none exists
            if not application_id:
                application_id = self.repository.create_application(user_id)

            # Save declaration data to declarations table
            declaration_data = {
                'agree_truth': data.get('agree_truth', False),
                'agree_policies': data.get('agree_policies', False),
                'agree_financial': data.get('agree_financial', False),
                'agree_verification': data.get('agree_verification', False),
                'agree_data_processing': data.get('agree_data_processing', False),
                'agree_audit_storage': data.get('agree_audit_storage', False),
                'agree_affordability_processing': data.get('agree_affordability_processing', False),
                'full_name': data.get('fullName', ''),
                'city': data.get('city', ''),
                'status': data.get('status', 'completed'),
                'signed': data.get('signed', False)
            }

            declaration_repository.save_declaration(application_id, declaration_data)

            return {
                "message": "Declaration submitted successfully",
                "application_id": application_id
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to submit declaration: {str(e)}")
            # Return generic error message to frontend, log details server-side only
            raise HTTPException(status_code=500, detail="Failed to submit declaration. Please try again.")

    def submit_academic_history(self, data: AcademicHistorySchema, user_id: str) -> Dict[str, Any]:
        """Create or update academic history for an application."""
        try:
            application_id = data.application_id
            # Verify user owns this application
            app_check = self.repository.get_application_by_id_and_user(application_id, user_id)
            if not app_check:
                raise HTTPException(status_code=403, detail="Access denied: You do not own this application.")

            from app.repositories.academic_repository import academic_repository
            
            # The create_academic_history method should handle both creation and updates (upsert)
            academic_repository.create_academic_history(data)

            return {
                "message": "Academic history submitted successfully",
                "application_id": application_id
            }
        except Exception as e:
            logger.error(f"Failed to submit academic history for application {data.application_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to submit academic history: {str(e)}")

    def save_next_of_kin_data_partial(self, application_id: str, data: Any) -> None:
        """Save next of kin data (partial auto-save)"""
        try:
            logger.info(f"=== SAVE_NEXT_OF_KIN_DATA_PARTIAL CALLED ===")
            logger.info(f"Application ID: {application_id}")
            logger.info(f"Data received: {data}")
            logger.info(f"Data type: {type(data)}")
            
            if not data:
                logger.info(f"No next_of_kin data provided for application {application_id}")
                return
            
            # Build the update data from the incoming data
            update_data = {}
            if hasattr(data, 'model_dump'):
                update_data = data.model_dump(exclude_unset=True)
            elif isinstance(data, dict):
                update_data = data
            
            logger.info(f"Next of kin raw data received: {update_data}")
            
            if not update_data:
                return
            
            # Map frontend field names to backend field names
            mapped_data = {}
            mapping = {
                'nextOfKinSurname': 'surname',
                'nextOfKinFirstName': 'first_name',
                'nextOfKinIdNumber': 'id_number',
                'nextOfKinRelationship': 'relationship',
                'nextOfKinMobile': 'mobile_number',
                'nextOfKinEmail': 'email_address',
                'nextOfKinPhone': 'phone_number',
                'nextOfKinAlternateMobile': 'alternate_mobile',
                'nextOfKinPhysicalAddress': 'physical_address',
            }
            
            for frontend_key, db_key in mapping.items():
                if frontend_key in update_data and update_data[frontend_key]:
                    mapped_data[db_key] = update_data[frontend_key]
            
            # Normalize relationship to match database CHECK constraint
            # Valid values: 'Mother', 'Father', 'Brother', 'Sister', 'Aunt', 'Uncle', 
            #               'Grandmother', 'Grandfather', 'Cousin', 'Guardian', 'Other'
            if 'relationship' in mapped_data:
                relationship = mapped_data['relationship']
                # Capitalize first letter to match database constraint format
                if relationship:
                    # Map common variations to valid values
                    relationship_map = {
                        'mother': 'Mother', 'mom': 'Mother', 'mum': 'Mother',
                        'father': 'Father', 'dad': 'Father',
                        'brother': 'Brother', 'bro': 'Brother',
                        'sister': 'Sister', 'sis': 'Sister',
                        'aunt': 'Aunt', 'auntie': 'Aunt',
                        'uncle': 'Uncle',
                        'grandmother': 'Grandmother', 'grandma': 'Grandmother', 'gran': 'Grandmother',
                        'grandfather': 'Grandfather', 'grandpa': 'Grandfather',
                        'cousin': 'Cousin',
                        'guardian': 'Guardian',
                        'other': 'Other',
                        'parent': 'Guardian', 'spouse': 'Other', 'sibling': 'Other',
                        'friend': 'Other', 'grandparent': 'Grandmother'
                    }
                    normalized = relationship_map.get(relationship.lower(), relationship.capitalize())
                    # Ensure it's a valid value
                    valid_values = ['Mother', 'Father', 'Brother', 'Sister', 'Aunt', 'Uncle', 
                                   'Grandmother', 'Grandfather', 'Cousin', 'Guardian', 'Other']
                    if normalized not in valid_values:
                        normalized = 'Other'
                    mapped_data['relationship'] = normalized
            
            logger.info(f"Next of kin mapped data: {mapped_data}")
            
            # Check if we have the required fields for creating a next_of_kin record
            required_fields = ['surname', 'first_name', 'relationship', 'mobile_number', 'email_address']
            missing_fields = [f for f in required_fields if f not in mapped_data or not mapped_data[f]]
            
            logger.info(f"Next of kin required fields check - mapped_data keys: {list(mapped_data.keys())}, missing: {missing_fields}")
            
            if missing_fields:
                logger.info(f"Skipping next_of_kin save - missing required fields: {missing_fields}")
                return
            
            # Add application_id
            mapped_data['application_id'] = application_id
            
            # Create or update using the repository
            next_of_kin_create = NextOfKinCreate(**mapped_data)
            logger.info(f"Attempting to save next_of_kin to database for application {application_id}: {mapped_data}")
            next_of_kin_repository.create_next_of_kin(next_of_kin_create)
            logger.info(f"Successfully saved next of kin data for application {application_id}")
        except Exception as e:
            logger.warning(f"Failed to save next of kin data: {str(e)}")
            # Don't raise - let the main auto-save continue

    def save_next_of_kin_data(self, application_id: str, data: Any) -> None:
        """Save next of kin data (complete submission)"""
        try:
            if not data:
                logger.info(f"No next_of_kin data provided for complete submission {application_id}")
                return
            
            # Build the data
            next_of_kin_data = {}
            if hasattr(data, 'model_dump'):
                next_of_kin_data = data.model_dump()
            elif isinstance(data, dict):
                next_of_kin_data = data
            
            logger.info(f"Next of kin complete submission raw data: {next_of_kin_data}")
            
            if not next_of_kin_data:
                return
            
            # Data comes from API already in snake_case (next_of_kin_surname, etc.)
            # Map to database field names (which are also snake_case but slightly different)
            mapped_data = {}
            mapping = {
                'next_of_kin_surname': 'surname',
                'next_of_kin_first_name': 'first_name',
                'next_of_kin_id_number': 'id_number',
                'next_of_kin_relationship': 'relationship',
                'next_of_kin_mobile': 'mobile_number',
                'next_of_kin_email': 'email_address',
                'next_of_kin_phone': 'phone_number',
                'next_of_kin_alternate_mobile': 'alternate_mobile',
                'next_of_kin_physical_address': 'physical_address',
            }
            
            for frontend_key, db_key in mapping.items():
                if frontend_key in next_of_kin_data and next_of_kin_data[frontend_key]:
                    mapped_data[db_key] = next_of_kin_data[frontend_key]
            
            logger.info(f"Next of kin complete mapped data: {mapped_data}")
            
            # Normalize relationship to match database CHECK constraint
            # Valid values: 'Mother', 'Father', 'Brother', 'Sister', 'Aunt', 'Uncle', 
            #               'Grandmother', 'Grandfather', 'Cousin', 'Guardian', 'Other'
            if 'relationship' in mapped_data:
                relationship = mapped_data['relationship']
                if relationship:
                    relationship_map = {
                        'mother': 'Mother', 'mom': 'Mother', 'mum': 'Mother',
                        'father': 'Father', 'dad': 'Father',
                        'brother': 'Brother', 'bro': 'Brother',
                        'sister': 'Sister', 'sis': 'Sister',
                        'aunt': 'Aunt', 'auntie': 'Aunt',
                        'uncle': 'Uncle',
                        'grandmother': 'Grandmother', 'grandma': 'Grandmother', 'gran': 'Grandmother',
                        'grandfather': 'Grandfather', 'grandpa': 'Grandfather',
                        'cousin': 'Cousin',
                        'guardian': 'Guardian',
                        'other': 'Other',
                        'parent': 'Guardian', 'spouse': 'Other', 'sibling': 'Other',
                        'friend': 'Other', 'grandparent': 'Grandmother'
                    }
                    normalized = relationship_map.get(relationship.lower(), relationship.capitalize())
                    valid_values = ['Mother', 'Father', 'Brother', 'Sister', 'Aunt', 'Uncle', 
                                   'Grandmother', 'Grandfather', 'Cousin', 'Guardian', 'Other']
                    if normalized not in valid_values:
                        normalized = 'Other'
                    mapped_data['relationship'] = normalized
            
            # Check if we have the required fields for creating a next_of_kin record
            required_fields = ['surname', 'first_name', 'relationship', 'mobile_number', 'email_address']
            missing_fields = [f for f in required_fields if f not in mapped_data or not mapped_data[f]]
            
            if missing_fields:
                logger.warning(f"Skipping next_of_kin save - missing required fields: {missing_fields}")
                return
            
            # Add application_id
            mapped_data['application_id'] = application_id
            
            # Create using the repository
            next_of_kin_create = NextOfKinCreate(**mapped_data)
            next_of_kin_repository.create_next_of_kin(next_of_kin_create)
            logger.info(f"✅ Successfully saved next of kin data for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to save next of kin data: {str(e)}")
            raise

# Global instance
enrollment_service = EnrollmentService()
