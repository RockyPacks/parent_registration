# Backend API Documentation

## Overview
This document provides comprehensive API documentation for the enrollment system backend, built with FastAPI and Supabase.

## Authentication Endpoints

### POST /api/v1/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "full_name": "string (2-100 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response (200):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "integer",
    "email": "string",
    "full_name": "string"
  }
}
```

**Error Responses:**
- 400: Signup failed
- 422: Validation error

### POST /api/v1/auth/login
Authenticate user and return access token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "integer",
    "email": "string"
  }
}
```

**Error Responses:**
- 401: Invalid credentials
- 422: Validation error

## Enrollment Endpoints

### POST /api/v1/enrollment/auto-save
Auto-save enrollment progress (requires authentication).

**Request Body:**
```json
{
  "application_id": "string (optional)",
  "student": {
    "surname": "string",
    "first_name": "string",
    "date_of_birth": "YYYY-MM-DD",
    "gender": "male|female|other",
    "home_language": "string",
    "id_number": "13 digits",
    "previous_grade": "string",
    "grade_applied_for": "string",
    "previous_school": "string"
  },
  "medical": {
    "medical_aid_name": "string (optional)",
    "member_number": "string (optional)",
    "conditions": ["string"],
    "allergies": "string (optional)"
  },
  "family": {
    "father_surname": "string (optional)",
    "father_first_name": "string (optional)",
    "father_id_number": "13 digits (optional)",
    "father_mobile": "string (optional)",
    "father_email": "string (optional)",
    "mother_surname": "string (optional)",
    "mother_first_name": "string (optional)",
    "mother_id_number": "13 digits (optional)",
    "mother_mobile": "string (optional)",
    "mother_email": "string (optional)"
  },
  "fee": {
    "fee_person": "string",
    "relationship": "string",
    "fee_terms_accepted": "boolean"
  }
}
```

**Response (200):**
```json
{
  "message": "Progress saved successfully",
  "application_id": "string"
}
```

### POST /api/v1/enrollment/submit
Submit complete enrollment application.

**Request Body:** Same as auto-save but all sections required.

**Response (200):**
```json
{
  "message": "Enrollment submitted successfully",
  "application_id": "string"
}
```

### GET /api/v1/enrollment/application/{application_id}
Get complete application data.

**Response (200):**
```json
{
  "id": "string",
  "status": "in_progress|submitted|approved|rejected",
  "created_at": "ISO datetime string",
  "student": { ... },
  "medical": { ... },
  "family": { ... },
  "fee": { ... }
}
```

### POST /api/v1/enrollment/submit-application
Submit existing application for review.

**Request Body:**
```json
{
  "application_id": "string"
}
```

**Response (200):**
```json
{
  "message": "Application submitted successfully",
  "application_id": "string"
}
```

## Document Endpoints

### POST /api/v1/documents/upload
Upload document for application.

**Request Body (Form Data):**
- file: File object
- document_type: string
- application_id: string

### GET /api/v1/documents/{application_id}
Get documents for application.

## Payment Endpoints

### POST /api/v1/payments/create-payment
Create payment request.

**Request Body:**
```json
{
  "amount": "decimal",
  "reference": "string",
  "description": "string"
}
```

### GET /api/v1/payments/payment-status/{reference}
Get payment status.

## Risk Assessment Endpoints

### POST /api/v1/risk-check
Perform risk assessment.

**Request Body:**
```json
{
  "reference": "string",
  "guardian": {
    "branch_code": "string",
    "account_number": "string",
    "name": "string",
    "email": "string",
    "id_number": "string"
  },
  "application_id": "string"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

Error responses include a `detail` field with error description.

## Authentication

Most endpoints require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

## Data Validation

All request data is validated using Pydantic schemas with comprehensive field validation including:
- String length limits
- Email format validation
- Date format validation
- Required vs optional fields
- Custom regex patterns (e.g., South African ID numbers)

## Rate Limiting

API endpoints implement rate limiting to prevent abuse. Contact administrator for limits.
