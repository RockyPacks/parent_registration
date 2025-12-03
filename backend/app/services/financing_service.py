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
        """Save financing selection for an application - updates selected_plan in fee_responsibility table"""
        try:
            # Sanitize and validate application_id
            if not application_id or not isinstance(application_id, str):
                raise ValueError("Invalid application_id: must be a non-empty string")

            application_id = application_id.strip()

            # Validate plan_type against allowed values
            allowed_plans = [
                'monthly_flat', 'termly_discount', 'annual_discount',
                'sibling_discount', 'bnpl', 'forward_funding', 'arrears-bnpl', 'eft'
            ]

            if not plan_type or not isinstance(plan_type, str):
                raise ValueError("Invalid plan_type: must be a non-empty string")

            plan_type = plan_type.strip()

            if plan_type not in allowed_plans:
                raise ValueError(f"Invalid plan type: {plan_type}. Allowed values: {', '.join(allowed_plans)}")

            # Only update selected_plan in fee_responsibility table (no separate financing_selections table)
            self.repository.update_fee_responsibility_selected_plan(application_id, plan_type)

            logger.info(f"Updated selected_plan to {plan_type} for application {application_id}")
            
            # Return a dict that matches FinancingSelectionResponse schema
            return {
                "application_id": application_id,
                "plan_type": self._get_plan_display_name(plan_type)
            }
        except Exception as e:
            logger.error(f"Failed to save financing selection for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to save financing selection: {str(e)}")

    def _get_plan_display_name(self, plan_type: str) -> str:
        """Convert plan_type code to display name"""
        plan_name_mapping = {
            'monthly_flat': 'Pay Monthly Debit',
            'termly_discount': 'Pay Per Term',
            'annual_discount': 'Pay Once Per Year',
            'sibling_discount': 'Sibling Benefit',
            'bnpl': 'Buy Now, Pay Later',
            'forward_funding': 'Forward Funding',
            'arrears-bnpl': 'Buy Now, Pay Later',
            'eft': 'Pay via EFT'
        }
        return plan_name_mapping.get(plan_type, plan_type)

    def get_financing_selection(self, application_id: str) -> Optional[Dict[str, Any]]:
        """Get financing selection for an application - reads selected_plan from fee_responsibility"""
        try:
            return self.repository.get_financing_selection_from_fee_responsibility(application_id)
        except Exception as e:
            logger.error(f"Failed to get financing selection for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to retrieve financing selection: {str(e)}")


# Global instance
financing_service = FinancingService()
