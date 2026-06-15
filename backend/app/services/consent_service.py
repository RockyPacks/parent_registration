"""
POPIA consent service for school-specific screening gates.
"""

import re
from typing import Any, Dict, Optional

from fastapi import HTTPException

from app.repositories.consent_repository import consent_repository
from app.repositories.pvse_repository import pvse_repository


ST_ANDREWS_KEY = "ST_ANDREWS"
ST_ANDREWS_NAME_PATTERN = re.compile(r"\b(st\.?\s+andrew'?s|saint\s+andrew'?s)\b", re.IGNORECASE)


class ConsentService:
    def __init__(self):
        self.repository = consent_repository

    @staticmethod
    def school_key_for_name(school_name: Optional[str]) -> str:
        if ST_ANDREWS_NAME_PATTERN.search(school_name or ""):
            return ST_ANDREWS_KEY
        return "DEFAULT"

    def get_config(self, application_id: str, user_id: str) -> Dict[str, Any]:
        application = self.repository.get_application_for_user(application_id, user_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        school_name = application.get("school_name")
        school_key = self.school_key_for_name(school_name)
        disclosure = self.repository.get_active_disclosure(school_key)
        consent = self.repository.get_latest_consent(application_id, user_id) if disclosure else None
        screening_enabled = bool(disclosure)
        kba_enabled = bool(disclosure and disclosure.get("kba_enabled"))

        return {
            "school_key": school_key,
            "school_name": school_name,
            "screening_enabled": screening_enabled,
            "kba_enabled": kba_enabled,
            "disclosure": disclosure,
            "consent": consent,
        }

    def record_consent(
        self,
        application_id: str,
        user_id: str,
        disclosure_version: str,
        accepted: bool,
    ) -> Dict[str, Any]:
        if not accepted:
            raise HTTPException(status_code=400, detail="You must opt in before consent can be recorded.")

        config = self.get_config(application_id, user_id)
        if not config["screening_enabled"]:
            raise HTTPException(status_code=400, detail="Screening consent is not enabled for this application.")

        disclosure = config.get("disclosure")
        if not disclosure:
            raise HTTPException(status_code=503, detail="Screening consent disclosure is not configured.")
        if disclosure.get("version") != disclosure_version:
            raise HTTPException(status_code=409, detail="Consent disclosure has changed. Please review the latest version.")

        consent = self.repository.record_consent(
            application_id=application_id,
            user_id=user_id,
            school_key=config["school_key"],
            disclosure=disclosure,
        )
        return {
            "consent_token": consent["consent_token"],
            "consented_at": consent["consented_at"],
            "disclosure_version": consent["disclosure_version"],
        }

    def assert_consent_recorded(self, application_id: str, user_id: str, school_name: Optional[str]) -> None:
        school_key = self.school_key_for_name(school_name)
        disclosure = self.repository.get_active_disclosure(school_key)
        if not disclosure:
            return

        consent = self.repository.get_latest_consent(application_id, user_id)
        if not consent:
            raise HTTPException(status_code=400, detail="Please complete POPIA screening consent before continuing.")

    def assert_submission_allowed(self, application_id: str, user_id: str, school_name: Optional[str]) -> None:
        school_key = self.school_key_for_name(school_name)
        disclosure = self.repository.get_active_disclosure(school_key)
        if not disclosure:
            return

        consent = self.repository.get_latest_consent(application_id, user_id)
        if not consent:
            raise HTTPException(status_code=400, detail="Please complete POPIA screening consent before submitting.")

        if disclosure.get("kba_enabled"):
            latest = pvse_repository.get_latest_for_application(application_id, user_id)
            if not latest or latest.get("result") != "passed":
                raise HTTPException(status_code=400, detail="Please complete identity verification before submitting.")


consent_service = ConsentService()
