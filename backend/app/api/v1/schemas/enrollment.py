"""
Pydantic schemas for enrollment-related API operations.

This module defines all data models used for enrollment processes,
including student information, medical details, family information,
and fee responsibility data.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum


class ApplicationStatus(str, Enum):
    """Enumeration of possible application statuses."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class StudentInfo(BaseModel):
    """
    Student information schema.

    Contains all required and optional student details for enrollment.
    """
    surname: str = Field(..., min_length=1, max_length=100, description="Student's surname")
    first_name: str = Field(..., min_length=1, max_length=100, description="Student's first name")
    middle_name: Optional[str] = Field(None, max_length=100, description="Student's middle name")
    preferred_name: Optional[str] = Field(None, max_length=100, description="Student's preferred name")
    date_of_birth: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Date of birth in YYYY-MM-DD format")
    gender: str = Field(..., pattern=r'^(male|female|other)$', description="Student's gender")
    home_language: str = Field(..., min_length=1, max_length=50, description="Student's home language")
    id_number: str = Field(..., pattern=r'^\d{13}$', description="13-digit South African ID number")
    previous_grade: str = Field(..., min_length=1, max_length=20, description="Previous grade completed")
    grade_applied_for: str = Field(..., min_length=1, max_length=20, description="Grade applying for")
    previous_school: str = Field(..., min_length=1, max_length=100, description="Previous school attended")


class StudentInfoPartial(BaseModel):
    """
    Partial student information schema for auto-save.

    Allows partial updates to student data.
    """
    surname: Optional[str] = Field(None, min_length=1, max_length=100, description="Student's surname")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Student's first name")
    middle_name: Optional[str] = Field(None, max_length=100, description="Student's middle name")
    preferred_name: Optional[str] = Field(None, max_length=100, description="Student's preferred name")
    date_of_birth: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$', description="Date of birth in YYYY-MM-DD format")
    gender: Optional[str] = Field(None, pattern=r'^(male|female|other)$', description="Student's gender")
    home_language: Optional[str] = Field(None, min_length=1, max_length=50, description="Student's home language")
    id_number: Optional[str] = Field(None, pattern=r'^\d{13}$', description="13-digit South African ID number")
    previous_grade: Optional[str] = Field(None, min_length=1, max_length=20, description="Previous grade completed")
    grade_applied_for: Optional[str] = Field(None, min_length=1, max_length=20, description="Grade applying for")
    previous_school: Optional[str] = Field(None, min_length=1, max_length=100, description="Previous school attended")


class MedicalInfo(BaseModel):
    """
    Medical information schema.

    Contains medical aid details, conditions, and allergies.
    """
    medical_aid_name: Optional[str] = Field(None, max_length=100, description="Medical aid scheme name")
    member_number: Optional[str] = Field(None, max_length=50, description="Medical aid member number")
    conditions: List[str] = Field(default_factory=list, description="List of medical conditions")
    allergies: Optional[str] = Field(None, max_length=500, description="Known allergies")


class MedicalInfoPartial(BaseModel):
    """
    Partial medical information schema for auto-save.

    Allows partial updates to medical data.
    """
    medical_aid_name: Optional[str] = Field(None, max_length=100, description="Medical aid scheme name")
    member_number: Optional[str] = Field(None, max_length=50, description="Medical aid member number")
    conditions: Optional[List[str]] = Field(None, description="List of medical conditions")
    allergies: Optional[str] = Field(None, max_length=500, description="Known allergies")


class FamilyInfo(BaseModel):
    """
    Family information schema.

    Contains parent/guardian contact and identification details.
    """
    father_surname: Optional[str] = Field(None, max_length=100, description="Father's surname")
    father_first_name: Optional[str] = Field(None, max_length=100, description="Father's first name")
    father_id_number: Optional[str] = Field(None, pattern=r'^\d{13}$', description="Father's ID number")
    father_mobile: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$', description="Father's mobile number")
    father_email: Optional[str] = Field(None, description="Father's email address")

    mother_surname: Optional[str] = Field(None, max_length=100, description="Mother's surname")
    mother_first_name: Optional[str] = Field(None, max_length=100, description="Mother's first name")
    mother_id_number: Optional[str] = Field(None, pattern=r'^\d{13}$', description="Mother's ID number")
    mother_mobile: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$', description="Mother's mobile number")
    mother_email: Optional[str] = Field(None, description="Mother's email address")

    next_of_kin_surname: Optional[str] = Field(None, max_length=100, description="Next of kin's surname")
    next_of_kin_first_name: Optional[str] = Field(None, max_length=100, description="Next of kin's first name")
    next_of_kin_relationship: Optional[str] = Field(None, max_length=50, description="Next of kin's relationship")
    next_of_kin_mobile: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$', description="Next of kin's mobile number")
    next_of_kin_email: Optional[str] = Field(None, description="Next of kin's email address")


