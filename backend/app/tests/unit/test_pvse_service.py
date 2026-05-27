"""
Unit tests for PvseService.

Tests cover:
- start_verification: happy path, missing config, Experian errors, retry
- submit_answers: pass/fail/soft_lock/hard_lock result mapping
- get_status: not started, existing record
- _redact_provider_body: sensitive key removal
- POPIA: ClientConsent flag, no raw ID numbers in logs
"""

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import HTTPException

from app.services.pvse_service import PvseService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_service(*, username="user", password="pass", subscriber="35052-REA", threshold=65):
    """Return a PvseService with a mocked repository and minimal settings."""
    service = PvseService()
    service.repository = MagicMock()
    service.repository.get_application_for_user.return_value = {"id": "app-1", "user_id": "u-1"}
    service.repository.get_fee_responsibility.return_value = {
        "parent_id_number": "9404095402082",  # valid Luhn SA ID
        "parent_first_name": "Jane",
        "parent_surname": "Smith",
    }
    service.repository.create_transaction.return_value = {
        "transaction_id": "TXN-001",
        "result": "questions_generated",
        "threshold": threshold,
    }
    return service


def _mock_response(status_code: int, body: Dict[str, Any]) -> MagicMock:
    """Return a mock httpx.Response."""
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = body
    return resp


SAMPLE_QUESTIONS_BODY = {
    "TransactionID": "TXN-001",
    "Questions": [
        {
            "QuestionID": "Q1",
            "QuestionText": "What colour is the sky?",
            "Answers": [
                {"AnswerID": "A1", "AnswerText": "Blue"},
                {"AnswerID": "A2", "AnswerText": "Red"},
            ],
        }
    ],
}

SAMPLE_PASS_BODY = {
    "TransactionID": "TXN-001",
    "Score": 80.0,
    "ResultStatus": "Passed",
}

SAMPLE_FAIL_BODY = {
    "TransactionID": "TXN-001",
    "Score": 50.0,
    "ResultStatus": "Failed",
}

SAMPLE_SOFT_LOCK_BODY = {
    "TransactionID": "TXN-001",
    "Score": None,
    "ResultStatus": "SoftLocked",
}

SAMPLE_HARD_LOCK_BODY = {
    "TransactionID": "TXN-001",
    "Score": None,
    "ResultStatus": "HardLocked",
}


# ---------------------------------------------------------------------------
# Settings patch helper
# ---------------------------------------------------------------------------

def _patch_settings(**overrides):
    defaults = {
        "experian_username": "user",
        "experian_password": "pass",
        "experian_subscriber_code": "35052-REA",
        "experian_accuracy_threshold": 65,
        "experian_timeout_seconds": 10,
        "experian_environment": "uat",
        "experian_uat_base_url": "https://apis-uat.experian.co.za:9443/PvseService",
        "experian_prod_base_url": "https://apis.experian.co.za:9443/PvseService",
    }
    defaults.update(overrides)
    return patch("app.services.pvse_service.settings", **{k: MagicMock(return_value=v) if callable(v) else v for k, v in defaults.items()})


# ---------------------------------------------------------------------------
# start_verification tests
# ---------------------------------------------------------------------------

