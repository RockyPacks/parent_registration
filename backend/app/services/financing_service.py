"""
Service for financing-related business logic.
"""

from typing import Dict, Any, Optional
import logging
from app.repositories.financing_repository import financing_repository
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class FinancingService:
    """Service for financing business logic"""

    def __init__(self):
        self.repository = financing_repository

    def save_financing_selection(self, application_id: str, plan_type: str, discount_rate: Optional[float] = None, cost_of_credit: Optional[float] = None, repayment_term: Optional[str] = None) -> str:
        """Save financing selection for an application"""
        try:
            # Sanitize and validate application_id
            if not application_id or not isinstance(application_id, str):
                raise ValueError("Invalid application_id: must be a non-empty string")

            application_id = application_id.strip()

            # Validate plan_type against allowed values
            allowed_plans = [
                'monthly_flat', 'termly_discount', 'annual_discount',
                'sibling_discount', 'bnpl', 'forward_funding', 'arrears-bnpl'
            ]

            if not plan_type or not isinstance(plan_type, str):
                raise ValueError("Invalid plan_type: must be a non-empty string")

            plan_type = plan_type.strip()

            if plan_type not in allowed_plans:
                raise ValueError(f"Invalid plan type: {plan_type}. Allowed values: {', '.join(allowed_plans)}")

            financing_id = self.repository.save_financing_selection(
                application_id=application_id,
                plan_type=plan_type,
                discount_rate=discount_rate,
                cost_of_credit=cost_of_credit,
                repayment_term=repayment_term
            )

            # Automatically update selected_plan in fee_responsibility table
            self.repository.update_fee_responsibility_selected_plan(application_id, plan_type)

            logger.info(f"Saved financing selection {financing_id} for application {application_id}")
            return financing_id
        except Exception as e:
            logger.error(f"Failed to save financing selection for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to save financing selection: {str(e)}")

    def get_financing_selection(self, application_id: str) -> Optional[Dict[str, Any]]:
        """Get financing selection for an application"""
        try:
            return self.repository.get_financing_selection(application_id)
        except Exception as e:
            logger.error(f"Failed to get financing selection for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to retrieve financing selection: {str(e)}")


# Global instance
financing_service = FinancingService()
