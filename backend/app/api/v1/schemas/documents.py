"""
Pydantic schemas for document-related API operations.

This module defines all data models used for document upload and management,
including file metadata, upload status, and document type definitions.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
    """Enumeration of supported document types for uploads."""
    PROOF_OF_ADDRESS = "proof_of_address"
    ID_DOCUMENT = "id_document"
    PAYSLIP = "payslip"
    BANK_STATEMENT = "bank_statement"


class DocumentStatus(BaseModel):
    """
    Document upload status for a specific document type.

    Provides information about upload progress and completion status.
    """
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
    """
    Schema for uploaded file information.

    Contains all metadata about an uploaded file.
    """
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


class UploadSummaryResponse(BaseModel):
    """Response schema for upload summary queries."""
    completed_categories: int = Field(..., ge=0, description="Number of completed categories")
    uploaded_types: List[str] = Field(default_factory=list, description="List of uploaded document types")


class MarkCompleteRequest(BaseModel):
    """Request schema for marking document types as complete."""
    pass  # No body required for this endpoint


class MarkCompleteResponse(BaseModel):
    """Response schema for document type completion operations."""
    message: str = Field(..., description="Completion confirmation message")