class TestStartVerification:
    @pytest.mark.anyio
    async def test_happy_path_returns_questions(self):
        service = _make_service()
        mock_resp = _mock_response(200, SAMPLE_QUESTIONS_BODY)

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.return_value = mock_resp
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                result = await service.start_verification("app-1", "u-1")

        assert result["result"] == "questions_generated"
        assert result["transaction_id"] == "TXN-001"
        assert len(result["questions"]) == 1
        assert result["questions"][0]["question_id"] == "Q1"

    @pytest.mark.anyio
    async def test_client_consent_included_in_payload(self):
        """Every Experian request must carry ClientConsent: 'Y' (POPIA requirement)."""
        service = _make_service()
        mock_resp = _mock_response(200, SAMPLE_QUESTIONS_BODY)
        captured_payload: Dict = {}

        async def capture_post(url, **kwargs):
            captured_payload.update(kwargs.get("json", {}))
            return mock_resp

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.side_effect = capture_post
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                await service.start_verification("app-1", "u-1")

        assert captured_payload.get("ClientConsent") == "Y"

    @pytest.mark.anyio
    async def test_missing_config_raises_503(self):
        service = _make_service()

        with _patch_settings(experian_username="", experian_password=""):
            with pytest.raises(HTTPException) as exc_info:
                await service.start_verification("app-1", "u-1")

        assert exc_info.value.status_code == 503

    @pytest.mark.anyio
    async def test_application_not_found_raises_404(self):
        service = _make_service()
        service.repository.get_application_for_user.return_value = None

        with _patch_settings():
            with pytest.raises(HTTPException) as exc_info:
                await service.start_verification("app-1", "u-1")

        assert exc_info.value.status_code == 404

    @pytest.mark.anyio
    async def test_missing_parent_details_raises_400(self):
        service = _make_service()
        service.repository.get_fee_responsibility.return_value = {
            "parent_id_number": "",
            "parent_first_name": "",
            "parent_surname": "",
        }

        with _patch_settings():
            with pytest.raises(HTTPException) as exc_info:
                await service.start_verification("app-1", "u-1")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_experian_timeout_retries_once_then_raises_504(self):
        service = _make_service()
        call_count = 0

        async def timeout_post(url, **kwargs):
            nonlocal call_count
            call_count += 1
            raise httpx.TimeoutException("timed out")

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.side_effect = timeout_post
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
                    with pytest.raises(HTTPException) as exc_info:
                        await service.start_verification("app-1", "u-1")

        assert exc_info.value.status_code == 504
        assert call_count == 2  # original + 1 retry
        mock_sleep.assert_awaited_once_with(5.0)

    @pytest.mark.anyio
    async def test_experian_network_error_retries_once_then_raises_503(self):
        service = _make_service()
        call_count = 0

        async def network_error_post(url, **kwargs):
            nonlocal call_count
            call_count += 1
            raise httpx.ConnectError("connection refused")

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.side_effect = network_error_post
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
                    with pytest.raises(HTTPException) as exc_info:
                        await service.start_verification("app-1", "u-1")

        assert exc_info.value.status_code == 503
        assert call_count == 2
        mock_sleep.assert_awaited_once_with(10.0)

    @pytest.mark.anyio
    async def test_experian_401_raises_503_not_401(self):
        """Auth failures should not expose 401 to clients — return 503 instead."""
        service = _make_service()

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.return_value = _mock_response(401, {"error": "unauthorized"})
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                with pytest.raises(HTTPException) as exc_info:
                    await service.start_verification("app-1", "u-1")

        assert exc_info.value.status_code == 503

    @pytest.mark.anyio
    async def test_transaction_id_stored_on_success(self):
        """Transaction ID must be persisted every time (POPIA audit trail)."""
        service = _make_service()

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.return_value = _mock_response(200, SAMPLE_QUESTIONS_BODY)
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                await service.start_verification("app-1", "u-1")

        service.repository.create_transaction.assert_called_once()
        call_kwargs = service.repository.create_transaction.call_args.kwargs
        assert call_kwargs["transaction_id"] == "TXN-001"


# ---------------------------------------------------------------------------
# submit_answers tests
# ---------------------------------------------------------------------------

