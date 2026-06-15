"""
Experian PVS-E REST integration.

Only transaction/result metadata is persisted. Questions are returned to the
browser for the active transaction and answers are proxied to Experian, but
neither questions nor answers are stored.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import logging

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.core.validators import validate_sa_id_number, SAIDValidationError
from app.repositories.pvse_repository import pvse_repository
from app.services.consent_service import consent_service

logger = logging.getLogger(__name__)

SENSITIVE_PROVIDER_KEYS = {
    "password",
    "username",
    "idnumber",
    "id_number",
    "identitynumber",
    "identity_number",
    "nationalid",
    "national_id",
    "said",
    "sa_id",
}


class PvseService:
    SOFT_LOCK_HOURS = 12

    def __init__(self):
        self.repository = pvse_repository

    def _base_url(self) -> str:
        if settings.experian_environment.lower() == "production":
            return settings.experian_prod_base_url.rstrip("/")
        return settings.experian_uat_base_url.rstrip("/")

    def _require_config(self) -> None:
        missing = []
        if not settings.experian_username:
            missing.append("EXPERIAN_USERNAME")
        if not settings.experian_password:
            missing.append("EXPERIAN_PASSWORD")
        if not settings.experian_subscriber_code:
            missing.append("EXPERIAN_SUBSCRIBER_CODE")
        if missing:
            raise HTTPException(
                status_code=503,
                detail=f"Identity verification is not configured: {', '.join(missing)}",
            )

    _RETRY_ON_STATUS: Dict[int, float] = {
        504: 5.0,   # timeout → retry after 5 s
        503: 10.0,  # network/unavailable → retry after 10 s
    }

    async def _post_request_result(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Call Experian once; on retryable HTTP status, wait and try a second time."""
        return await self._post_request_result_attempt(payload, is_retry=False)

    async def _post_request_result_attempt(
        self, payload: Dict[str, Any], *, is_retry: bool
    ) -> Dict[str, Any]:
        self._require_config()
        url = f"{self._base_url()}/RequestResult"
        safe_payload_keys = sorted(payload.keys())
        logger.info("Calling Experian PVS-E RequestResult with fields: %s", safe_payload_keys)
        logger.debug("Experian PVS-E payload: %r", payload)

        try:
            async with httpx.AsyncClient(timeout=settings.experian_timeout_seconds) as client:
                username_val = settings.experian_username.upper() if settings.experian_username else ""
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Username": username_val,
                        "Password": settings.experian_password or "",
                    },
                )
        except httpx.TimeoutException as exc:
            logger.warning("Experian PVS-E request timed out (retry=%s)", is_retry)
            if not is_retry:
                await asyncio.sleep(self._RETRY_ON_STATUS[504])
                return await self._post_request_result_attempt(payload, is_retry=True)
            raise HTTPException(status_code=504, detail="Identity verification is taking longer than expected. Please try again.") from exc
        except httpx.RequestError as exc:
            logger.warning("Experian PVS-E network error: %s (retry=%s)", exc.__class__.__name__, is_retry)
            if not is_retry:
                await asyncio.sleep(self._RETRY_ON_STATUS[503])
                return await self._post_request_result_attempt(payload, is_retry=True)
            raise HTTPException(status_code=503, detail="Identity verification could not be reached. Please try again.") from exc

        try:
            body = response.json()
        except ValueError as exc:
            logger.error("Experian PVS-E returned a non-JSON response")
            raise HTTPException(status_code=502, detail="Identity verification is temporarily unavailable. Please try again later.") from exc

        if response.status_code == 401:
            logger.warning("Experian PVS-E authentication failed with status 401")
            raise HTTPException(status_code=503, detail="Identity verification is temporarily unavailable. Please try again later.")
        if 400 <= response.status_code < 500:
            logger.warning(
                "Experian PVS-E validation failed with status %s and response %s",
                response.status_code,
                self._redact_provider_body(body),
            )
            raise HTTPException(status_code=400, detail="We could not start identity verification. Please check your details and try again.")
        if response.status_code >= 500:
            logger.warning(
                "Experian PVS-E unavailable with status %s and response %s",
                response.status_code,
                self._redact_provider_body(body),
            )
            if not is_retry:
                await asyncio.sleep(self._RETRY_ON_STATUS[503])
                return await self._post_request_result_attempt(payload, is_retry=True)
            raise HTTPException(status_code=503, detail="Identity verification is temporarily unavailable. Please try again later.")

        return body

    @classmethod
    def _redact_provider_body(cls, value: Any) -> Any:
        if isinstance(value, list):
            return [cls._redact_provider_body(item) for item in value]
        if not isinstance(value, dict):
            return value

        safe: Dict[str, Any] = {}
        for key, entry_value in value.items():
            if key.lower() in SENSITIVE_PROVIDER_KEYS:
                safe[key] = "[REDACTED]"
            else:
                safe[key] = cls._redact_provider_body(entry_value)
        return safe

    @staticmethod
    def _transaction_id(body: Dict[str, Any]) -> Optional[str]:
        return (
            body.get("TransactionID")
            or body.get("TransactionId")
            or body.get("transactionId")
            or body.get("transactionID")
        )

    @staticmethod
    def _score(body: Dict[str, Any]) -> Optional[float]:
        value = None
        for key in ("Score", "score", "AccuracyScore", "Accuracy"):
            if key in body and body.get(key) is not None:
                value = body.get(key)
                break
        if value is None:
            value = (body.get("Result") or {}).get("AccuracyScore")
        try:
            return float(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _provider_status(body: Dict[str, Any]) -> Optional[str]:
        value = body.get("ResultStatus") or body.get("Status") or body.get("status") or body.get("LockStatus")
        return str(value) if value is not None else None

    @classmethod
    def _result_from_response(cls, body: Dict[str, Any], score: Optional[float]) -> Dict[str, Any]:
        status = (cls._provider_status(body) or "").lower()
        if "hard" in status:
            return {"result": "hard_locked", "locked_until": None}
        if "soft" in status:
            return {
                "result": "soft_locked",
                "locked_until": (datetime.now(timezone.utc) + timedelta(hours=cls.SOFT_LOCK_HOURS)).isoformat(),
            }
        if score is None:
            return {"result": "provider_contract_error", "locked_until": None}
        if score >= float(settings.experian_accuracy_threshold):
            return {"result": "passed", "locked_until": None}
        return {"result": "failed", "locked_until": None}

    @staticmethod
    def _questions(body: Dict[str, Any]) -> List[Dict[str, Any]]:
        raw_questions = body.get("Questions") or body.get("questions") or []
        questions = []
        for item in raw_questions:
            question_id = item.get("QuestionID") or item.get("QuestionId") or item.get("questionId")
            question_text = item.get("QuestionText") or item.get("Text") or item.get("questionText")
            raw_answers = item.get("Answers") or item.get("Options") or item.get("answers") or []
            answers = [
                {
                    "answer_id": answer.get("AnswerID") or answer.get("AnswerId") or answer.get("answerId"),
                    "answer_text": answer.get("AnswerText") or answer.get("Text") or answer.get("answerText"),
                }
                for answer in raw_answers
            ]
            questions.append({
                "question_id": question_id,
                "question_text": question_text,
                "answers": answers,
            })
        return questions

    def _get_fee_payer(self, application_id: str, user_id: str) -> Dict[str, Any]:
        application = self.repository.get_application_for_user(application_id, user_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        fee = self.repository.get_fee_responsibility(application_id)
        if not fee:
            raise HTTPException(
                status_code=400,
                detail="Please complete the parent ID number, first name, and surname before verification.",
            )

        parent_id_number = (fee.get("parent_id_number") or "").strip()
        parent_first_name = (fee.get("parent_first_name") or "").strip()
        parent_surname = (fee.get("parent_surname") or "").strip()

        if not parent_id_number or not parent_first_name or not parent_surname:
            raise HTTPException(
                status_code=400,
                detail="Please complete the parent ID number, first name, and surname before verification.",
            )

        try:
            validate_sa_id_number(parent_id_number)
        except SAIDValidationError as exc:
            raise HTTPException(status_code=400, detail="Please enter a valid South African ID number before verification.") from exc

        return {
            "id_number": parent_id_number,
            "first_name": parent_first_name,
            "surname": parent_surname,
        }

    async def start_verification(self, application_id: str, user_id: str) -> Dict[str, Any]:
        application = self.repository.get_application_for_user(application_id, user_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        consent_service.assert_consent_recorded(application_id, user_id, application.get("school_name"))

        parent = self._get_fee_payer(application_id, user_id)
        payload = {
            "Username": settings.experian_username.upper() if settings.experian_username else "",
            "Password": settings.experian_password,
            "SubscriberCode": settings.experian_subscriber_code,
            "ClientConsent": True,
            "IDNumber": parent["id_number"],
            "FirstName": parent["first_name"],
            "Surname": parent["surname"],
        }

        body = await self._post_request_result(payload)
        transaction_id = self._transaction_id(body)
        if not transaction_id:
            raise HTTPException(status_code=502, detail="Identity verification is temporarily unavailable. Please try again later.")

        self.repository.create_transaction(
            application_id=application_id,
            user_id=user_id,
            transaction_id=transaction_id,
            threshold=float(settings.experian_accuracy_threshold),
            provider_status=self._provider_status(body),
        )
        logger.info("Stored Experian PVS-E transaction %s for application %s", transaction_id, application_id)

        return {
            "transaction_id": transaction_id,
            "result": "questions_generated",
            "questions": self._questions(body),
            "message": "Please answer these identity verification questions to continue.",
        }

    async def submit_answers(self, transaction_id: str, answers: List[Dict[str, str]], user_id: str) -> Dict[str, Any]:
        if not answers:
            raise HTTPException(status_code=400, detail="Please answer all identity verification questions before submitting.")

        existing = self.repository.get_by_transaction_for_user(transaction_id, user_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Your verification session could not be found. Please restart identity verification.")

        if existing.get("result") in {"passed", "failed", "soft_locked", "hard_locked"}:
            return self._status_response(existing)

        payload = {
            "Username": settings.experian_username.upper() if settings.experian_username else "",
            "Password": settings.experian_password,
            "TransactionID": transaction_id,
            "ClientConsent": True,
            "Answers": [
                {"QuestionID": item["question_id"], "AnswerID": item["answer_id"]}
                for item in answers
            ],
        }

        body = await self._post_request_result(payload)
        response_transaction_id = self._transaction_id(body) or transaction_id
        score = self._score(body)
        decision = self._result_from_response(body, score)

        updated = self.repository.update_transaction(
            transaction_id=response_transaction_id,
            user_id=user_id,
            update_data={
                "result": decision["result"],
                "score": score,
                "locked_until": decision["locked_until"],
                "provider_status": self._provider_status(body),
                "error_code": None if decision["result"] in {"passed", "failed"} else decision["result"],
            },
        )
        logger.info("Updated Experian PVS-E transaction %s with result %s", response_transaction_id, decision["result"])
        return self._status_response(updated)

    def get_status(self, application_id: str, user_id: str) -> Dict[str, Any]:
        application = self.repository.get_application_for_user(application_id, user_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        latest = self.repository.get_latest_for_application(application_id, user_id)
        if not latest:
            return {
                "result": "not_started",
                "verified": False,
                "message": "Please complete identity verification to continue.",
            }
        return self._status_response(latest)

    def admin_unblock_parent(self, parent_id: str, admin_user_id: str, reason: str) -> Dict[str, Any]:
        """Hard-unlock a parent that has been blocked (hard_locked). Requires admin permission."""
        unblocked = self.repository.admin_unblock(parent_id, admin_user_id, reason)
        if not unblocked:
            raise HTTPException(status_code=404, detail="No hard-locked verification found for this parent.")
        logger.info(
            "Admin %s unblocked parent %s — reason: %s",
            admin_user_id,
            parent_id,
            reason,
        )
        return {"unblocked": True, "parent_id": parent_id, "message": "Parent identity verification has been unblocked."}

    @staticmethod
    def _message_for_result(result: str) -> str:
        return {
            "questions_generated": "Please answer these identity verification questions to continue.",
            "passed": "Identity verification successful. You can continue with your application.",
            "failed": "We could not verify your identity from the answers provided. Please check your details or contact support.",
            "soft_locked": "Identity verification is temporarily locked due to too many failed attempts. Please try again after 12 hours.",
            "hard_locked": "Identity verification is locked. Please contact support so we can assist you.",
            "timeout": "Identity verification is taking longer than expected. Please try again.",
            "provider_validation_error": "We could not start identity verification. Please check your details and try again.",
            "provider_auth_error": "Identity verification is temporarily unavailable. Please try again later.",
            "provider_unavailable": "Identity verification is temporarily unavailable. Please try again later.",
            "network_error": "Identity verification could not be reached. Please try again.",
            "provider_contract_error": "Identity verification is temporarily unavailable. Please try again later.",
            "abandoned": "Your verification session could not be found. Please restart identity verification.",
        }.get(result, "Please complete identity verification to continue.")

    @classmethod
    def _status_response(cls, row: Dict[str, Any]) -> Dict[str, Any]:
        result = row.get("result") or "not_started"
        return {
            "transaction_id": row.get("transaction_id"),
            "result": result,
            "score": row.get("score"),
            "threshold": row.get("threshold"),
            "locked_until": row.get("locked_until"),
            "verified": result == "passed",
            "message": cls._message_for_result(result),
        }


pvse_service = PvseService()
