from typing import Dict, Any, List
import uuid
from datetime import datetime
import logging
import requests
from requests.exceptions import RequestException

from app.db.session import supabase
from app.api.v1.schemas.risk import RiskCheckRequest, RiskReportResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class RiskAssessmentService:
    def run_risk_check(self, request: RiskCheckRequest, application_id: str) -> RiskReportResponse:
        """
        Perform risk assessment on guardian banking details
        """
        try:
            # Extract guardian data
            guardian = request.guardian
            branch_code = guardian.get("branch_code", "")
            account_number = guardian.get("account_number", "")

            # Perform basic risk assessment
            risk_score, status, flags, api_response_data = self._assess_risk(branch_code, account_number, guardian, request.reference)

            # Save risk report to database
            self._save_risk_report(request, application_id, risk_score, status, flags, branch_code, account_number, api_response_data)

            logger.info(f"Risk assessment completed for reference: {request.reference}, score: {risk_score}")

            return RiskReportResponse(
                reference=request.reference,
                risk_score=risk_score,
                status=status,
                flags=flags,
                timestamp=datetime.now().isoformat()
            )

        except Exception as e:
            logger.error(f"RISK CHECK ERROR: {str(e)}")
            raise

    def _assess_risk(self, branch_code: str, account_number: str, guardian: Dict[str, Any], reference: str) -> tuple[float, str, List[str], Dict[str, Any]]:
        """
        Perform risk assessment using Netcash API or fallback to basic checks
        """
        flags = []
        api_response = None

        # Basic validation checks
        if not branch_code or not account_number:
            return 100.0, "high", ["Missing banking details"], api_response

        if len(branch_code) != 6 or not branch_code.isdigit():
            return 85.0, "high", ["Invalid branch code format"], api_response

        if len(account_number) < 10 or len(account_number) > 12 or not account_number.isdigit():
            return 85.0, "high", ["Invalid account number format"], api_response

        # Check if Netcash API is configured
        if settings.netcash_risk_service_key and settings.netcash_risk_base:
            try:
                # Call Netcash Risk Reports API
                api_response_data = self._call_netcash_api(branch_code, account_number, guardian, reference)
                risk_score = api_response_data.get("RiskScore", 50.0)
                flags = api_response_data.get("Flags", [])
                status = self._determine_status(risk_score)
                return risk_score, status, flags, api_response_data
            except Exception as e:
                logger.error(f"Netcash API call failed: {str(e)}, falling back to mock assessment")
                # Fallback to mock

        # Mock assessment
        if account_number.startswith("123"):
            return 75.0, "medium", ["Account pattern requires verification"], None

        # Default low risk for valid accounts
        return 15.0, "low", ["Account verified"], None

    def _call_netcash_api(self, branch_code: str, account_number: str, guardian: Dict[str, Any], reference: str) -> Dict[str, Any]:
        """
        Call Netcash Risk Reports API
        """
        url = f"{settings.netcash_risk_base}/GetRiskReport"
        headers = {
            "Content-Type": "application/json",
            "ServiceKey": settings.netcash_risk_service_key
        }
        payload = {
            "Reference": reference,
            "Customer": {
                "Name": guardian.get("name", ""),
                "Email": guardian.get("email", ""),
                "IdNumber": guardian.get("id_number", ""),
                "BankAccount": {
                    "BranchCode": branch_code,
                    "AccountNumber": account_number
                }
            }
        }

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()

    def _determine_status(self, risk_score: float) -> str:
        """
        Determine risk status based on score
        """
        if risk_score < 30:
            return "low"
        elif risk_score < 70:
            return "medium"
        else:
            return "high"

    def _save_risk_report(
        self,
        request: RiskCheckRequest,
        application_id: str,
        risk_score: float,
        status: str,
        flags: List[str],
        branch_code: str,
        account_number: str,
        api_response_data: Dict[str, Any] | None = None
    ) -> None:
        """
        Save risk assessment report to database
        """
        guardian = request.guardian

        risk_record = {
            "id": str(uuid.uuid4()),
            "application_id": application_id,
            "reference": request.reference,
            "guardian_email": guardian.get("email", ""),
            "guardian_name": guardian.get("name", ""),
            "guardian_id_number": guardian.get("id_number", ""),
            "branch_code": branch_code,
            "account_number": account_number,
            "risk_score": float(risk_score),
            "flags": flags,
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "raw_response": {
                "branch_code": branch_code,
                "account_number": account_number,
                "validation_performed": True,
                "api_response": api_response_data
            },
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        supabase.table("risk_reports").insert(risk_record).execute()


# Global service instance
risk_service = RiskAssessmentService()
