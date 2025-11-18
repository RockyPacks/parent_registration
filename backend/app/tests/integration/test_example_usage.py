"""
Integration test examples demonstrating complete API usage flows.

These tests show realistic usage patterns for the enrollment system,
including user registration, login, enrollment submission, and document upload.
"""

import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from unittest.mock import Mock, patch

from app.main import app
from app.api.v1.schemas.auth import SignupRequest, LoginRequest
from app.api.v1.schemas.enrollment import (
    AutoSaveRequest, EnrollmentData, SubmitApplicationRequest,
    StudentInfo, MedicalInfo, FamilyInfo, FeeResponsibilityInfo
)


@pytest.mark.asyncio
class TestCompleteEnrollmentFlow:
    """Example integration tests for complete enrollment flow"""

    async def test_complete_user_enrollment_flow(self, client: AsyncClient):
        """
        Example: Complete user enrollment flow from signup to submission.

        This test demonstrates:
        1. User registration
        2. User login
        3. Auto-saving enrollment progress
        4. Final enrollment submission
        """
        # Step 1: User Registration
        signup_data = SignupRequest(
            full_name="John Doe",
            email="john.doe@example.com",
            password="securepassword123"
        )

        signup_response = {
            "message": "User registered successfully",
            "user": {"id": 1, "email": "john.doe@example.com", "full_name": "John Doe"}
        }

        with patch('app.services.auth_service.auth_service.signup') as mock_signup:
            mock_signup.return_value = Mock(**signup_response)

            response = await client.post("/api/v1/auth/signup", json=signup_data.dict())
            assert response.status_code == 200
            user_data = response.json()

        # Step 2: User Login
        login_data = LoginRequest(
            email="john.doe@example.com",
            password="securepassword123"
        )

        login_response = {
            "access_token": "mock-jwt-token-123",
            "token_type": "bearer",
            "user": {"id": 1, "email": "john.doe@example.com"}
        }

        with patch('app.services.auth_service.auth_service.login') as mock_login:
            mock_login.return_value = Mock(**login_response)

            response = await client.post("/api/v1/auth/login", json=login_data.dict())
            assert response.status_code == 200
            auth_data = response.json()
            access_token = auth_data["access_token"]

        auth_headers = {"Authorization": f"Bearer {access_token}"}

        # Step 3: Auto-save Student Information
        student_info = StudentInfo(
            surname="Doe",
            first_name="John",
            middle_name="William",
            preferred_name="Johnny",
            date_of_birth="2010-05-15",
            gender="male",
            home_language="English",
            id_number="1005155019087",
            previous_grade="Grade 6",
            grade_applied_for="Grade 7",
            previous_school="Springfield Elementary"
        )

        auto_save_data = AutoSaveRequest(student=student_info)

        auto_save_response = {
            "message": "Progress saved successfully",
            "application_id": "app-12345"
        }

        with patch('app.services.enrollment_service.enrollment_service.auto_save_enrollment') as mock_auto_save:
            mock_auto_save.return_value = Mock(**auto_save_response)

            response = await client.post(
                "/api/v1/enrollment/auto-save",
                json=auto_save_data.dict(),
                headers=auth_headers
            )
            assert response.status_code == 200
            save_data = response.json()
            application_id = save_data["application_id"]

        # Step 4: Auto-save Medical Information
        medical_info = MedicalInfo(
            medical_aid_name="Discovery Health",
            member_number="DH123456",
            conditions=["Mild asthma"],
            allergies="Dust mites, pollen"
        )

        medical_save_data = AutoSaveRequest(
            application_id=application_id,
            medical=medical_info
        )

        with patch('app.services.enrollment_service.enrollment_service.auto_save_enrollment') as mock_auto_save:
            mock_auto_save.return_value = Mock(**auto_save_response)

            response = await client.post(
                "/api/v1/enrollment/auto-save",
                json=medical_save_data.dict(),
                headers=auth_headers
            )
            assert response.status_code == 200

        # Step 5: Auto-save Family Information
        family_info = FamilyInfo(
            father_surname="Doe",
            father_first_name="Robert",
            father_id_number="7501015009087",
            father_mobile="+27 71 234 5678",
            father_email="robert.doe@example.com",
            mother_surname="Doe",
            mother_first_name="Jane",
            mother_id_number="7802026009098",
            mother_mobile="+27 72 345 6789",
            mother_email="jane.doe@example.com"
        )

        family_save_data = AutoSaveRequest(
            application_id=application_id,
            family=family_info
        )

        with patch('app.services.enrollment_service.enrollment_service.auto_save_enrollment') as mock_auto_save:
            mock_auto_save.return_value = Mock(**auto_save_response)

            response = await client.post(
                "/api/v1/enrollment/auto-save",
                json=family_save_data.dict(),
                headers=auth_headers
            )
            assert response.status_code == 200

        # Step 6: Auto-save Fee Information
        fee_info = FeeResponsibilityInfo(
            fee_person="Robert Doe",
            relationship="Father",
            fee_terms_accepted=True
        )

        fee_save_data = AutoSaveRequest(
            application_id=application_id,
            fee=fee_info
        )

        with patch('app.services.enrollment_service.enrollment_service.auto_save_enrollment') as mock_auto_save:
            mock_auto_save.return_value = Mock(**auto_save_response)

            response = await client.post(
                "/api/v1/enrollment/auto-save",
                json=fee_save_data.dict(),
                headers=auth_headers
            )
            assert response.status_code == 200

        # Step 7: Submit Complete Enrollment
        complete_enrollment = EnrollmentData(
            student=student_info,
            medical=medical_info,
            family=family_info,
            fee=fee_info
        )

        submit_response = {
            "message": "Enrollment submitted successfully",
            "application_id": application_id
        }

        with patch('app.services.enrollment_service.enrollment_service.submit_enrollment') as mock_submit:
            mock_submit.return_value = Mock(**submit_response)

            response = await client.post(
                "/api/v1/enrollment/submit",
                json=complete_enrollment.dict(),
                headers=auth_headers
            )
            assert response.status_code == 200
            final_data = response.json()
            assert final_data["message"] == "Enrollment submitted successfully"

    async def test_document_upload_flow(self, client: AsyncClient):
        """
        Example: Document upload flow.

        This test demonstrates uploading required documents for an application.
        """
        auth_headers = {"Authorization": "Bearer mock-token"}

        # Mock file upload - in real scenario, this would be actual file data
        files = {
            "file": ("birth_certificate.pdf", b"mock pdf content", "application/pdf")
        }
        data = {
            "document_type": "birth_certificate",
            "application_id": "app-12345"
        }

        # Mock successful upload response
        with patch('app.services.document_service.document_service.upload_document') as mock_upload:
            mock_upload.return_value = {"message": "Document uploaded successfully", "document_id": "doc-123"}

            response = await client.post(
                "/api/v1/documents/upload",
                files=files,
                data=data,
                headers=auth_headers
            )

            # Note: In real implementation, this would return 200 on success
            # This is just an example structure
            assert response.status_code in [200, 201]  # Success status codes

    async def test_payment_flow(self, client: AsyncClient):
        """
        Example: Payment processing flow.

        This test demonstrates creating a payment and checking status.
        """
        auth_headers = {"Authorization": "Bearer mock-token"}

        payment_data = {
            "amount": 1500.00,
            "reference": "PAY-2024-001",
            "description": "School enrollment fee"
        }

        # Mock payment creation
        with patch('app.services.payment_service.payment_service.create_payment') as mock_create:
            mock_create.return_value = {
                "reference": "PAY-2024-001",
                "status": "pending",
                "payment_url": "https://payment.gateway.com/pay/123"
            }

            response = await client.post(
                "/api/v1/payments/create-payment",
                json=payment_data,
                headers=auth_headers
            )
            assert response.status_code == 200

        # Mock payment status check
        with patch('app.services.payment_service.payment_service.get_payment_status') as mock_status:
            mock_status.return_value = {
                "reference": "PAY-2024-001",
                "status": "completed",
                "amount": 1500.00,
                "paid_at": "2024-01-15T10:30:00Z"
            }

            response = await client.get(
                "/api/v1/payments/payment-status/PAY-2024-001",
                headers=auth_headers
            )
            assert response.status_code == 200


@pytest.fixture
async def client():
    """Create test client for integration tests"""
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client
