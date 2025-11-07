from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.api.v1.schemas.risk import RiskCheckRequest, RiskReportResponse
from app.services.risk_service import risk_service
from app.core.security import get_current_user

router = APIRouter()


@router.post("/risk-check", response_model=RiskReportResponse)
async def run_risk_check(
    data: RiskCheckRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Perform risk assessment on guardian banking details
    """
    try:
        # Get application_id from current user context
        # This should be passed from the frontend or stored in user metadata
        application_id = current_user.get("application_id") or "unknown"

        result = risk_service.run_risk_check(data, application_id)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")
