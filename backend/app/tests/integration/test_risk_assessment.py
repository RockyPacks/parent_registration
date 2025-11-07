import pytest
import httpx
from unittest.mock import patch, MagicMock

from app.api.v1.schemas.risk import RiskCheckRequest, RiskReportResponse
from app.services.risk_service import RiskAssessmentService # Import the service directly for patching

# Assuming your FastAPI app is available at backend.main:app
# For integration tests, we'll use httpx to make requests to the test client
# If you have a test client setup, use that. Otherwise, we can simulate calls.

# Mocking the get_current_user dependency
async def mock_get_current_user():
    return {"application_id": "test_app_123"}

# Mocking the supabase client for database operations
mock_supabase = MagicMock()

# Mocking the settings object
class MockSettings:
    def __init__(self, netcash_risk_key=None, netcash_risk_base=None):
        self.netcash_risk_key = netcash_risk_key
        self.netcash_risk_base = netcash_risk_base

# --- Test Cases ---

@pytest.mark.asyncio
async def test_risk_check_success_fallback():
    """
    Test risk check with valid data when Netcash API is not configured (fallback).
    """
    # Patch settings to simulate no Netcash credentials
    with patch('app.core.config.settings', MockSettings(netcash_risk_key=None, netcash_risk_base=None)):
        # Patch the supabase client used within the service
        with patch('app.services.risk_service.supabase', mock_supabase):
            # Create a request instance
            request_data = RiskCheckRequest(
                reference="TEST-REF-001",
                guardian={
                    "branch_code": "123456",
                    "account_number": "1234567890",
                    "name": "John Doe",
                    "email": "john.doe@example.com",
                    "id_number": "8001015009087"
                }
            )

            # Instantiate the service
            risk_service_instance = RiskAssessmentService()
            
            # Call the service method
            # We need to mock the application_id as it's passed from the dependency
            result = risk_service_instance.run_risk_check(request_data, "test_app_123")

            # Assertions
            assert isinstance(result, RiskReportResponse)
            assert result.risk_score == 75.0 # Based on account_number starting with "123" in fallback
            assert result.status == "medium"
            assert result.flags == ["Account pattern requires verification"]
            
            # Verify database insertion was called with correct data
            mock_supabase.table("risk_reports").insert.assert_called_once()
            call_args, _ = mock_supabase.table("risk_reports").insert.call_args
            inserted_data = call_args[0]
            assert inserted_data["reference"] == "TEST-REF-001"
            assert inserted_data["risk_score"] == 75.0
            assert inserted_data["status"] == "medium"
            assert inserted_data["branch_code"] == "123456"
            assert inserted_data["account_number"] == "1234567890"
            assert inserted_data["raw_response"]["api_response"] is None # Fallback means no API response

@pytest.mark.asyncio
async def test_risk_check_invalid_branch_code():
    """
    Test risk check with an invalid branch code.
    """
    # Patch settings to simulate no Netcash credentials
    with patch('app.core.config.settings', MockSettings(netcash_risk_key=None, netcash_risk_base=None)):
        with patch('app.services.risk_service.supabase', mock_supabase):
            request_data = RiskCheckRequest(
                reference="TEST-REF-002",
                guardian={
                    "branch_code": "123", # Invalid length
                    "account_number": "1234567890",
                    "name": "Jane Doe",
                    "email": "jane.doe@example.com",
                    "id_number": "8001015009087"
                }
            )

            risk_service_instance = RiskAssessmentService()
            result = risk_service_instance.run_risk_check(request_data, "test_app_123")

            assert isinstance(result, RiskReportResponse)
            assert result.risk_score == 85.0
            assert result.status == "high"
            assert result.flags == ["Invalid branch code format"]
            mock_supabase.table("risk_reports").insert.assert_called_once()
            call_args, _ = mock_supabase.table("risk_reports").insert.call_args
            inserted_data = call_args[0]
            assert inserted_data["branch_code"] == "123"
            assert inserted_data["risk_score"] == 85.0

@pytest.mark.asyncio
async def test_risk_check_invalid_account_number():
    """
    Test risk check with an invalid account number.
    """
    with patch('app.core.config.settings', MockSettings(netcash_risk_key=None, netcash_risk_base=None)):
        with patch('app.services.risk_service.supabase', mock_supabase):
            request_data = RiskCheckRequest(
                reference="TEST-REF-003",
                guardian={
                    "branch_code": "123456",
                    "account_number": "123", # Invalid length
                    "name": "Peter Pan",
                    "email": "peter.pan@example.com",
                    "id_number": "8001015009087"
                }
            )

            risk_service_instance = RiskAssessmentService()
            result = risk_service_instance.run_risk_check(request_data, "test_app_123")

            assert isinstance(result, RiskReportResponse)
            assert result.risk_score == 85.0
            assert result.status == "high"
            assert result.flags == ["Invalid account number format"]
            mock_supabase.table("risk_reports").insert.assert_called_once()
            call_args, _ = mock_supabase.table("risk_reports").insert.call_args
            inserted_data = call_args[0]
            assert inserted_data["account_number"] == "123"
            assert inserted_data["risk_score"] == 85.0

@pytest.mark.asyncio
async def test_risk_check_missing_banking_details():
    """
    Test risk check with missing banking details.
    """
    with patch('app.core.config.settings', MockSettings(netcash_risk_key=None, netcash_risk_base=None)):
        with patch('app.services.risk_service.supabase', mock_supabase):
            request_data = RiskCheckRequest(
                reference="TEST-REF-004",
                guardian={
                    "branch_code": "", # Missing
                    "account_number": "", # Missing
                    "name": "Wendy Darling",
                    "email": "wendy.darling@example.com",
                    "id_number": "8001015009087"
                }
            )

            risk_service_instance = RiskAssessmentService()
            result = risk_service_instance.run_risk_check(request_data, "test_app_123")

            assert isinstance(result, RiskReportResponse)
            assert result.risk_score == 100.0
            assert result.status == "high"
            assert result.flags == ["Missing banking details"]
            mock_supabase.table("risk_reports").insert.assert_called_once()
            call_args, _ = mock_supabase.table("risk_reports").insert.call_args
            inserted_data = call_args[0]
            assert inserted_data["branch_code"] == ""
            assert inserted_data["account_number"] == ""
            assert inserted_data["risk_score"] == 100.0