class FamilyInfoPartial(BaseModel):
    """
    Partial family information schema for auto-save.

    Allows partial updates to family data.
    """
    father_surname: Optional[str] = Field(None, max_length=100, description="Father's surname")
    father_first_name: Optional[str] = Field(None, max_length=100, description="Father's first name")
    father_id_number: Optional[str] = Field(None, pattern=r'^\d{13}$', description="Father's ID number")
    father_mobile: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$', description="Father's mobile number")
    father_email: Optional[str] = Field(None, description="Father's email address")

    mother_surname: Optional[str] = Field(None, max_length=100, description="Mother's surname")
    mother_first_name: Optional[str] = Field(None, max_length=100, description="Mother's first name")
    mother_id_number: Optional[str] = Field(None, pattern=r'^\d{13}$', description="Mother's ID number")
    mother_mobile: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$', description="Mother's mobile number")
    mother_email: Optional[str] = Field(None, description="Mother's email address")

    next_of_kin_surname: Optional[str] = Field(None, max_length=100, description="Next of kin's surname")
    next_of_kin_first_name: Optional[str] = Field(None, max_length=100, description="Next of kin's first name")
    next_of_kin_relationship: Optional[str] = Field(None, max_length=50, description="Next of kin's relationship")
    next_of_kin_mobile: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$', description="Next of kin's mobile number")
    next_of_kin_email: Optional[str] = Field(None, description="Next of kin's email address")


class FeeResponsibilityInfo(BaseModel):
    """
    Fee responsibility information schema.

    Contains details about who is responsible for school fees,
    including complete parent/guardian information and banking details.
    """
    fee_person: str = Field(..., min_length=1, max_length=200, description="Person responsible for fees")
    relationship: str = Field(..., min_length=1, max_length=50, description="Relationship to student")
    fee_terms_accepted: bool = Field(default=False, description="Whether fee terms have been accepted")
    selected_plan: Optional[str] = Field(None, max_length=100, description="Selected financing plan")
    # Parent/Guardian information
    parent_id_number: Optional[str] = Field(None, pattern=r'^\d{13}$', description="Parent/Guardian ID number")
    parent_first_name: Optional[str] = Field(None, max_length=100, description="Parent/Guardian first name")
    parent_surname: Optional[str] = Field(None, max_length=100, description="Parent/Guardian surname")
    parent_email: Optional[str] = Field(None, description="Parent/Guardian email address")
    parent_mobile: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$', description="Parent/Guardian mobile number")
    # Banking details
    bank_name: Optional[str] = Field(None, max_length=100, description="Bank name for fee payments")
    branch_code: Optional[str] = Field(None, max_length=6, description="Bank branch code (6 digits)")
    account_number: Optional[str] = Field(None, max_length=12, description="Bank account number for fee deductions")
    account_type: Optional[str] = Field(None, max_length=50, description="Bank account type (e.g., Cheque, Savings, Current)")


