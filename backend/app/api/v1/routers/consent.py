"""
Authenticated POPIA consent endpoints.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.services.consent_service import consent_service

router = APIRouter(prefix="/consent", tags=["consent"])


class RecordConsentRequest(BaseModel):
    application_id: str = Field(..., min_length=1)
    disclosure_version: str = Field(..., min_length=1)
    accepted: bool


@router.get("/config/{application_id}")
async def get_consent_config(
    application_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    return consent_service.get_config(application_id, current_user.get("id"))


@router.post("/record")
async def record_consent(
    request: RecordConsentRequest,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    return consent_service.record_consent(
        request.application_id,
        current_user.get("id"),
        request.disclosure_version,
        request.accepted,
    )
