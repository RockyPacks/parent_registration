"""
Pydantic schemas for academic-related API operations.

This module defines all data models used for academic history operations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AcademicHistoryCreate(BaseModel):
    """
    Schema for creating academic history records.
    """
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
    """
    Schema for academic history response.
    """
    id: Optional[str] = None
    application_id: str
    school_name: str
    school_type: str
    last_grade_completed: str
    academic_year_completed: str
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
    """
    Schema for updating academic history records.
    """
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
