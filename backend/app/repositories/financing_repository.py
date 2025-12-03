"""
Repository for financing-related database operations.
"""

from typing import Dict, Any, Optional
import logging
from app.repositories.base import BaseRepository
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


def get_next_of_kin_data(supabase_client, application_id: str) -> Optional[Dict[str, Any]]:
    """
    Helper function to retrieve next of kin data from the next_of_kin table.
    
    Args:
        supabase_client: Supabase client instance
        application_id: Application ID
        
    Returns:
        Next of kin data or None if not found
    """
    try:
        result = supabase_client.table("next_of_kin").select("*").eq("application_id", application_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.warning(f"Failed to get next of kin data for application {application_id}: {str(e)}")
        return None


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
        
        Also syncs next_of_kin data from the next_of_kin table to the
        financing_selections table for data consistency.

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

            # Sync next_of_kin data from the next_of_kin table
            nok_data = get_next_of_kin_data(self.supabase, application_id)
            if nok_data:
                data["next_of_kin_surname"] = nok_data.get("surname")
                data["next_of_kin_first_name"] = nok_data.get("first_name")
                data["next_of_kin_relationship"] = nok_data.get("relationship")
                data["next_of_kin_mobile"] = nok_data.get("mobile_number")
                data["next_of_kin_email"] = nok_data.get("email_address")
                logger.info(f"Synced next_of_kin data to financing_selections for application {application_id}")

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
                'arrears-bnpl': 'Buy Now, Pay Later',
                'eft': 'Pay via EFT'
            }

            selected_plan = plan_name_mapping.get(plan_type, plan_type)

            # Sanitize the plan name to ensure proper casing and format
            if selected_plan:
                selected_plan = selected_plan.strip()

            # Update the selected_plan in fee_responsibility table (only update, don't insert)
            result = self.supabase.table("fee_responsibility").update({
                "selected_plan": selected_plan
            }).eq("application_id", application_id).execute()

            if not result.data:
                logger.warning(f"No fee_responsibility record found for application {application_id}")
            else:
                logger.info(f"Updated selected_plan to '{selected_plan}' for application {application_id}")
        except Exception as e:
            logger.error(f"Failed to update selected_plan for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to update selected plan")

    def get_financing_selection_from_fee_responsibility(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get financing selection from fee_responsibility table.

        Args:
            application_id: Application ID

        Returns:
            Dictionary with application_id and plan_type (or selected_plan) or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table("fee_responsibility").select("selected_plan").eq("application_id", application_id).execute()
            if result.data and len(result.data) > 0:
                selected_plan = result.data[0].get("selected_plan")
                return {
                    "application_id": application_id,
                    "plan_type": selected_plan if selected_plan else "Not selected"
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get financing selection for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve financing selection")


    def sync_next_of_kin_to_financing(self, application_id: str) -> None:
        """
        Sync next of kin data from next_of_kin table to financing_selections table.
        
        This method is called when next_of_kin data is updated to ensure
        the financing_selections table stays in sync.

        Args:
            application_id: Application ID

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            # Get next of kin data
            nok_data = get_next_of_kin_data(self.supabase, application_id)
            if not nok_data:
                logger.info(f"No next_of_kin data found for application {application_id}, skipping sync")
                return

            update_data = {
                "next_of_kin_surname": nok_data.get("surname"),
                "next_of_kin_first_name": nok_data.get("first_name"),
                "next_of_kin_relationship": nok_data.get("relationship"),
                "next_of_kin_mobile": nok_data.get("mobile_number"),
                "next_of_kin_email": nok_data.get("email_address")
            }

            # Only update if financing_selections record exists
            existing = self.supabase.table(self.table_name).select("id").eq("application_id", application_id).execute()
            if existing.data and len(existing.data) > 0:
                self.supabase.table(self.table_name).update(update_data).eq("application_id", application_id).execute()
                logger.info(f"Synced next_of_kin data to financing_selections for application {application_id}")
            else:
                logger.info(f"No financing_selections record exists for application {application_id}, skipping sync")

        except Exception as e:
            logger.error(f"Failed to sync next_of_kin to financing_selections for application {application_id}: {str(e)}")
            # Don't raise - this is a secondary sync operation


# Global instance
financing_repository = FinancingRepository()
