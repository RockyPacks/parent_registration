from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import requests
from datetime import datetime
import uuid
from dotenv import load_dotenv
import logging
import traceback

from app.core.config import settings
from app.api.v1.routers.risk import router as risk_router
from app.api.v1.routers.payment import router as payment_router

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="School Enrollment API",
    description="API for school enrollment system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(risk_router, prefix="/api/v1", tags=["risk"])
app.include_router(payment_router, prefix="/api/v1", tags=["payment"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Keep existing endpoints for now - they will be refactored later
# TODO: Move these to appropriate routers

security = HTTPBearer()

def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return credentials.credentials

def verify_supabase_token(token: str):
    try:
        from app.db.session import supabase
        user = supabase.auth.get_user(token)
        return user
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid token")

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Authentication service unavailable")

    try:
        # Verify the JWT token using Supabase
        user_response = supabase.auth.get_user(token.credentials)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": user.id,
            "email": user.email,
            "user_metadata": user.user_metadata
        }
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

# Initialize Supabase client (keeping for backward compatibility)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase URL and key must be configured")

try:
    from supabase import create_client
    key_to_use = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY
    supabase = create_client(SUPABASE_URL, key_to_use)
    logger.info("Supabase client initialized successfully")
except ImportError as e:
    raise RuntimeError(f"Failed to import Supabase: {e}")
except Exception as e:
    raise RuntimeError(f"Failed to initialize Supabase client: {e}")

# Import existing models and keep them for backward compatibility
from pydantic import BaseModel

class EnrollmentData(BaseModel):
    student: Dict[str, Any]
    medical: Dict[str, Any]
    family: Dict[str, Any]
    fee: Dict[str, Any]

class RiskCheckRequest(BaseModel):
    reference: str
    guardian: Dict[str, Any]

# Auth endpoints
@app.post("/auth/login")
async def login(credentials: dict):
    """Login endpoint"""
    try:
        email = credentials.get("email")
        password = credentials.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password required")

        # For now, return a mock token - replace with actual authentication
        return {
            "access_token": "mock_token_123",
            "token_type": "bearer",
            "user": {
                "id": "user_123",
                "email": email,
                "full_name": "Test User"
            }
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/signup")
async def signup(user_data: dict):
    """Signup endpoint"""
    try:
        full_name = user_data.get("full_name")
        email = user_data.get("email")
        password = user_data.get("password")

        if not full_name or not email or not password:
            raise HTTPException(status_code=400, detail="All fields required")

        # For now, return a mock response - replace with actual user creation
        return {
            "message": "User created successfully",
            "user": {
                "id": "user_123",
                "email": email,
                "full_name": full_name
            }
        }
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=400, detail="Signup failed")

# Enrollment endpoints
@app.post("/enrollment/auto-save")
async def auto_save_enrollment(data: dict):
    """Auto-save enrollment progress"""
    try:
        application_id = data.get("application_id")
        if not application_id:
            # Generate a new application ID if not provided
            application_id = str(uuid.uuid4())

        # For now, just return success - replace with actual database save
        return {
            "message": "Progress saved successfully",
            "application_id": application_id
        }
    except Exception as e:
        logger.error(f"Auto-save error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save progress")

@app.post("/enrollment/submit")
async def submit_enrollment(data: EnrollmentData):
    """Submit complete enrollment"""
    try:
        # For now, just return success - replace with actual processing
        return {
            "message": "Enrollment submitted successfully",
            "data": data.dict()
        }
    except Exception as e:
        logger.error(f"Submit enrollment error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit enrollment")

# Applications endpoints
@app.get("/applications/{application_id}")
async def get_application(application_id: str):
    """Get application by ID"""
    try:
        # For now, return mock data - replace with actual database query
        return {
            "id": application_id,
            "status": "in_progress",
            "created_at": datetime.now().isoformat(),
            "student": {},
            "medical": {},
            "family": {},
            "fee": {}
        }
    except Exception as e:
        logger.error(f"Get application error: {str(e)}")
        raise HTTPException(status_code=404, detail="Application not found")

@app.post("/submit-application")
async def submit_full_application(data: dict):
    """Submit full application"""
    try:
        application_id = data.get("application_id")
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID required")

        # For now, just return success - replace with actual processing
        return {
            "message": "Application submitted successfully",
            "data": data
        }
    except Exception as e:
        logger.error(f"Submit application error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit application")

# Document endpoints
@app.get("/documents/{application_id}")
async def get_document_status(application_id: str):
    """Get document upload status"""
    try:
        # For now, return mock data - replace with actual database query
        return {
            "application_id": application_id,
            "summary": []
        }
    except Exception as e:
        logger.error(f"Get document status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get document status")

@app.post("/upload")
async def upload_file():
    """Upload file endpoint"""
    # This would need proper file handling - for now return not implemented
    raise HTTPException(status_code=501, detail="File upload not implemented yet")

@app.get("/documents/{application_id}/files")
async def get_uploaded_files(application_id: str):
    """Get uploaded files for application"""
    try:
        # For now, return empty list - replace with actual database query
        return {
            "files": []
        }
    except Exception as e:
        logger.error(f"Get uploaded files error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get uploaded files")

@app.delete("/documents/{application_id}/files/{file_id}")
async def delete_file(application_id: str, file_id: str):
    """Delete uploaded file"""
    try:
        # For now, just return success - replace with actual file deletion
        return {
            "message": "File deleted successfully"
        }
    except Exception as e:
        logger.error(f"Delete file error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete file")

@app.post("/documents/complete")
async def complete_document_upload(data: dict):
    """Mark document upload as complete"""
    try:
        application_id = data.get("application_id")
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID required")

        # For now, just return success - replace with actual processing
        return {
            "message": "Document upload completed"
        }
    except Exception as e:
        logger.error(f"Complete document upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete document upload")

@app.get("/applications/{application_id}/upload-summary")
async def get_upload_summary(application_id: str):
    """Get upload summary for application"""
    try:
        # For now, return mock data - replace with actual calculation
        return {
            "completed_categories": 0,
            "uploaded_types": []
        }
    except Exception as e:
        logger.error(f"Get upload summary error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get upload summary")

@app.post("/applications/{application_id}/mark-complete/{doc_type}")
async def mark_document_complete(application_id: str, doc_type: str):
    """Mark document type as complete"""
    try:
        # For now, just return success - replace with actual processing
        return {
            "message": f"Document type {doc_type} marked as complete"
        }
    except Exception as e:
        logger.error(f"Mark document complete error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark document complete")

# Academic history endpoint
@app.post("/academic-history")
async def save_academic_history(data: dict):
    """Save academic history data"""
    try:
        # For now, just return success - replace with actual database save
        return {
            "message": "Academic history saved successfully",
            "application_id": data.get("application_id")
        }
    except Exception as e:
        logger.error(f"Academic history save error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save academic history")

@app.get("/academic-history/{application_id}")
async def get_academic_history(application_id: str):
    """Get academic history data"""
    try:
        # For now, return empty data - replace with actual database query
        return {}
    except Exception as e:
        logger.error(f"Academic history get error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get academic history")

# Declaration endpoint
@app.post("/declaration")
async def save_declaration(data: dict):
    """Save declaration data"""
    try:
        # For now, just return success - replace with actual database save
        return {
            "message": "Declaration saved successfully",
            "application_id": data.get("application_id")
        }
    except Exception as e:
        logger.error(f"Declaration save error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save declaration")

# Risk check endpoint
@app.post("/risk-check")
async def risk_check(request: RiskCheckRequest):
    """Run risk check"""
    try:
        # For now, return mock response - replace with actual risk check logic
        return {
            "reference": request.reference,
            "risk_score": 0,
            "risk_level": "low",
            "recommendations": [],
            "report_url": None
        }
    except Exception as e:
        logger.error(f"Risk check error: {str(e)}")
        raise HTTPException(status_code=500, detail="Risk check failed")
