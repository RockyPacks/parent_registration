from pydantic import BaseModel
from typing import Dict, Any, List


class RiskCheckRequest(BaseModel):
    reference: str
    guardian: Dict[str, Any]


class RiskReportResponse(BaseModel):
    reference: str
    risk_score: float
    status: str
    flags: List[str]
    timestamp: str


class RiskReportCreate(BaseModel):
    id: str
    application_id: str
    reference: str
    guardian_email: str
    guardian_name: str
    guardian_id_number: str
    branch_code: str
    account_number: str
    risk_score: float
    flags: List[str]
    status: str
    timestamp: str
    raw_response: Dict[str, Any]
    created_at: str
    updated_at: str