class FeeResponsibilityInfoPartial(BaseModel):
    """
    Partial fee responsibility information schema for auto-save.

    Allows partial updates to fee data, including parent information and banking details.
    """
    fee_person: Optional[str] = Field(None, min_length=1, max_length=200, description="Person responsible for fees")
    relationship: Optional[str] = Field(None, min_length=1, max_length=50, description="Relationship to student")
    fee_terms_accepted: Optional[bool] = Field(None, description="Whether fee terms have been accepted")
    selected_plan: Optional[str] = Field(None, max_length=100, description="Selected financing plan")
    # Parent/Guardian information
    parent_id_number: Optional[str] = Field(None, pattern=r'^\d{13}$', description="Parent/Guardian ID number")
    parent_first_name: Optional[str] = Field(None, max_length=100, description="Parent/Guardian first name")
    parent_surname: Optional[str] = Field(None, max_length=100, description="Parent/Guardian surname")
    parent_email: Optional[str] = Field(None, description="Parent/Guardian email address")
    parent_mobile: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]+$', description="Parent/Guardian mobile number")
    # Banking details
    bank_name: Optional[str] = Field(None, max_length=100, description="Bank name for fee payments")
    branch_code: Optional[str] = Field(None, max_length=6, description="Bank branch code (6 digits)")
    account_number: Optional[str] = Field(None, max_length=12, description="Bank account number for fee deductions")
    account_type: Optional[str] = Field(None, max_length=50, description="Bank account type (e.g., Cheque, Savings, Current)")
    """
    Declaration information schema.

    Contains declaration confirmations and signature details.
    """
    agree_truth: bool = Field(default=False, description="Agreement to truth of information")
    agree_policies: bool = Field(default=False, description="Agreement to school policies")
    agree_financial: bool = Field(default=False, description="Agreement to financial responsibility")
    agree_verification: bool = Field(default=False, description="Consent to information verification")
    agree_data_processing: bool = Field(default=False, description="Consent to data processing")
    agree_audit_storage: bool = Field(default=False, description="Consent to audit storage")
    agree_affordability_processing: bool = Field(default=False, description="Consent to affordability processing")
    full_name: str = Field(..., min_length=1, max_length=150, description="Full name for digital signature")
    city: Optional[str] = Field(None, max_length=100, description="City for signature")
    date_signed: Optional[str] = Field(None, description="Date of signature")
    status: str = Field(default="in_progress", max_length=20, description="Declaration status")


class EnrollmentData(BaseModel):
    """
    Complete enrollment data schema.

    Combines all enrollment information sections.
    """
    student: StudentInfo
    medical: MedicalInfo
    family: FamilyInfo
    fee: FeeResponsibilityInfo
    next_of_kin: Optional[Any] = None  # Will accept NextOfKinCreate


class AutoSaveRequest(BaseModel):
    """
    Auto-save request schema.

    Allows partial updates to enrollment data.
    """
    application_id: Optional[str] = Field(None, description="Application ID (optional for new applications)")
    student: Optional[StudentInfoPartial] = None
    medical: Optional[MedicalInfoPartial] = None
    family: Optional[FamilyInfoPartial] = None
    fee: Optional[FeeResponsibilityInfoPartial] = None
    next_of_kin: Optional[Any] = None  # Will accept NextOfKinPartial


class AutoSaveResponse(BaseModel):
    """Auto-save response schema."""
    message: str
    application_id: str


class SubmitEnrollmentResponse(BaseModel):
    """Submit enrollment response schema."""
    message: str
    application_id: str


class ApplicationResponse(BaseModel):
    """
    Complete application response schema.

    Returns full application data with all sections.
    """
    id: str
    status: ApplicationStatus
    created_at: Optional[str]
    submitted_at: Optional[str]
    student: Dict[str, Any]
    medical: Dict[str, Any]
    family: Dict[str, Any]
    fee: Dict[str, Any]
    academic_history: Optional[List[Dict[str, Any]]] = []
    documents: Optional[List[Dict[str, Any]]] = []
    financing_selections: Optional[List[Dict[str, Any]]] = []
    declaration: Optional[Dict[str, Any]] = {}


class UploadSummaryResponse(BaseModel):
    """Upload summary response schema."""
    completed_categories: int
    uploaded_types: List[str]


class SubmitApplicationRequest(BaseModel):
    """Submit application request schema."""
    application_id: str = Field(..., min_length=1, description="Application ID to submit")
    student: Optional[StudentInfo] = None
    medical: Optional[MedicalInfo] = None
    family: Optional[FamilyInfo] = None
    fee: Optional[FeeResponsibilityInfo] = None
    academic_history: Optional[Dict[str, Any]] = None
    subjects: Optional[Dict[str, Any]] = None
    financing: Optional[Dict[str, Any]] = None
    declaration: Optional[Dict[str, Any]] = None


class ApplicationSummary(BaseModel):
    """
    Summary schema for an application.
    Used when listing applications, e.g., by user email.
    """
    application_id: str = Field(..., description="Unique identifier for the application")

class SubmitApplicationResponse(BaseModel):
    """Submit application response schema."""
    message: str
    application_id: str


class AcademicHistorySchema(BaseModel):
    """
    Academic history schema.
    """
    application_id: str
    school_name: str
    school_type: str
    last_grade_completed: str
    academic_year_completed: int
    reason_for_leaving: Optional[str] = None
    principal_name: Optional[str] = None
    school_phone_number: Optional[str] = None
    school_email: Optional[str] = None
    school_address: Optional[str] = None
    additional_notes: Optional[str] = Field(None, alias='additionalNotes')
    report_card_url: Optional[str] = Field(None, alias='reportCardUrl')


