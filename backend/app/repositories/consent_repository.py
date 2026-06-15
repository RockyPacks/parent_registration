"""
Repository for POPIA screening consent disclosure and consent records.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from postgrest.exceptions import APIError

from app.core.exceptions import ExternalServiceError
from app.db.supabase_client import supabase_service


class ConsentRepository:
    def __init__(self):
        self.supabase = supabase_service

    def _check_supabase(self) -> None:
        if not self.supabase:
            raise ExternalServiceError("Database", "Database not configured")

    def get_application_for_user(self, application_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        self._check_supabase()
        result = (
            self.supabase.table("applications")
            .select("id,user_id,school_name,status")
            .eq("id", application_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_active_disclosure(self, school_key: str, purpose: str = "screening") -> Optional[Dict[str, Any]]:
        self._check_supabase()
        try:
            result = (
                self.supabase.table("consent_disclosures")
                .select("*")
                .eq("school_key", school_key)
                .eq("purpose", purpose)
                .eq("active", True)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
        except APIError as exc:
            if _is_missing_table_error(exc):
                return None
            raise
        return result.data[0] if result.data else None

    def get_latest_consent(self, application_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        self._check_supabase()
        try:
            result = (
                self.supabase.table("application_consents")
                .select("*")
                .eq("application_id", application_id)
                .eq("user_id", user_id)
                .order("consented_at", desc=True)
                .limit(1)
                .execute()
            )
        except APIError as exc:
            if _is_missing_table_error(exc):
                return None
            raise
        return result.data[0] if result.data else None

    def record_consent(
        self,
        application_id: str,
        user_id: str,
        school_key: str,
        disclosure: Dict[str, Any],
    ) -> Dict[str, Any]:
        self._check_supabase()
        data = {
            "application_id": application_id,
            "user_id": user_id,
            "school_key": school_key,
            "purpose": disclosure.get("purpose", "screening"),
            "disclosure_id": disclosure.get("id"),
            "disclosure_version": disclosure["version"],
            "consent_token": str(uuid4()),
            "consented_at": datetime.now(timezone.utc).isoformat(),
        }
        result = self.supabase.table("application_consents").insert(data).execute()
        return result.data[0] if result.data else data


consent_repository = ConsentRepository()


def _is_missing_table_error(exc: APIError) -> bool:
    error = getattr(exc, "args", [{}])[0]
    return isinstance(error, dict) and error.get("code") == "PGRST205"
