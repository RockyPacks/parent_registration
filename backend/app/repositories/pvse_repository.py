"""
Repository for Experian PVS-E identity verification transaction metadata.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import logging

from app.db.supabase_client import supabase_service
from app.core.exceptions import ExternalServiceError
from postgrest.exceptions import APIError

logger = logging.getLogger(__name__)


class PvseRepository:
    def __init__(self):
        self.supabase = supabase_service
        self.table_name = "pvse_identity_verifications"

    def _check_supabase(self) -> None:
        if not self.supabase:
            raise ExternalServiceError("Database", "Database not configured")

    def get_application_for_user(self, application_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        self._check_supabase()
        result = (
            self.supabase.table("applications")
            .select("id,user_id,status,school_name")
            .eq("id", application_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_fee_responsibility(self, application_id: str) -> Optional[Dict[str, Any]]:
        self._check_supabase()
        result = (
            self.supabase.table("fee_responsibility")
            .select("*")
            .eq("application_id", application_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def create_transaction(
        self,
        application_id: str,
        user_id: str,
        transaction_id: str,
        threshold: float,
        provider_status: Optional[str] = None,
        parent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        self._check_supabase()
        data = {
            "application_id": application_id,
            "parent_id": parent_id,
            "user_id": user_id,
            "transaction_id": transaction_id,
            "result": "questions_generated",
            "threshold": threshold,
            "provider_status": provider_status,
        }
        try:
            result = self.supabase.table(self.table_name).insert(data).execute()
        except APIError as exc:
            if _is_missing_table_error(exc):
                raise ExternalServiceError(
                    "Database",
                    f"Missing table '{self.table_name}'. Run migration 014_create_pvse_identity_verifications.sql.",
                ) from exc
            raise
        return result.data[0] if result.data else data

    def get_by_transaction_for_user(self, transaction_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        self._check_supabase()
        result = (
            self.supabase.table(self.table_name)
            .select("*")
            .eq("transaction_id", transaction_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_latest_for_application(self, application_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        self._check_supabase()
        try:
            result = (
                self.supabase.table(self.table_name)
                .select("*")
                .eq("application_id", application_id)
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
        except APIError as exc:
            if _is_missing_table_error(exc):
                logger.warning("%s table is missing; returning no PVS-E status", self.table_name)
                return None
            raise
        return result.data[0] if result.data else None

    def update_transaction(
        self,
        transaction_id: str,
        user_id: str,
        update_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        self._check_supabase()
        update_data = {
            **update_data,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        result = (
            self.supabase.table(self.table_name)
            .update(update_data)
            .eq("transaction_id", transaction_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else update_data

    def admin_unblock(self, parent_id: str, admin_user_id: str, reason: str) -> Optional[Dict[str, Any]]:
        """Clear hard_locked result for all transactions tied to the given parent_id."""
        self._check_supabase()
        # Find all hard-locked rows for this parent
        rows = (
            self.supabase.table(self.table_name)
            .select("id,transaction_id,user_id")
            .eq("parent_id", parent_id)
            .eq("result", "hard_locked")
            .execute()
        )
        if not rows.data:
            return None
        now = datetime.now(timezone.utc).isoformat()
        updated = (
            self.supabase.table(self.table_name)
            .update({"result": "failed", "locked_until": None, "updated_at": now})
            .eq("parent_id", parent_id)
            .eq("result", "hard_locked")
            .execute()
        )
        self.create_audit_event(
            parent_id=parent_id,
            event_type="admin_unblock",
            performed_by=admin_user_id,
            note=reason,
        )
        return updated.data[0] if updated.data else rows.data[0]

    def create_audit_event(
        self,
        parent_id: str,
        event_type: str,
        performed_by: str,
        note: Optional[str] = None,
    ) -> Dict[str, Any]:
        self._check_supabase()
        data = {
            "parent_id": parent_id,
            "event_type": event_type,
            "performed_by": performed_by,
            "note": note,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            result = self.supabase.table("pvse_audit_events").insert(data).execute()
        except APIError:
            # Audit table may not exist yet — log and continue; don't fail the main flow
            logger.warning("pvse_audit_events table not found; audit event not recorded")
            return data
        return result.data[0] if result.data else data

    def list_hard_locked(self) -> List[Dict[str, Any]]:
        """Return all currently hard-locked parent verifications (admin use)."""
        self._check_supabase()
        result = (
            self.supabase.table(self.table_name)
            .select("parent_id,user_id,transaction_id,created_at,updated_at")
            .eq("result", "hard_locked")
            .order("updated_at", desc=True)
            .execute()
        )
        return result.data or []


pvse_repository = PvseRepository()


def _is_missing_table_error(exc: APIError) -> bool:
    error = getattr(exc, "args", [{}])[0]
    return isinstance(error, dict) and error.get("code") == "PGRST205"