# ============================================================================
# ACADEMIC HISTORY SCHEMAS
# ============================================================================

class AcademicHistoryCreate(BaseModel):
    """Schema for creating academic history records."""
    application_id: str = Field(..., description="Application ID")
    school_name: str = Field(..., min_length=1, max_length=200, description="Name of the school")
    school_type: str = Field(..., min_length=1, max_length=50, description="Type of school")
    last_grade_completed: str = Field(..., min_length=1, max_length=20, description="Last grade completed")
    academic_year_completed: str = Field(..., min_length=4, max_length=4, description="Year completed")
    reason_for_leaving: Optional[str] = Field(None, description="Reason for leaving the school")
    principal_name: Optional[str] = Field(None, max_length=100, description="Principal's name")
    school_phone_number: Optional[str] = Field(None, max_length=20, description="School phone number")
    school_email: Optional[str] = Field(None, description="School email address")
    school_address: Optional[str] = Field(None, description="School address")
    additional_notes: Optional[str] = Field(None, description="Additional notes")
    report_card_url: Optional[str] = Field(None, description="URL of uploaded report card")


class AcademicHistoryResponse(BaseModel):
    """Schema for academic history response."""
    id: Optional[str] = None
    application_id: str
    school_name: str
    school_type: str
    last_grade_completed: str
    academic_year_completed: Optional[int] = None
    reason_for_leaving: Optional[str]
    principal_name: Optional[str]
    school_phone_number: Optional[str]
    school_email: Optional[str]
    school_address: Optional[str]
    additional_notes: Optional[str]
    report_card_url: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AcademicHistoryUpdate(BaseModel):
    """Schema for updating academic history records."""
    school_name: Optional[str] = Field(None, min_length=1, max_length=200)
    school_type: Optional[str] = Field(None, min_length=1, max_length=50)
    last_grade_completed: Optional[str] = Field(None, min_length=1, max_length=20)
    academic_year_completed: Optional[str] = Field(None, min_length=4, max_length=4)
    reason_for_leaving: Optional[str] = None
    principal_name: Optional[str] = Field(None, max_length=100)
    school_phone_number: Optional[str] = Field(None, max_length=20)
    school_email: Optional[str] = None
    school_address: Optional[str] = None
    additional_notes: Optional[str] = None
    report_card_url: str


# ============================================================================
# NEXT OF KIN SCHEMAS
# ============================================================================

class NextOfKinCreate(BaseModel):
    """Schema for creating next of kin records."""
    application_id: str = Field(..., description="Application ID")
    surname: str = Field(..., min_length=1, max_length=100, description="Surname of next of kin")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name of next of kin")
    id_number: Optional[str] = Field(None, max_length=50, description="ID number of next of kin")
    relationship: str = Field(..., min_length=1, max_length=50, description="Relationship to student")
    mobile_number: str = Field(..., min_length=1, max_length=20, description="Primary mobile number")
    email_address: str = Field(..., description="Email address")
    phone_number: Optional[str] = Field(None, max_length=20, description="Alternative phone number")
    alternate_mobile: Optional[str] = Field(None, max_length=20, description="Alternate mobile number")
    physical_address: Optional[str] = Field(None, max_length=500, description="Physical address")


class NextOfKinUpdate(BaseModel):
    """Schema for updating next of kin records."""
    surname: Optional[str] = Field(None, min_length=1, max_length=100)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    id_number: Optional[str] = Field(None, max_length=50)
    relationship: Optional[str] = Field(None, min_length=1, max_length=50)
    mobile_number: Optional[str] = Field(None, min_length=1, max_length=20)
    email_address: Optional[str] = Field(None)
    phone_number: Optional[str] = Field(None, max_length=20)
    alternate_mobile: Optional[str] = Field(None, max_length=20)
    physical_address: Optional[str] = Field(None, max_length=500)


