"""
Authenticated Experian PVS-E identity verification endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.services.pvse_service import pvse_service

router = APIRouter(prefix="/pvse", tags=["pvse"])


class StartVerificationRequest(BaseModel):
    application_id: str = Field(..., min_length=1)


class AnswerSelection(BaseModel):
    question_id: str = Field(..., min_length=1)
    answer_id: str = Field(..., min_length=1)


class SubmitAnswersRequest(BaseModel):
    transaction_id: str = Field(..., min_length=1)
    answers: List[AnswerSelection] = Field(..., min_length=1)


@router.post("/start")
async def start_identity_verification(
    request: StartVerificationRequest,
    current_user: dict = Depends(get_current_user),
):
    return await pvse_service.start_verification(request.application_id, current_user.get("id"))


@router.post("/submit")
async def submit_identity_answers(
    request: SubmitAnswersRequest,
    current_user: dict = Depends(get_current_user),
):
    return await pvse_service.submit_answers(
        request.transaction_id,
        [item.model_dump() for item in request.answers],
        current_user.get("id"),
    )


@router.get("/status/{application_id}")
async def get_identity_verification_status(
    application_id: str,
    current_user: dict = Depends(get_current_user),
):
    return pvse_service.get_status(application_id, current_user.get("id"))
