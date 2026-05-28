"""
Integration tests for enrollment endpoints.

Tests the complete enrollment flow including auto-save, submission, and retrieval.
"""

import pytest

pytestmark = pytest.mark.asyncio

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI
from unittest.mock import Mock, patch

from app.main import app
from app.api.v1.schemas.enrollment import (
    AutoSaveRequest, EnrollmentData, SubmitApplicationRequest,
    StudentInfo, StudentInfoPartial, MedicalInfo, MedicalInfoPartial,
    FamilyInfo, FamilyInfoPartial, FeeResponsibilityInfo, FeeResponsibilityInfoPartial
)

@pytest_asyncio.fixture
async def client():
    """Create test client"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as client:
        yield client

@pytest.fixture
def auth_headers():
    """Mock authentication headers"""
    return {"Authorization": "Bearer mock-token"}


@pytest.mark.asyncio
class TestEnrollmentEndpoints:
    """Integration tests for enrollment endpoints"""

    async def test_auto_save_enrollment(self, client: AsyncClient, auth_headers: dict):
        """Test auto-save enrollment endpoint"""
        # Arrange - use StudentInfoPartial for auto-save (partial data allowed)
        student_data = StudentInfoPartial(
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
                json=auto_save_data.model_dump(),
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


@pytest_asyncio.fixture
async def client():
    """Create test client"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as client:
        yield client


# ============================================================================
# Bank Statement Analysis Endpoint Tests
# ============================================================================

