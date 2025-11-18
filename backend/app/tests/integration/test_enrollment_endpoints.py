"""
Integration tests for enrollment endpoints.

Tests the complete enrollment flow including auto-save, submission, and retrieval.
"""

import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from unittest.mock import Mock, patch

from app.main import app
from app.api.v1.schemas.enrollment import (
    AutoSaveRequest, EnrollmentData, SubmitApplicationRequest,
    StudentInfo, MedicalInfo, FamilyInfo, FeeResponsibilityInfo
)


@pytest.mark.asyncio
class TestEnrollmentEndpoints:
    """Integration tests for enrollment endpoints"""

    async def test_auto_save_enrollment(self, client: AsyncClient, auth_headers: dict):
        """Test auto-save enrollment endpoint"""
        # Arrange
        student_data = StudentInfo(
            surname="Doe", first_name="John", date_of_birth="2010-01-01",
            gender="male", home_language="English", id_number="1234567890123",
            previous_grade="Grade 6", grade_applied_for="Grade 7",
            previous_school="Test School"
        )
        auto_save_data = AutoSaveRequest(student=student_data)

        mock_response = Mock()
        mock_response.message = "Progress saved successfully"
        mock_response.application_id = "app123"

        with patch('app.services.enrollment_service.enrollment_service.auto_save_enrollment') as mock_auto_save:
            mock_auto_save.return_value = mock_response

            # Act
            response = await client.post(
                "/api/v1/enrollment/auto-save",
                json=auto_save_data.dict(),
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Progress saved successfully"
            assert data["application_id"] == "app123"

    async def test_submit_enrollment(self, client: AsyncClient, auth_headers: dict):
        """Test submit enrollment endpoint"""
        # Arrange
        student_data = StudentInfo(
            surname="Doe", first_name="John", date_of_birth="2010-01-01",
            gender="male", home_language="English", id_number="1234567890123",
            previous_grade="Grade 6", grade_applied_for="Grade 7",
            previous_school="Test School"
        )
        medical_data = MedicalInfo()
        family_data = FamilyInfo()
        fee_data = FeeResponsibilityInfo(
            fee_person="Parent", relationship="Father", fee_terms_accepted=True
        )

        enrollment_data = EnrollmentData(
            student=student_data,
            medical=medical_data,
            family=family_data,
            fee=fee_data
        )

        mock_response = Mock()
        mock_response.message = "Enrollment submitted successfully"
        mock_response.application_id = "app456"

        with patch('app.services.enrollment_service.enrollment_service.submit_enrollment') as mock_submit:
            mock_submit.return_value = mock_response

            # Act
            response = await client.post(
                "/api/v1/enrollment/submit",
                json=enrollment_data.dict(),
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Enrollment submitted successfully"
            assert data["application_id"] == "app456"

    async def test_get_application(self, client: AsyncClient, auth_headers: dict):
        """Test get application endpoint"""
        # Arrange
        application_id = "app123"
        mock_app_data = {
            "id": application_id,
            "status": "in_progress",
            "created_at": "2024-01-01T00:00:00Z",
            "student": {"surname": "Doe", "first_name": "John"},
            "medical": {},
            "family": {},
            "fee": {"fee_person": "Parent"}
        }

        with patch('app.services.enrollment_service.enrollment_service.get_application') as mock_get:
            mock_get.return_value = Mock(**mock_app_data)

            # Act
            response = await client.get(
                f"/api/v1/enrollment/application/{application_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == application_id
            assert data["status"] == "in_progress"
            assert data["student"]["surname"] == "Doe"

    async def test_get_application_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test get application when not found"""
        # Arrange
        application_id = "nonexistent"

        with patch('app.services.enrollment_service.enrollment_service.get_application') as mock_get:
            mock_get.side_effect = Exception("Application not found")

            # Act
            response = await client.get(
                f"/api/v1/enrollment/application/{application_id}",
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 404

    async def test_submit_application(self, client: AsyncClient, auth_headers: dict):
        """Test submit application endpoint"""
        # Arrange
        submit_data = SubmitApplicationRequest(application_id="app123")

        mock_response = Mock()
        mock_response.message = "Application submitted successfully"
        mock_response.application_id = "app123"

        with patch('app.services.enrollment_service.enrollment_service.submit_application') as mock_submit:
            mock_submit.return_value = mock_response

            # Act
            response = await client.post(
                "/api/v1/enrollment/submit-application",
                json=submit_data.dict(),
                headers=auth_headers
            )

            # Assert
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Application submitted successfully"

    async def test_enrollment_validation_error(self, client: AsyncClient, auth_headers: dict):
        """Test enrollment submission with invalid data"""
        # Arrange
        invalid_data = {
            "student": {
                "surname": "",  # Required field empty
                "first_name": "John",
                "date_of_birth": "invalid-date",
                "gender": "male",
                "home_language": "English",
                "id_number": "123",  # Too short
                "previous_grade": "Grade 6",
                "grade_applied_for": "Grade 7",
                "previous_school": "Test School"
            },
            "medical": {},
            "family": {},
            "fee": {"fee_person": "Parent", "relationship": "Father"}
        }

        # Act
        response = await client.post(
            "/api/v1/enrollment/submit",
            json=invalid_data,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 422  # Validation error


@pytest.fixture
def auth_headers():
    """Mock authentication headers"""
    return {"Authorization": "Bearer mock-token"}


@pytest.fixture
async def client():
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client
