from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Depends
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
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Netcash Risk Reports API configuration
NETCASH_RISK_BASE = os.getenv("NETCASH_RISK_BASE", "https://ws.netcash.co.za/RiskReportsService.svc")
NETCASH_RISK_KEY = os.getenv("NETCASH_RISK_KEY")

security = HTTPBearer()

def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return credentials.credentials

def verify_supabase_token(token: str = Depends(get_token)):
    try:
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

# Initialize Supabase client
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
    raise RuntimeError(f"Failed to initialize Supabase: {e}")

app = FastAPI()

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UploadResponse(BaseModel):
    success: bool
    message: str
    file: dict

class DocumentStatus(BaseModel):
    application_id: str
    summary: List[dict]

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str

class EnrollmentData(BaseModel):
    student: dict
    medical: dict
    family: dict
    fee: dict

class AutoSaveEnrollmentData(BaseModel):
    application_id: str
    student: Optional[dict] = None
    medical: Optional[dict] = None
    family: Optional[dict] = None
    fee: Optional[dict] = None

class FullApplicationData(BaseModel):
    student: dict
    family: dict
    medical: dict
    fee: dict
    academicHistory: dict
    subjects: dict
    financing: dict
    declaration: dict

class RiskData(BaseModel):
    application_id: str
    risk_score: Optional[float] = None

@app.post("/risk-check")
async def run_risk_check(data: RiskData, current_user: dict = Depends(get_current_user)):
    try:
        risk_record = {
            "application_id": data.application_id,
            "guardian_email": current_user.get("email"),
            "risk_score": data.risk_score if data.risk_score is not None else 0.83,
            "flags": [],
            "status": "low",
            "timestamp": datetime.now().isoformat(),
            "raw_response": {"mock": True, "reason": "Using mock endpoint as per user feedback."}
        }
        supabase.table("risk_reports").insert(risk_record).execute()
        logger.info(f"Mock risk report saved for application: {data.application_id}")

        return {"risk_score": risk_record["risk_score"], "status": "low"}
    except Exception as e:
        logger.error(f"RISK CHECK ERROR: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/applications/submit-full")
