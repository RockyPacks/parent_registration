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

    Contains details about who is responsible for school fees.
    """
    fee_person: str = Field(..., min_length=1, max_length=200, description="Person responsible for fees")
    relationship: str = Field(..., min_length=1, max_length=50, description="Relationship to student")
    fee_terms_accepted: bool = Field(default=False, description="Whether fee terms have been accepted")
    selected_plan: Optional[str] = Field(None, max_length=100, description="Selected financing plan")


class FeeResponsibilityInfoPartial(BaseModel):
    """
    Partial fee responsibility information schema for auto-save.

    Allows partial updates to fee data.
    """
    fee_person: Optional[str] = Field(None, min_length=1, max_length=200, description="Person responsible for fees")
    relationship: Optional[str] = Field(None, min_length=1, max_length=50, description="Relationship to student")
    fee_terms_accepted: Optional[bool] = Field(None, description="Whether fee terms have been accepted")
    selected_plan: Optional[str] = Field(None, max_length=100, description="Selected financing plan")


class DeclarationInfo(BaseModel):
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
    student: Dict[str, Any]
    medical: Dict[str, Any]
    family: Dict[str, Any]
    fee: Dict[str, Any]


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


class SubmitApplicationResponse(BaseModel):
    """Submit application response schema."""
    message: str
    application_id: str
