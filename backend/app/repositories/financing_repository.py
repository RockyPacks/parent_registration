"""
Repository for financing-related database operations.
"""

from typing import Dict, Any, Optional
import logging
from app.repositories.base import BaseRepository
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class FinancingRepository(BaseRepository):
    """
    Repository for financing-related database operations.

    Handles financing selections for applications.
    """

    def __init__(self):
        super().__init__("financing_selections")

    def save_financing_selection(self, application_id: str, plan_type: str, discount_rate: Optional[float] = None, cost_of_credit: Optional[float] = None, repayment_term: Optional[str] = None) -> str:
        """
        Save financing selection for an application.

        Args:
            application_id: Application ID
            plan_type: Type of financing plan selected
            discount_rate: Optional discount rate
            cost_of_credit: Optional cost of credit
            repayment_term: Optional repayment term

        Returns:
            Financing selection ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Sanitize inputs
            application_id = application_id.strip() if application_id else ""
            plan_type = plan_type.strip() if plan_type else ""

            data = {
                "application_id": application_id,
                "plan_type": plan_type
            }

            if discount_rate is not None and isinstance(discount_rate, (int, float)):
                data["discount_rate"] = float(discount_rate)
            if cost_of_credit is not None and isinstance(cost_of_credit, (int, float)):
                data["cost_of_credit"] = float(cost_of_credit)
            if repayment_term is not None and isinstance(repayment_term, str):
                data["repayment_term"] = repayment_term.strip()

            # Check if record exists
            existing = self.supabase.table(self.table_name).select("id").eq("application_id", application_id).execute()

            if existing.data and len(existing.data) > 0:
                # Update existing record
                result = self.supabase.table(self.table_name).update(data).eq("application_id", application_id).execute()
                return str(result.data[0]["id"])
            else:
                # Insert new record
                result = self.supabase.table(self.table_name).insert(data).execute()
                return str(result.data[0]["id"])
        except Exception as e:
            logger.error(f"Failed to save financing selection for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save financing selection")

    def get_financing_selection(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get financing selection for an application.

        Args:
            application_id: Application ID

        Returns:
            Financing selection data or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table(self.table_name).select("*").eq("application_id", application_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get financing selection for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve financing selection")

    def update_fee_responsibility_selected_plan(self, application_id: str, plan_type: str) -> None:
        """
        Update the selected_plan in fee_responsibility table when financing selection changes.

        Args:
            application_id: Application ID
            plan_type: The selected financing plan type

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Map plan_type to user-friendly plan names
            plan_name_mapping = {
                'monthly_flat': 'Pay Monthly Debit',
                'termly_discount': 'Pay Per Term',
                'annual_discount': 'Pay Once Per Year',
                'sibling_discount': 'Sibling Benefit',
                'bnpl': 'Buy Now, Pay Later',
                'forward_funding': 'Forward Funding',
                'arrears-bnpl': 'Buy Now, Pay Later'
            }

            selected_plan = plan_name_mapping.get(plan_type, plan_type)

            # Sanitize the plan name to ensure proper casing and format
            if selected_plan:
                selected_plan = selected_plan.strip()

            # Update the selected_plan in fee_responsibility table (only update, don't insert)
            self.supabase.table("fee_responsibility").update({
                "selected_plan": selected_plan
            }).eq("application_id", application_id).execute()

            logger.info(f"Updated selected_plan to '{selected_plan}' for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to update selected_plan for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to update selected plan")


# Global instance
financing_repository = FinancingRepository()