@pytest.mark.asyncio
async def test_risk_check_netcash_api_call_success():
    """
    Test risk check when Netcash API is configured and returns a successful response.
    """
    mock_api_response = {
        "Reference": "KNIT-TEST-0001",
        "RiskScore": 12,
        "Status": "Success",
        "Flags": ["BankAccountValidated", "IDVerified"],
        "Timestamp": "2025-10-29T10:24:00Z"
    }

    # Patch settings to simulate Netcash credentials being configured
    with patch('app.core.config.settings', MockSettings(netcash_risk_key="mock_key", netcash_risk_base="http://mock-netcash.com")):
        # Patch the requests.post call to return our mock response
        with patch('app.services.risk_service.requests.post') as mock_post:
            mock_response = MagicMock()
            mock_response.json.return_value = mock_api_response
            mock_response.raise_for_status.return_value = None # Simulate successful HTTP status
            mock_post.return_value = mock_response

            # Patch the supabase client
            with patch('app.services.risk_service.supabase', mock_supabase):
                request_data = RiskCheckRequest(
                    reference="TEST-REF-NETCASH-SUCCESS",
                    guardian={
                        "branch_code": "250655",
                        "account_number": "1234567890",
                        "name": "Netcash Test User",
                        "email": "netcash.test@example.com",
                        "id_number": "8001015009087"
                    }
                )

                risk_service_instance = RiskAssessmentService()
                result = risk_service_instance.run_risk_check(request_data, "test_app_123")

                # Assertions for the result
                assert isinstance(result, RiskReportResponse)
                assert result.risk_score == 12.0
                assert result.status == "low" # Determined by _determine_status
                assert result.flags == ["BankAccountValidated", "IDVerified"]

                # Verify requests.post was called correctly
                expected_url = "http://mock-netcash.com/GetRiskReport"
                expected_headers = {
                    "Content-Type": "application/json",
                    "ServiceKey": "mock_key"
                }
                expected_payload = {
                    "Reference": "TEST-REF-NETCASH-SUCCESS",
                    "Customer": {
                        "Name": "Netcash Test User",
                        "Email": "netcash.test@example.com",
                        "IdNumber": "8001015009087",
                        "BankAccount": {
                            "BranchCode": "250655",
                            "AccountNumber": "1234567890"
                        }
                    }
                }
                mock_post.assert_called_once_with(expected_url, json=expected_payload, headers=expected_headers, timeout=30)

                # Verify database insertion was called with correct data
                mock_supabase.table("risk_reports").insert.assert_called_once()
                call_args, _ = mock_supabase.table("risk_reports").insert.call_args
                inserted_data = call_args[0]
                assert inserted_data["reference"] == "TEST-REF-NETCASH-SUCCESS"
                assert inserted_data["risk_score"] == 12.0
                assert inserted_data["status"] == "low"
                assert inserted_data["raw_response"]["api_response"] == mock_api_response

@pytest.mark.asyncio
async def test_risk_check_netcash_api_error_fallback():
    """
    Test risk check when Netcash API call fails (e.g., 500 error).
    """
    # Patch settings to simulate Netcash credentials being configured
    with patch('app.core.config.settings', MockSettings(netcash_risk_key="mock_key", netcash_risk_base="http://mock-netcash.com")):
        # Patch the requests.post call to raise an exception
        with patch('app.services.risk_service.requests.post') as mock_post:
            mock_post.side_effect = httpx.HTTPStatusError("Simulated 500 error", request=httpx.Request("POST", "http://mock-netcash.com/GetRiskReport"), response=httpx.Response(500, request=httpx.Request("POST", "http://mock-netcash.com/GetRiskReport")))

            # Patch the supabase client
            with patch('app.services.risk_service.supabase', mock_supabase):
                request_data = RiskCheckRequest(
                    reference="TEST-REF-NETCASH-ERROR",
                    guardian={
                        "branch_code": "250655",
                        "account_number": "9876543210",
                        "name": "Netcash Error User",
                        "email": "netcash.error@example.com",
                        "id_number": "8001015009087"
                    }
                )

                risk_service_instance = RiskAssessmentService()
                result = risk_service_instance.run_risk_check(request_data, "test_app_123")

                # Assertions for the result (should fall back to mock assessment)
                assert isinstance(result, RiskReportResponse)
                assert result.risk_score == 15.0 # Default low risk for valid accounts when fallback occurs
                assert result.status == "low"
                assert result.flags == ["Account verified"]

                # Verify requests.post was called
                mock_post.assert_called_once()

                # Verify database insertion was called with fallback data
                mock_supabase.table("risk_reports").insert.assert_called_once()
                call_args, _ = mock_supabase.table("risk_reports").insert.call_args
                inserted_data = call_args[0]
                assert inserted_data["reference"] == "TEST-REF-NETCASH-ERROR"
                assert inserted_data["risk_score"] == 15.0
                assert inserted_data["status"] == "low"
                assert inserted_data["raw_response"]["api_response"] is None # Fallback means no API response

# Note: To run these tests, you would typically use pytest.
# You might need to install pytest and httpx:
# pip install pytest httpx
# Then run pytest from your terminal in the project root.