async def submit_full_application(data: FullApplicationData, application_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Ensure application exists
        try:
            existing_app = supabase.table("applications").select("id").eq("id", application_id).execute()
            if not existing_app.data:
                app_data = {
                    "id": application_id,
                    "status": "pending"
                }
                supabase.table("applications").insert(app_data).execute()
        except Exception as app_error:
            logger.warning(f"Could not check/create application: {str(app_error)}")

        # Handle student data - check if student with this ID already exists
        student_id_number = data.student.get("idNumber")
        existing_student = supabase.table("students").select("application_id").eq("id_number", student_id_number).execute()

        if existing_student.data and len(existing_student.data) > 0:
            # Update existing student record in the existing application
            existing_app_id = existing_student.data[0]["application_id"]
            application_id = existing_app_id  # Use the existing application
            student_data = {
                "surname": data.student.get("surname"),
                "first_name": data.student.get("firstName"),
                "middle_name": data.student.get("middleName"),
                "preferred_name": data.student.get("preferredName"),
                "date_of_birth": data.student.get("dob"),
                "gender": data.student.get("gender"),
                "home_language": data.student.get("homeLanguage"),
                "previous_grade": data.student.get("previousGrade"),
                "grade_applied_for": data.student.get("gradeAppliedFor"),
                "previous_school": data.student.get("previousSchool")
            }
            supabase.table("students").update(student_data).eq("application_id", application_id).execute()
            logger.info(f"Updated existing student record for ID {student_id_number} in application {application_id}")
        else:
            # Insert new student record
            student_data = {
                "application_id": application_id,
                "surname": data.student.get("surname"),
                "first_name": data.student.get("firstName"),
                "middle_name": data.student.get("middleName"),
                "preferred_name": data.student.get("preferredName"),
                "date_of_birth": data.student.get("dob"),
                "gender": data.student.get("gender"),
                "home_language": data.student.get("homeLanguage"),
                "id_number": data.student.get("idNumber"),
                "previous_grade": data.student.get("previousGrade"),
                "grade_applied_for": data.student.get("gradeAppliedFor"),
                "previous_school": data.student.get("previousSchool")
            }
            supabase.table("students").insert(student_data).execute()
            logger.info(f"Inserted new student record for ID {student_id_number} in application {application_id}")

        # Upsert family data
        family_data = {
            "application_id": application_id,
            "father_surname": data.family.get("fatherSurname"),
            "father_first_name": data.family.get("fatherFirstName"),
            "father_id_number": data.family.get("fatherIdNumber"),
            "father_mobile": data.family.get("fatherMobile"),
            "father_email": data.family.get("fatherEmail"),
            "mother_surname": data.family.get("motherSurname"),
            "mother_first_name": data.family.get("motherFirstName"),
            "mother_id_number": data.family.get("motherIdNumber"),
            "mother_mobile": data.family.get("motherMobile"),
            "mother_email": data.family.get("motherEmail")
        }
        supabase.table("family_info").upsert(family_data).execute()

        # Upsert medical data
        medical_data = {
            "application_id": application_id,
            "medical_aid_name": data.medical.get("medicalAidName"),
            "member_number": data.medical.get("memberNumber"),
            "conditions": data.medical.get("conditions", []),
            "allergies": data.medical.get("allergies")
        }
        supabase.table("medical_info").upsert(medical_data).execute()

        # Upsert fee responsibility data
        fee_data = {
            "application_id": application_id,
            "fee_person": data.fee.get("feePerson"),
            "relationship": data.fee.get("relationship"),
            "fee_terms_accepted": data.fee.get("feeTermsAccepted", False)
        }
        supabase.table("fee_responsibility").upsert(fee_data).execute()

        # Upsert academic history
        academic_data = {
            "application_id": application_id,
            "school_name": data.academicHistory.get("schoolName"),
            "last_grade_completed": data.academicHistory.get("lastGradeCompleted"),
            "academic_year_completed": data.academicHistory.get("academicYearCompleted", "2023"),
        }
        supabase.table("academic_history").upsert(academic_data).execute()

        # Upsert subjects
        supabase.table("selected_subjects").delete().eq("application_id", application_id).execute()
        core_subjects = data.subjects.get("core", [])
        elective_subjects = data.subjects.get("electives", [])
        if core_subjects:
            supabase.table("selected_subjects").insert([
                {"application_id": application_id, "subject_name": s, "subject_type": "core", "subject_id": s} for s in core_subjects
            ]).execute()
        if elective_subjects:
            supabase.table("selected_subjects").insert([
                {"application_id": application_id, "subject_name": s, "subject_type": "elective", "subject_id": s} for s in elective_subjects
            ]).execute()

        # Upsert financing
        financing_data = {
            "application_id": application_id,
            "selected_plan": data.financing.get("plan")
        }
        supabase.table("financing_options").upsert(financing_data).execute()

        # Validate declaration data
        if data.declaration.get("signed"):
            full_name = data.declaration.get("fullName")
            if not full_name or len(full_name.strip()) < 3:
                raise HTTPException(status_code=400, detail="Full name is required and must be at least 3 characters to sign the declaration")

        # Upsert declaration
        declaration_data = {
            "application_id": application_id,
            "agree_truth": data.declaration.get("agreeTruth", False),
            "agree_policies": data.declaration.get("agreePolicies", False),
            "agree_financial": data.declaration.get("agreeFinancial", False),
            "agree_verification": data.declaration.get("agreeVerification", False),
            "agree_data_processing": data.declaration.get("agreeDataProcessing", False),
            "full_name": data.declaration.get("fullName"),
            "city": data.declaration.get("city"),
            "date_signed": datetime.now().isoformat(),
            "status": "completed" if data.declaration.get("signed") else "in_progress",
        }
        supabase.table("declarations").upsert(declaration_data).execute()

        # Update application status - handle potential schema issues
        try:
            supabase.table("applications").update({
                "status": "submitted"
            }).eq("id", application_id).execute()
        except Exception as update_error:
            logger.warning(f"Could not update application status: {str(update_error)}")
            # Continue anyway since the main data was saved

        return {"message": "Application submitted successfully", "application_id": application_id}

    except Exception as e:
        logger.error(f"Error in submit_full_application: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error during full application submission: {str(e)}")

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    document_type: str = Form(...),
    token: HTTPAuthorizationCredentials = Depends(security)
):

    # Get current user info
    try:
        user_response = supabase.auth.get_user(token.credentials)
        current_user = user_response.user
        if not current_user:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = current_user.id
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

    # Validate file size (max 10MB)
    file_size = 0
    file_content = b""
    chunk_size = 1024 * 1024  # 1MB chunks

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        file_content += chunk
        file_size += len(chunk)
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")

    # Validate file type
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")

    try:
        # Handle temp IDs by creating a proper application if it doesn't exist
        if application_id.startswith('temp_'):
            # Check if we already have a real application for this temp ID
            # For now, create a new application
            real_application_id = str(uuid.uuid4())
            app_data = {
                "id": real_application_id,
                "status": "pending"
            }
            supabase.table("applications").insert(app_data).execute()
            application_id = real_application_id

        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_extension}"

        # Upload to Supabase Storage - use dedicated buckets based on document type
        bucket_mapping = {
            "proof_of_address": "proof_of_address",
            "proof-of-address": "proof_of_address",
            "parent-guardian-id": "id_documents",
            "learner-birth-certificate": "id_documents",
            "spouse-id": "id_documents",
            "optional-document": "id_documents",
            "latest-payslip": "payslips",
            "previous-payslip": "payslips",
            "third-payslip": "payslips",
            "bank-statements": "bank_statements",
            "bank_statements": "bank_statements",
            "academic_history": "id_documents",
            "report_card": "id_documents"
        }

        bucket_name = bucket_mapping.get(document_type, "enrollment-documents")
        file_path = f"{user_id}/{application_id}/{filename}"  # Include user_id in path for RLS

        # Create a client with the user's JWT token for storage operations
        from supabase import create_client
        user_supabase = create_client(SUPABASE_URL, token.credentials)

        user_supabase.storage.from_(bucket_name).upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type or "application/octet-stream"}
        )

        # Get public URL
        download_url = supabase.storage.from_(bucket_name).get_public_url(file_path)

        # Store file metadata in database using service role
        file_data = {
            "id": file_id,
            "application_id": application_id,
            "uploaded_by": user_id,
            "filename": filename,
            "original_filename": file.filename,
            "file_size": file_size,
            "content_type": file.content_type,
            "document_type": document_type,
            "bucket_name": bucket_name,
            "file_path": file_path,
            "download_url": download_url,
            "created_at": datetime.now().isoformat()
        }

        supabase.table("documents").insert(file_data).execute()

        # Also store in application_documents table for completion tracking
        # Map detailed document types to simplified types for completion tracking
        doc_type_mapping = {
            "proof_of_address": "proof_of_address",
            "proof-of-address": "proof_of_address",
            "parent-guardian-id": "id_document",
            "learner-birth-certificate": "id_document",
            "spouse-id": "id_document",
            "optional-document": "id_document",
            "academic_history": "id_document",
            "report_card": "id_document",
            "latest-payslip": "payslip",
            "previous-payslip": "payslip",
            "third-payslip": "payslip",
            "bank-statements": "bank_statement",
            "bank_statements": "bank_statement"
        }

        simplified_doc_type = doc_type_mapping.get(document_type, document_type)

        app_doc_data = {
            "user_id": user_id,
            "application_id": application_id,
            "document_type": simplified_doc_type,
            "file_url": download_url,
            "upload_status": "completed"
        }

        supabase.table("application_documents").insert(app_doc_data).execute()

        return UploadResponse(
            success=True,
            message="File uploaded successfully",
            file={
                "id": file_id,
                "filename": file.filename,
                "size": file_size,
                "content_type": file.content_type,
                "document_type": document_type,
                "bucket_name": bucket_name,
                "download_url": download_url,
                "created_at": datetime.now().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

@app.post("/documents/complete")
async def complete_document_upload(data: dict):
    """
    Mark document upload as completed for an application.

    - **data**: Document completion data
    - **returns**: Success message
    """
    try:
        application_id = data.get('application_id')
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID is required")

        # Handle temp IDs by creating a proper application if it doesn't exist
        if application_id.startswith('temp_'):
            # Check if we already have a real application for this temp ID
            # For now, create a new application
            real_application_id = str(uuid.uuid4())
            app_data = {
                "id": real_application_id,
                "status": "pending"
            }
            supabase.table("applications").insert(app_data).execute()
            application_id = real_application_id

        # Update application status to indicate documents are completed
        # Note: documents_completed column may not exist in the database schema
        # We'll try to update it, but if it fails, we'll continue without it
        try:
            supabase.table("applications").update({
                "documents_completed": True,
                "updated_at": "now()"
            }).eq("id", application_id).execute()
        except Exception as update_error:
            logger.warning(f"Could not update documents_completed column: {str(update_error)}")
            # Just update the updated_at timestamp instead
            try:
                supabase.table("applications").update({
                    "updated_at": "now()"
                }).eq("id", application_id).execute()
            except Exception as timestamp_error:
                logger.warning(f"Could not update timestamp either: {str(timestamp_error)}")

        # Also save document completion status in a separate table if needed
        completion_data = {
            "application_id": application_id,
            "completed_at": datetime.now().isoformat(),
            "status": "completed"
        }

        # Check if we have a document_completion table, if not, we'll just update the application
        try:
            supabase.table("document_completion").upsert(completion_data).execute()
        except Exception:
            # If table doesn't exist, just continue - the application update is sufficient
            pass

        return {"message": "Document upload completed successfully"}

    except Exception as e:
        logger.error(f"Error completing document upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error completing document upload: {str(e)}")

@app.get("/documents/{application_id}")
async def get_document_status(application_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection not available")

    try:
        # Get documents from database - filter by uploaded_by for security
        response = (
            supabase.table("documents")
            .select("*")
            .eq("application_id", application_id)
            .eq("uploaded_by", current_user["id"])
            .execute()
        )
        files = response.data

        # Group files by document type
        summary = {}
        for file in files:
            doc_type = file["document_type"]
            if doc_type not in summary:
                summary[doc_type] = {
                    "document_type": doc_type,
                    "uploaded_count": 0,
                    "required_count": 1,  # Simplified
                    "completed": False,
                    "files": []
                }
            summary[doc_type]["uploaded_count"] += 1
            summary[doc_type]["completed"] = summary[doc_type]["uploaded_count"] >= summary[doc_type]["required_count"]
            summary[doc_type]["files"].append({
                "file_url": file["download_url"],
                "filename": file["original_filename"]
            })

        return DocumentStatus(
            application_id=application_id,
            summary=list(summary.values())
        )
    except Exception as e:
        logger.error(f"Error getting document status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get document status")

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify backend is running.
    """
    return {"message": "Backend is running", "status": "healthy"}

@app.get("/applications/{application_id}/upload-summary")
async def get_upload_summary(application_id: str):
    """
    Get upload completion summary for an application.
    """
    try:
        if not supabase:
            return {"completed_categories": 0, "uploaded_types": []}

        result = supabase.table("application_upload_summary").select("*").eq("application_id", application_id).execute()
        if result.data:
            return result.data[0]
        else:
            return {"completed_categories": 0, "uploaded_types": []}
    except Exception as e:
        logger.error(f"Error getting upload summary: {str(e)}")
        return {"completed_categories": 0, "uploaded_types": []}

@app.post("/applications/{application_id}/mark-complete/{doc_type}")
async def mark_document_complete(application_id: str, doc_type: str):
    """
    Mark a document type as completed.
    """
    try:
        if not supabase:
            return {"message": "Mock: Document marked as completed"}

        supabase.rpc("mark_upload_complete", {"app_id": application_id, "doc_type": doc_type}).execute()
        return {"message": "Document marked as completed"}
    except Exception as e:
        logger.error(f"Error marking document complete: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error marking document complete: {str(e)}")

@app.get("/documents/{application_id}/files")
async def get_uploaded_files(application_id: str, current_user: dict = Depends(get_current_user)):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection not available")

    # Handle demo/development case where application_id is "default" or invalid UUID
    try:
        uuid.UUID(application_id)  # Validate UUID
    except ValueError:
        # If not a valid UUID, return empty files (for development/demo)
        return {"files": []}

    try:
        response = (
            supabase.table("documents")
            .select("*")
            .eq("application_id", application_id)
            .eq("uploaded_by", current_user["id"])
            .execute()
        )
        return {"files": response.data}
    except Exception as e:
        logger.error(f"Error getting uploaded files: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get uploaded files")

@app.delete("/documents/{application_id}/files/{file_id}")
async def delete_file(application_id: str, file_id: str):

    try:
        # Get file info before deletion
        file_response = supabase.table("documents").select("file_path,bucket_name").eq("id", file_id).eq("application_id", application_id).execute()
        if not file_response.data:
            raise HTTPException(status_code=404, detail="File not found")

        file_info = file_response.data[0]

        # Delete from storage
        supabase.storage.from_(file_info["bucket_name"]).remove([file_info["file_path"]])

        # Delete from database
        supabase.table("documents").delete().eq("id", file_id).eq("application_id", application_id).execute()

        # Also delete from application_documents table
        supabase.table("application_documents").delete().eq("file_url", file_info.get("download_url")).execute()

        return {"message": "File deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete file")

@app.post("/auth/login")
async def login(request: LoginRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        user = auth_response.user
        session = auth_response.session

        return {
            "access_token": session.access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.user_metadata.get("full_name", "")
            }
        }
    except Exception as e:
        logger.error(f"Login failed for email {request.email}: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/auth/signup")
async def signup(request: SignupRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        # Sign up with Supabase
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name
                }
            }
        })

        user = auth_response.user

        return {
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": request.full_name
            }
        }
    except Exception as e:
        logger.error(f"Signup failed for email {request.email}: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to create user account")

@app.post("/enrollment/auto-save")
async def auto_save_enrollment(data: AutoSaveEnrollmentData, current_user: dict = Depends(get_current_user)):
    """
    Auto-save enrollment data for an application.

    - **data**: Enrollment data to save
    - **returns**: Success message with application ID
    """
    try:
        logger.info(f"Auto-saving data for application {data.application_id}")
        application_id = data.application_id
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID is required")

        # Handle temp IDs by creating a proper application if it doesn't exist
        if application_id.startswith('temp_'):
            # Check if we already have a real application for this temp ID
            # For now, create a new application
            real_application_id = str(uuid.uuid4())
            app_data = {
                "id": real_application_id,
                "user_id": current_user.get("id"),
                "status": "pending",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            supabase.table("applications").insert(app_data).execute()
            application_id = real_application_id

        # Ensure application exists and belongs to current user
        try:
            app_check = supabase.table("applications").select("id").eq("id", application_id).eq("user_id", current_user.get("id")).execute()
            if not app_check.data:
                raise HTTPException(status_code=404, detail="Application not found or access denied")
        except Exception:
            # If application doesn't exist, create it
            app_data = {
                "id": application_id,
                "user_id": current_user.get("id"),
                "status": "pending",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            supabase.table("applications").insert(app_data).execute()

        # Extract student data
        student_data = data.student
        if student_data:
            student_payload = {
                "application_id": application_id,
                "surname": student_data.get("surname"),
                "first_name": student_data.get("firstName"),
                "middle_name": student_data.get("middleName"),
                "preferred_name": student_data.get("preferredName"),
                "date_of_birth": student_data.get("dob") or None,  # Allow null for date_of_birth
                "gender": student_data.get("gender"),
                "home_language": student_data.get("homeLanguage"),
                "id_number": student_data.get("idNumber"),
                "previous_grade": student_data.get("previousGrade"),
                "grade_applied_for": student_data.get("gradeAppliedFor"),
                "previous_school": student_data.get("previousSchool")
            }
            # Only upsert if we have at least the required fields
            if student_payload.get("surname") or student_payload.get("first_name") or student_payload.get("id_number"):
                supabase.table("students").upsert(student_payload).execute()

        # Extract medical data
        medical_data = data.medical
        if medical_data:
            medical_payload = {
                "application_id": application_id,
                "medical_aid_name": medical_data.get("medicalAidName"),
                "member_number": medical_data.get("memberNumber"),
                "conditions": medical_data.get("conditions", []),
                "allergies": medical_data.get("allergies")
            }
            supabase.table("medical_info").upsert(medical_payload).execute()

        # Extract family data
        family_data = data.family
        if family_data:
            family_payload = {
                "application_id": application_id,
                "father_surname": family_data.get("fatherSurname"),
                "father_first_name": family_data.get("fatherFirstName"),
                "father_id_number": family_data.get("fatherIdNumber"),
                "father_mobile": family_data.get("fatherMobile"),
                "father_email": family_data.get("fatherEmail"),
                "mother_surname": family_data.get("motherSurname"),
                "mother_first_name": family_data.get("motherFirstName"),
                "mother_id_number": family_data.get("motherIdNumber"),
                "mother_mobile": family_data.get("motherMobile"),
                "mother_email": family_data.get("motherEmail")
            }
            supabase.table("family_info").upsert(family_payload).execute()

        # Extract fee data
        fee_data = data.fee
        if fee_data:
            fee_payload = {
                "application_id": application_id,
                "fee_person": fee_data.get("feePerson"),
                "relationship": fee_data.get("relationship"),
                "fee_terms_accepted": fee_data.get("feeTermsAccepted", False)
            }
            supabase.table("fee_responsibility").upsert(fee_payload).execute()

        return {"message": "Enrollment auto-saved successfully", "application_id": application_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in auto_save_enrollment: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error during auto-save: {str(e)}")

@app.post("/enrollment/submit")
async def submit_enrollment(data: EnrollmentData):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not available")

    # Basic validation
    if not data.student.get("surname") or not data.student.get("firstName"):
        raise HTTPException(status_code=400, detail="Student name is required")

    if not data.student.get("idNumber"):
        raise HTTPException(status_code=400, detail="Student ID number is required")

    try:
        student_id_number = data.student.get("idNumber")

        # Check if student with this ID already exists
        existing_student = supabase.table("students").select("application_id").eq("id_number", student_id_number).execute()

        if existing_student.data and len(existing_student.data) > 0:
            # Update existing application
            application_id = existing_student.data[0]["application_id"]
            logger.info(f"Updating existing application {application_id} for student ID {student_id_number}")

            # Update application status to pending (in case it was completed)
            supabase.table("applications").update({"status": "pending", "updated_at": "now()"}).eq("id", application_id).execute()

            # Update student data
            student_data = {
                "surname": data.student.get("surname"),
                "first_name": data.student.get("firstName"),
                "middle_name": data.student.get("middleName"),
                "preferred_name": data.student.get("preferredName"),
                "date_of_birth": data.student.get("dob"),
                "gender": data.student.get("gender"),
                "home_language": data.student.get("homeLanguage"),
                "previous_grade": data.student.get("previousGrade"),
                "grade_applied_for": data.student.get("gradeAppliedFor"),
                "previous_school": data.student.get("previousSchool")
            }
            supabase.table("students").update(student_data).eq("application_id", application_id).execute()

            # Update or insert medical data
            medical_data = {
                "medical_aid_name": data.medical.get("medicalAidName"),
                "member_number": data.medical.get("memberNumber"),
                "conditions": data.medical.get("conditions", []),
                "allergies": data.medical.get("allergies")
            }
            supabase.table("medical_info").upsert({**medical_data, "application_id": application_id}).execute()

            # Update or insert family data
            family_data = {
                "father_surname": data.family.get("fatherSurname"),
                "father_first_name": data.family.get("fatherFirstName"),
                "father_id_number": data.family.get("fatherIdNumber"),
                "father_mobile": data.family.get("fatherMobile"),
                "father_email": data.family.get("fatherEmail"),
                "mother_surname": data.family.get("motherSurname"),
                "mother_first_name": data.family.get("motherFirstName"),
                "mother_id_number": data.family.get("motherIdNumber"),
                "mother_mobile": data.family.get("motherMobile"),
                "mother_email": data.family.get("motherEmail")
            }
            supabase.table("family_info").upsert({**family_data, "application_id": application_id}).execute()

            # Update or insert fee data
            fee_data = {
                "fee_person": data.fee.get("feePerson"),
                "relationship": data.fee.get("relationship"),
                "fee_terms_accepted": data.fee.get("feeTermsAccepted", False)
            }
            supabase.table("fee_responsibility").upsert({**fee_data, "application_id": application_id}).execute()

        return {"message": "Enrollment submitted successfully", "application_id": application_id}

    except Exception as e:
        logger.error(f"Error in submit_enrollment: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error during enrollment submission: {str(e)}")
