from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from fastapi import HTTPException

from app.repositories.enrollment_repository import enrollment_repository
from app.repositories.declaration_repository import declaration_repository
from app.api.v1.schemas.enrollment import (
    AutoSaveRequest, AutoSaveResponse, EnrollmentData,
    SubmitEnrollmentResponse, ApplicationResponse,
    UploadSummaryResponse, SubmitApplicationRequest,
    SubmitApplicationResponse, ApplicationStatus, AcademicHistorySchema,
    ApplicationSummary, # Add this import
    StudentInfoPartial, MedicalInfoPartial, FamilyInfoPartial, FeeResponsibilityInfoPartial
)

logger = logging.getLogger(__name__)


class EnrollmentService:
    """Service for enrollment business logic"""

    def __init__(self):
        self.repository = enrollment_repository

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
            logger.debug(f"Enrollment data: {data}")
            
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

            # Save all enrollment data
            logger.debug("Saving student data...")
            self.repository.save_student_data(application_id, data.student)
            logger.debug("Saving medical data...")
            self.repository.save_medical_data(application_id, data.medical)
            logger.debug("Saving family data...")
            self.repository.save_family_data(application_id, data.family)
            logger.debug("Saving fee data...")
            self.repository.save_fee_data(application_id, data.fee)

            logger.info(f"Successfully submitted enrollment for application {application_id}")
            return SubmitEnrollmentResponse(
                message="Enrollment submitted successfully",
                application_id=application_id
            )
        except Exception as e:
            logger.error(f"Failed to submit enrollment: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to submit enrollment: {str(e)}")

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
                from app.api.v1.schemas.academic import AcademicHistoryCreate
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

            return SubmitApplicationResponse(
                message="Application submitted successfully",
                application_id=application_id
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to submit application: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to submit application: {str(e)}")

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
                'status': data.get('status', 'completed')
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
            raise HTTPException(status_code=500, detail=f"Failed to submit declaration: {str(e)}")

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

# Global instance
enrollment_service = EnrollmentService()
