from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        # Try importing with fallback for Python 3.14 compatibility
        try:
            from supabase import create_client
        except ImportError:
            logger.warning("Supabase import failed, using mock client for development")
            supabase = None
        else:
            key_to_use = SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY
            supabase = create_client(SUPABASE_URL, key_to_use)
            logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase: {e}")
        supabase = None
else:
    logger.warning("Supabase URL or key not configured")

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

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    document_type: str = Form(...)
):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection not available")

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
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_extension}"

        # Upload to Supabase Storage
        bucket_name = "enrollment-documents"
        file_path = f"{application_id}/{filename}"

        supabase.storage.from_(bucket_name).upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type or "application/octet-stream"}
        )

        # Get public URL
        download_url = supabase.storage.from_(bucket_name).get_public_url(file_path)

        # Store file metadata in database
        file_data = {
            "id": file_id,
            "application_id": application_id,
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

        # Update application status to indicate documents are completed
        supabase.table("applications").update({
            "documents_completed": True,
            "updated_at": "now()"
        }).eq("id", application_id).execute()

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
async def get_document_status(application_id: str):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection not available")

    try:
        # Get documents from database
        response = supabase.table("documents").select("*").eq("application_id", application_id).execute()
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

@app.get("/documents/{application_id}/files")
async def get_uploaded_files(application_id: str):
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection not available")

    # Handle demo/development case where application_id is "default" or invalid UUID
    try:
        uuid.UUID(application_id)  # Validate UUID
    except ValueError:
        # If not a valid UUID, return empty files (for development/demo)
        return {"files": []}

    try:
        response = supabase.table("documents").select("*").eq("application_id", application_id).execute()
        return {"files": response.data}
    except Exception as e:
        logger.error(f"Error getting uploaded files: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get uploaded files")

@app.delete("/documents/{application_id}/files/{file_id}")
async def delete_file(application_id: str, file_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not available")

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

            # Update or insert fee responsibility data
            fee_data = {
                "fee_person": data.fee.get("feePerson"),
                "relationship": data.fee.get("relationship"),
                "fee_terms_accepted": data.fee.get("feeTermsAccepted", False)
            }
            supabase.table("fee_responsibility").upsert({**fee_data, "application_id": application_id}).execute()

            return {"message": "Enrollment updated successfully", "data": {"application_id": application_id}}
        else:
            # Create new application
            application_id = str(uuid.uuid4())
            logger.info(f"Creating new application {application_id} for student ID {student_id_number}")

            # Insert application
            app_data = {
                "id": application_id,
                "status": "pending"
            }
            supabase.table("applications").insert(app_data).execute()

            # Insert student data
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

            # Insert medical data
            medical_data = {
                "application_id": application_id,
                "medical_aid_name": data.medical.get("medicalAidName"),
                "member_number": data.medical.get("memberNumber"),
                "conditions": data.medical.get("conditions", []),
                "allergies": data.medical.get("allergies")
            }
            supabase.table("medical_info").insert(medical_data).execute()

            # Insert family data
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
            supabase.table("family_info").insert(family_data).execute()

            # Insert fee responsibility data
            fee_data = {
                "application_id": application_id,
                "fee_person": data.fee.get("feePerson"),
                "relationship": data.fee.get("relationship"),
                "fee_terms_accepted": data.fee.get("feeTermsAccepted", False)
            }
            supabase.table("fee_responsibility").insert(fee_data).execute()

            return {"message": "Enrollment submitted successfully", "data": {"application_id": application_id}}
    except Exception as e:
        logger.error(f"Error in submit_enrollment: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error during enrollment submission: {str(e)}")



@app.get("/applications/{application_id}")
async def get_application(application_id: str):
    """
    Retrieve an application by ID.

    - **application_id**: The ID of the application to retrieve
    - **returns**: Application data
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection not available")

    try:
        # Get application data
        app_response = supabase.table("applications").select("*").eq("id", application_id).execute()
        if not app_response.data:
            raise HTTPException(status_code=404, detail="Application not found")

        app_data = app_response.data[0]

        # Get student data
        student_response = supabase.table("students").select("*").eq("application_id", application_id).execute()
        student_data = student_response.data[0] if student_response.data else {}

        # Get medical data
        medical_response = supabase.table("medical_info").select("*").eq("application_id", application_id).execute()
        medical_data = medical_response.data[0] if medical_response.data else {}

        # Get family data
        family_response = supabase.table("family_info").select("*").eq("application_id", application_id).execute()
        family_data = family_response.data[0] if family_response.data else {}

        # Get fee data
        fee_response = supabase.table("fee_responsibility").select("*").eq("application_id", application_id).execute()
        fee_data = fee_response.data[0] if fee_response.data else {}

        # Get documents
        docs_response = supabase.table("documents").select("*").eq("application_id", application_id).execute()
        documents = docs_response.data if docs_response.data else []

        # Format the response to match the frontend expectations
        formatted_data = {
            "student": {
                "name": f"{student_data.get('first_name', '')} {student_data.get('surname', '')}".strip(),
                "email": "student@example.com",  # Placeholder
                "phone": "123-456-7890"  # Placeholder
            },
            "guardian": {
                "name": f"{family_data.get('father_first_name', '')} {family_data.get('father_surname', '')}".strip() or f"{family_data.get('mother_first_name', '')} {family_data.get('mother_surname', '')}".strip(),
                "relationship": "Parent",
                "email": family_data.get('father_email') or family_data.get('mother_email') or "guardian@example.com",
                "phone": family_data.get('father_mobile') or family_data.get('mother_mobile') or "098-765-4321"
            },
            "documents": [
                {
                    "name": doc.get("original_filename", "Document"),
                    "status": "Verified"
                } for doc in documents
            ],
            "academicHistory": {
                "schoolName": student_data.get("previous_school", "Previous School"),
                "lastGrade": student_data.get("previous_grade", "Grade 10")
            },
            "subjects": {
                "core": ["Mathematics", "English", "Science"],  # Placeholder
                "electives": ["Computer Science", "Art"]  # Placeholder
            },
            "financing": {
                "plan": fee_data.get("fee_person", "Not selected")
            },
            "declaration": {
                "signed": fee_data.get("fee_terms_accepted", False)
            }
        }

        return formatted_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving application: {str(e)}")

@app.post("/academic-history")
async def save_academic_history(data: dict):
    """
    Save academic history data for an application.

    - **data**: Academic history form data
    - **returns**: Success message
    """
    try:
        application_id = data.get('application_id')
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID is required")

        academic_data = {
            "application_id": application_id,
            "school_name": data.get("schoolName"),
            "school_type": data.get("schoolType"),
            "last_grade_completed": data.get("lastGradeCompleted"),
            "academic_year_completed": data.get("academicYearCompleted"),
            "reason_for_leaving": data.get("reasonForLeaving"),
            "principal_name": data.get("principalName"),
            "school_phone_number": data.get("schoolPhoneNumber"),
            "school_email": data.get("schoolEmail"),
            "school_address": data.get("schoolAddress"),
            "subjects_performed_well_in": data.get("subjectsPerformedWellIn", []),
            "areas_needing_improvement": data.get("areasNeedingImprovement", []),
            "additional_notes": data.get("additionalNotes")
        }

        # Handle report card upload if present
        if data.get("reportCard"):
            # This would need to be implemented with file upload logic
            academic_data["report_card_url"] = data.get("reportCardUrl")

        supabase.table("academic_history").upsert(academic_data).execute()

        return {"message": "Academic history saved successfully"}

    except Exception as e:
        logger.error(f"Error saving academic history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving academic history: {str(e)}")

@app.post("/subjects")
async def save_selected_subjects(data: dict):
    """
    Save selected subjects for an application.

    - **data**: Subject selection data
    - **returns**: Success message
    """
    try:
        application_id = data.get('application_id')
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID is required")

        selected_electives = data.get('selectedElectives', [])

        # Delete existing selections for this application
        supabase.table("selected_subjects").delete().eq("application_id", application_id).execute()

        # Insert new selections
        if selected_electives:
            subject_data = []
            for subject_id in selected_electives:
                # Get subject details from constants (this would need to be implemented)
                # For now, we'll store basic info
                subject_data.append({
                    "application_id": application_id,
                    "subject_id": subject_id,
                    "subject_name": subject_id,  # This should be looked up from constants
                    "subject_type": "elective"
                })

            supabase.table("selected_subjects").insert(subject_data).execute()

        return {"message": "Subjects saved successfully"}

    except Exception as e:
        logger.error(f"Error saving subjects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving subjects: {str(e)}")

@app.post("/financing/select-plan")
async def select_financing_plan(data: dict):
    """
    Save selected financing plan for an application.

    - **data**: Financing plan data
    - **returns**: Success message
    """
    try:
        application_id = data.get('application_id')
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID is required")

        financing_data = {
            "application_id": application_id,
            "selected_plan": data.get("plan_type"),
            "plan_details": data.get("plan_details", {})
        }

        supabase.table("financing_options").upsert(financing_data).execute()

        return {"message": "Financing plan saved successfully"}

    except Exception as e:
        logger.error(f"Error saving financing plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving financing plan: {str(e)}")

@app.post("/declaration")
async def save_declaration(data: dict):
    """
    Save declaration data for an application.

    - **data**: Declaration form data
    - **returns**: Success message
    """
    try:
        application_id = data.get('application_id')
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID is required")

        declaration_data = {
            "application_id": application_id,
            "agree_truth": data.get("agree_truth", False),
            "agree_policies": data.get("agree_policies", False),
            "agree_financial": data.get("agree_financial", False),
            "agree_verification": data.get("agree_verification", False),
            "agree_data_processing": data.get("agree_data_processing", False),
            "full_name": data.get("fullName"),
            "city": data.get("city"),
            "date_signed": data.get("date"),
            "status": data.get("status", "in_progress")
        }

        supabase.table("declarations").upsert(declaration_data).execute()

        return {"message": "Declaration saved successfully"}

    except Exception as e:
        logger.error(f"Error saving declaration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving declaration: {str(e)}")

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

        # Update application status to indicate documents are completed
        supabase.table("applications").update({
            "documents_completed": True,
            "updated_at": "now()"
        }).eq("id", application_id).execute()

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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