class TestSubmitAnswers:
    def _setup_existing(self, service, result="questions_generated"):
        service.repository.get_by_transaction_for_user.return_value = {
            "transaction_id": "TXN-001",
            "result": result,
            "score": None,
            "threshold": 65,
            "locked_until": None,
        }
        service.repository.update_transaction.side_effect = lambda transaction_id, user_id, update_data: {
            "transaction_id": transaction_id,
            **update_data,
            "threshold": 65,
        }

    @pytest.mark.anyio
    async def test_passing_score_returns_passed(self):
        service = _make_service()
        self._setup_existing(service)

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.return_value = _mock_response(200, SAMPLE_PASS_BODY)
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                result = await service.submit_answers(
                    "TXN-001", [{"question_id": "Q1", "answer_id": "A1"}], "u-1"
                )

        assert result["result"] == "passed"
        assert result["verified"] is True

    @pytest.mark.anyio
    async def test_failing_score_returns_failed(self):
        service = _make_service()
        self._setup_existing(service)

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.return_value = _mock_response(200, SAMPLE_FAIL_BODY)
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                result = await service.submit_answers(
                    "TXN-001", [{"question_id": "Q1", "answer_id": "A2"}], "u-1"
                )

        assert result["result"] == "failed"
        assert result["verified"] is False

    @pytest.mark.anyio
    async def test_soft_lock_response_returns_soft_locked(self):
        service = _make_service()
        self._setup_existing(service)

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.return_value = _mock_response(200, SAMPLE_SOFT_LOCK_BODY)
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                result = await service.submit_answers(
                    "TXN-001", [{"question_id": "Q1", "answer_id": "A1"}], "u-1"
                )

        assert result["result"] == "soft_locked"
        assert result["verified"] is False
        assert result["locked_until"] is not None

    @pytest.mark.anyio
    async def test_hard_lock_response_returns_hard_locked(self):
        service = _make_service()
        self._setup_existing(service)

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post.return_value = _mock_response(200, SAMPLE_HARD_LOCK_BODY)
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                result = await service.submit_answers(
                    "TXN-001", [{"question_id": "Q1", "answer_id": "A1"}], "u-1"
                )

        assert result["result"] == "hard_locked"
        assert result["verified"] is False

    @pytest.mark.anyio
    async def test_already_passed_returns_cached_result(self):
        """If already terminal, should not call Experian again."""
        service = _make_service()
        self._setup_existing(service, result="passed")

        with _patch_settings():
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client_cls.return_value.__aenter__.return_value = mock_client

                result = await service.submit_answers(
                    "TXN-001", [{"question_id": "Q1", "answer_id": "A1"}], "u-1"
                )

        mock_client.post.assert_not_called()
        assert result["result"] == "passed"

    @pytest.mark.anyio
    async def test_empty_answers_raises_400(self):
        service = _make_service()

        with _patch_settings():
            with pytest.raises(HTTPException) as exc_info:
                await service.submit_answers("TXN-001", [], "u-1")

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_transaction_not_found_raises_404(self):
        service = _make_service()
        service.repository.get_by_transaction_for_user.return_value = None

        with _patch_settings():
            with pytest.raises(HTTPException) as exc_info:
                await service.submit_answers(
                    "TXN-999", [{"question_id": "Q1", "answer_id": "A1"}], "u-1"
                )

        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# get_status tests
# ---------------------------------------------------------------------------

class TestGetStatus:
    def test_not_started_returns_not_started(self):
        service = _make_service()
        service.repository.get_latest_for_application.return_value = None

        result = service.get_status("app-1", "u-1")

        assert result["result"] == "not_started"
        assert result["verified"] is False

    def test_returns_existing_record(self):
        service = _make_service()
        service.repository.get_latest_for_application.return_value = {
            "transaction_id": "TXN-001",
            "result": "passed",
            "score": 80.0,
            "threshold": 65.0,
            "locked_until": None,
        }

        result = service.get_status("app-1", "u-1")

        assert result["result"] == "passed"
        assert result["verified"] is True

    def test_application_not_found_raises_404(self):
        service = _make_service()
        service.repository.get_application_for_user.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.get_status("app-1", "u-1")

        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# _redact_provider_body tests (POPIA: no raw ID numbers in logs)
# ---------------------------------------------------------------------------

class TestRedactProviderBody:
    def test_id_number_redacted(self):
        body = {"IDNumber": "9001015009087", "TransactionID": "TXN-001"}
        safe = PvseService._redact_provider_body(body)
        assert safe["IDNumber"] == "[REDACTED]"
        assert safe["TransactionID"] == "TXN-001"

    def test_password_redacted(self):
        body = {"password": "secret", "username": "user", "Score": 75}
        safe = PvseService._redact_provider_body(body)
        assert safe["password"] == "[REDACTED]"
        assert safe["username"] == "[REDACTED]"
        assert safe["Score"] == 75

    def test_nested_redaction(self):
        body = {"Result": {"IDNumber": "9001015009087", "Score": 80}}
        safe = PvseService._redact_provider_body(body)
        assert safe["Result"]["IDNumber"] == "[REDACTED]"
        assert safe["Result"]["Score"] == 80

    def test_list_of_dicts_redacted(self):
        body = [{"idnumber": "1234567890123"}, {"Score": 90}]
        safe = PvseService._redact_provider_body(body)
        assert safe[0]["idnumber"] == "[REDACTED]"
        assert safe[1]["Score"] == 90

    def test_non_sensitive_keys_untouched(self):
        body = {"TransactionID": "TXN-1", "Questions": [], "Score": 70}
        safe = PvseService._redact_provider_body(body)
        assert safe == body