@pytest.mark.asyncio
class TestBankStatementAnalysisEndpoints:
    """Integration tests for bank statement analysis endpoints."""

    async def test_trigger_analysis_queues_background_task(self, auth_headers: dict):
        """POST trigger endpoint queues background task and returns analysis_queued."""
        from app.core.security import get_current_user as _get_current_user

        application_id = "app_bs_001"
        file_id = "file_bs_001"

        mock_app = {"id": application_id, "user_id": "mock-user-id"}
        mock_files_data = [{
            "files": [{
                "id": file_id,
                "document_type": "bank_statement",
                "bucket_name": "bank_statements",
                "file_path": "path/to/file.pdf"
            }]
        }]

        app.dependency_overrides[_get_current_user] = lambda: {
            "id": "mock-user-id", "role": "authenticated",
            "app_metadata": {}, "user_metadata": {}
        }
        try:
            with (
                patch("app.api.v1.routers.documents.enrollment_repository.get_application_by_id_and_user",
                      return_value=mock_app),
                patch("app.api.v1.routers.documents.supabase_service") as mock_sb,
                patch("app.api.v1.routers.documents.bank_statement_service.analyse_bank_statement"),
            ):
                select_mock = Mock()
                select_mock.data = mock_files_data
                analysis_check_mock = Mock()
                analysis_check_mock.data = []

                mock_sb.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
                    select_mock,
                    analysis_check_mock
                ]

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as ac:
                    response = await ac.post(
                        f"/api/v1/documents/{application_id}/analyse-bank-statement/{file_id}",
                        headers=auth_headers
                    )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "analysis_queued"
        assert data["file_id"] == file_id

    async def test_trigger_analysis_returns_403_for_non_owner(self, auth_headers: dict):
        """Trigger endpoint returns 403 if user does not own the application."""
        from app.core.security import get_current_user as _get_current_user

        app.dependency_overrides[_get_current_user] = lambda: {
            "id": "mock-user-id", "role": "authenticated",
            "app_metadata": {}, "user_metadata": {}
        }
        try:
            with patch(
                "app.api.v1.routers.documents.enrollment_repository.get_application_by_id_and_user",
                return_value=None
            ):
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as ac:
                    response = await ac.post(
                        "/api/v1/documents/wrong_app/analyse-bank-statement/file_1",
                        headers=auth_headers
                    )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403

    async def test_trigger_analysis_skips_duplicate_complete(self, auth_headers: dict):
        """Trigger endpoint returns already_complete if a complete record exists."""
        from app.core.security import get_current_user as _get_current_user

        application_id = "app_bs_002"
        file_id = "file_bs_002"

        mock_app = {"id": application_id, "user_id": "mock-user-id"}
        mock_files_data = [{
            "files": [{
                "id": file_id,
                "document_type": "bank_statement",
                "bucket_name": "bank_statements",
                "file_path": "path/to/file.pdf"
            }]
        }]

        app.dependency_overrides[_get_current_user] = lambda: {
            "id": "mock-user-id", "role": "authenticated",
            "app_metadata": {}, "user_metadata": {}
        }
        try:
            with (
                patch("app.api.v1.routers.documents.enrollment_repository.get_application_by_id_and_user",
                      return_value=mock_app),
                patch("app.api.v1.routers.documents.supabase_service") as mock_sb,
            ):
                files_resp = Mock()
                files_resp.data = mock_files_data
                existing_resp = Mock()
                existing_resp.data = [{"id": "existing_analysis_id", "status": "complete"}]

                # The router makes two separate supabase queries:
                # 1. uploaded_files: .table().select().eq().execute()
                # 2. bank_statement_analyses: .table().select().eq().eq().eq().execute()
                # We use a call counter so execute() returns the right thing each time.
                execute_call_count = {"n": 0}
                responses = [files_resp, existing_resp]

                def execute_side_effect():
                    r = responses[execute_call_count["n"]]
                    execute_call_count["n"] += 1
                    return r

                # Make all chained methods return the same mock so .eq().eq().eq() works
                chain = Mock()
                chain.execute.side_effect = execute_side_effect
                chain.select.return_value = chain
                chain.eq.return_value = chain
                chain.order.return_value = chain
                chain.limit.return_value = chain
                mock_sb.table.return_value = chain

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as ac:
                    response = await ac.post(
                        f"/api/v1/documents/{application_id}/analyse-bank-statement/{file_id}",
                        headers=auth_headers
                    )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "already_complete"


    async def test_get_analysis_returns_data_for_admin(self, auth_headers: dict):
        """GET endpoint returns analysis data for admin callers."""
        from app.core.security import get_current_user as _get_current_user

        application_id = "app_bs_003"
        mock_analysis = {
            "id": "analysis_001",
            "application_id": application_id,
            "file_id": "file_001",
            "status": "complete",
            "risk_score": 55,
            "ai_summary": "Healthy finances.",
            "flags": [],
            "model_version": "gpt-4o",
            "created_at": "2026-05-27T10:00:00+00:00",
        }

        app.dependency_overrides[_get_current_user] = lambda: {
            "id": "admin-user-id",
            "role": "admin",
            "app_metadata": {"role": "admin"},
            "user_metadata": {}
        }
        try:
            with patch("app.api.v1.routers.documents.supabase_service") as mock_sb:
                result_mock = Mock()
                result_mock.data = [mock_analysis]
                mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = result_mock

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as ac:
                    response = await ac.get(
                        f"/api/v1/documents/{application_id}/bank-statement-analysis",
                        headers=auth_headers
                    )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "complete"
        assert data["risk_score"] == 55

    async def test_get_analysis_returns_403_for_non_admin(self, auth_headers: dict):
        """GET endpoint returns 403 for non-admin (parent) callers."""
        from app.core.security import get_current_user as _get_current_user

        app.dependency_overrides[_get_current_user] = lambda: {
            "id": "parent-user-id",
            "role": "authenticated",
            "app_metadata": {},
            "user_metadata": {}
        }
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as ac:
                response = await ac.get(
                    "/api/v1/documents/app_bs_004/bank-statement-analysis",
                    headers=auth_headers
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403

    async def test_get_analysis_returns_404_when_none_exists(self, auth_headers: dict):
        """GET endpoint returns 404 when no analysis record exists."""
        from app.core.security import get_current_user as _get_current_user

        app.dependency_overrides[_get_current_user] = lambda: {
            "id": "admin-user-id",
            "role": "admin",
            "app_metadata": {"role": "admin"},
            "user_metadata": {}
        }
        try:
            with patch("app.api.v1.routers.documents.supabase_service") as mock_sb:
                empty_mock = Mock()
                empty_mock.data = []
                mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = empty_mock

                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as ac:
                    response = await ac.get(
                        "/api/v1/documents/app_bs_005/bank-statement-analysis",
                        headers=auth_headers
                    )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
