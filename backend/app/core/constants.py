"""
Constants used throughout the application.
Centralized location for magic numbers, strings, and configuration values.
"""

from typing import Dict, List

# Document Types
DOCUMENT_TYPES: Dict[str, str] = {
    "PROOF_OF_ADDRESS": "proof_of_address",
    "ID_DOCUMENT": "id_document",
    "PAYSLIP": "payslip",
    "BANK_STATEMENT": "bank_statement",
    "ACADEMIC_HISTORY": "academic_history",
    "TRANSCRIPT": "transcript"
}

# Document Type Mappings for Storage Buckets
DOCUMENT_BUCKET_MAPPING: Dict[str, str] = {
    "proof_of_address": "proof_of_address",
    "id_document": "id_documents",
    "payslip": "payslips",
    "bank_statement": "bank_statements",
    "academic_history": "report_card",
    "transcript": "id_documents"
}

# Required Documents per Type (currently all require 1)
REQUIRED_DOCUMENTS_PER_TYPE: int = 1

# Payment Statuses
PAYMENT_STATUSES: Dict[str, str] = {
    "PENDING": "pending",
    "COMPLETED": "completed",
    "FAILED": "failed",
    "CANCELLED": "cancelled"
}

# Application Statuses
APPLICATION_STATUSES: Dict[str, str] = {
    "IN_PROGRESS": "in_progress",
    "SUBMITTED": "submitted",
    "APPROVED": "approved",
    "REJECTED": "rejected"
}

# File Upload Configuration
MAX_FILE_SIZE_MB: int = 10
ALLOWED_FILE_TYPES: List[str] = ["application/pdf", "image/jpeg", "image/png"]

# Validation Constants
ID_NUMBER_LENGTH: int = 13
PASSWORD_MIN_LENGTH: int = 8

# Error Messages
ERROR_MESSAGES: Dict[str, str] = {
    "INVALID_CREDENTIALS": "Invalid credentials",
    "SIGNUP_FAILED": "Signup failed",
    "APPLICATION_NOT_FOUND": "Application not found",
    "ACCESS_DENIED": "Access denied",
    "PAYMENT_GATEWAY_NOT_CONFIGURED": "Payment gateway not configured",
    "INVALID_DOCUMENT_TYPE": "Invalid document type",
    "FILE_UPLOAD_FAILED": "File upload failed",
    "MISSING_GUARDIAN_DETAILS": "Missing guardian details: ID number, name, and email are required",
    "INVALID_ID_FORMAT": "Invalid ID number format: must be 13 digits",
    "PDF_PARSING_FAILED": "PDF parsing failed - manual review recommended"
}

# Success Messages
SUCCESS_MESSAGES: Dict[str, str] = {
    "LOGIN_SUCCESSFUL": "Login successful",
    "SIGNUP_SUCCESSFUL": "User created successfully",
    "APPLICATION_SUBMITTED": "Application submitted successfully",
    "PROGRESS_SAVED": "Progress saved successfully",
    "FILE_UPLOADED": "File uploaded successfully",
    "DOCUMENT_COMPLETE": "Document upload completed",
    "ACADEMIC_HISTORY_SAVED": "Academic history saved successfully",
    "DECLARATION_SAVED": "Declaration saved successfully"
}

# CORS Origins (for development)
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001"
]

# Default Values
DEFAULT_CURRENCY: str = "ZAR"