class NextOfKinResponse(BaseModel):
    """Schema for next of kin response."""
    id: Optional[str] = None
    application_id: str
    surname: str
    first_name: str
    id_number: Optional[str]
    relationship: str
    mobile_number: str
    email_address: str
    phone_number: Optional[str]
    alternate_mobile: Optional[str]
    physical_address: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class NextOfKinPartial(BaseModel):
    """Schema for partial next of kin auto-save operations."""
    surname: Optional[str] = Field(None, max_length=100)
    first_name: Optional[str] = Field(None, max_length=100)
    id_number: Optional[str] = Field(None, max_length=50)
    relationship: Optional[str] = Field(None, max_length=50)
    mobile_number: Optional[str] = Field(None, max_length=20)
    email_address: Optional[str] = Field(None)
    phone_number: Optional[str] = Field(None, max_length=20)
    alternate_mobile: Optional[str] = Field(None, max_length=20)
    physical_address: Optional[str] = Field(None, max_length=500)


# ============================================================================
# FINANCING SCHEMAS
# ============================================================================

class FinancingPlanType(str, Enum):
    """Enumeration of financing plan types."""
    MONTHLY_FLAT = "monthly_flat"
    TERMLY_DISCOUNT = "termly_discount"
    ANNUAL_DISCOUNT = "annual_discount"
    SIBLING_DISCOUNT = "sibling_discount"
    BNPL = "bnpl"
    FORWARD_FUNDING = "forward_funding"
    ARREARS_BNPL = "arrears-bnpl"


class FinancingSelectionRequest(BaseModel):
    """Financing selection request schema."""
    application_id: str = Field(..., min_length=1, description="Application ID")
    plan_type: FinancingPlanType = Field(..., description="Type of financing plan selected")
    discount_rate: Optional[float] = Field(None, ge=0, le=100, description="Discount rate percentage (0-100)")
    cost_of_credit: Optional[float] = Field(None, ge=0, description="Cost of credit")
    repayment_term: Optional[str] = Field(None, max_length=50, description="Repayment term description")


class FinancingSelectionResponse(BaseModel):
    """Financing selection response schema."""
    id: str
    application_id: str
    plan_type: FinancingPlanType
    discount_rate: Optional[float]
    cost_of_credit: Optional[float]
    repayment_term: Optional[str]
    created_at: str


# ============================================================================
# DOCUMENT SCHEMAS
# ============================================================================

class DocumentType(str, Enum):
    """Enumeration of supported document types for uploads."""
    PROOF_OF_ADDRESS = "proof_of_address"
    ID_DOCUMENT = "id_document"
    PAYSLIP = "payslip"
    BANK_STATEMENT = "bank_statement"


class DocumentStatus(BaseModel):
    """Document upload status for a specific document type."""
    document_type: str = Field(..., description="Type of document")
    uploaded_count: int = Field(..., ge=0, description="Number of files uploaded")
    required_count: int = Field(..., ge=1, description="Number of files required")
    completed: bool = Field(..., description="Whether this document type is complete")
    files: List[Dict[str, Any]] = Field(default_factory=list, description="List of uploaded files")


class DocumentStatusResponse(BaseModel):
    """Response schema for document status queries."""
    application_id: str = Field(..., description="Application ID")
    summary: List[DocumentStatus] = Field(..., description="Status summary for each document type")


class FileUploadResponse(BaseModel):
    """Response schema for file upload operations."""
    success: bool = Field(..., description="Whether upload was successful")
    message: str = Field(..., description="Status message")
    file: Dict[str, Any] = Field(..., description="Uploaded file details")


class UploadedFile(BaseModel):
    """Schema for uploaded file information."""
    id: str = Field(..., description="Unique file identifier")
    filename: str = Field(..., description="Processed filename")
    original_filename: str = Field(..., description="Original uploaded filename")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    content_type: str = Field(..., description="MIME content type")
    document_type: str = Field(..., description="Type of document")
    download_url: str = Field(..., description="Public download URL")
    created_at: str = Field(..., description="Upload timestamp")


class UploadedFilesResponse(BaseModel):
    """Response schema for listing uploaded files."""
    files: List[UploadedFile] = Field(..., description="List of uploaded files")


class DeleteFileResponse(BaseModel):
    """Response schema for file deletion operations."""
    message: str = Field(..., description="Deletion confirmation message")


class CompleteUploadRequest(BaseModel):
    """Request schema for marking uploads as complete."""
    application_id: str = Field(..., description="Application ID")


class CompleteUploadResponse(BaseModel):
    """Response schema for upload completion operations."""
    message: str = Field(..., description="Completion confirmation message")


class MarkCompleteRequest(BaseModel):
    """Request schema for marking document types as complete."""
    pass


class MarkCompleteResponse(BaseModel):
    """Response schema for document type completion operations."""
    message: str = Field(..., description="Completion confirmation message")

