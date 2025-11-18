#!/usr/bin/env python3
"""
Script to update fee_responsibility table with selected_plan data from financing_selections.

This script should be run after the financing selection is saved to populate
the selected_plan column in the fee_responsibility table.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.supabase_client import supabase
from app.core.exceptions import ExternalServiceError


def update_fee_responsibility_selected_plan():
    """Update fee_responsibility table with selected_plan from financing_selections"""

    try:
        # Get all financing selections
        financing_result = supabase.table("financing_selections").select("application_id, plan_type").execute()

        if not financing_result.data:
            print("No financing selections found.")
            return

        # Map plan_type to user-friendly plan names
        plan_name_mapping = {
            'monthly_flat': 'Pay Monthly',
            'termly_discount': 'Pay Per Term',
            'annual_discount': 'Pay Once Per Year',
            'sibling_discount': 'Sibling Benefit',
            'bnpl': 'Buy Now, Pay Later',
            'forward_funding': 'Forward Funding',
            'arrears-bnpl': 'Buy Now, Pay Later'
        }

        updated_count = 0

        for selection in financing_result.data:
            application_id = selection['application_id']
            plan_type = selection['plan_type']
            selected_plan = plan_name_mapping.get(plan_type, plan_type)

            # Update or insert into fee_responsibility table
            supabase.table("fee_responsibility").upsert({
                "application_id": application_id,
                "selected_plan": selected_plan
            }).execute()

            updated_count += 1
            print(f"Updated application {application_id} with plan: {selected_plan}")

        print(f"Successfully updated {updated_count} applications with selected plans.")

    except Exception as e:
        print(f"Error updating fee_responsibility table: {str(e)}")
        raise ExternalServiceError("Database", f"Failed to update fee_responsibility: {str(e)}")


if __name__ == "__main__":
    update_fee_responsibility_selected_plan()
