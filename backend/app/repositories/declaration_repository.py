"""
Repository for declaration-related database operations.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging
from app.repositories.base import BaseRepository
from app.core.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)


class DeclarationRepository(BaseRepository):
    """
    Repository for declaration-related database operations.

    Handles declaration creation, updates, and retrieval with proper
    ownership verification and data consistency.
    """

    def __init__(self):
        super().__init__("declarations")

    def save_declaration(self, application_id: str, declaration_data: Dict[str, Any]) -> None:
        """
        Save declaration information.

        Args:
            application_id: Application ID
            declaration_data: Declaration information to save

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            data = declaration_data.copy()
            data["application_id"] = application_id
            
            # Set date_signed to today if not provided
            if "date_signed" not in data or not data["date_signed"]:
                data["date_signed"] = datetime.now().date().isoformat()

            # Convert camelCase field names to snake_case for database
            if "fullName" in data:
                data["full_name"] = data.pop("fullName")
            if "signatureImage" in data:
                data["signature_image"] = data.pop("signatureImage")
            
            # Allowed fields in declarations table
            allowed_fields = {
                'application_id', 'agree_truth', 'agree_policies', 'agree_financial',
                'agree_verification', 'agree_data_processing', 'agree_audit_storage',
                'agree_affordability_processing', 'full_name', 'city', 'signature_image',
                'date_signed', 'status', 'signed', 'created_at', 'updated_at'
            }

            # Filter data to only include fields that exist in the table
            filtered_data = {k: v for k, v in data.items() if k in allowed_fields}

            # First, check if a declaration already exists for this application
            existing = self.supabase.table(self.table_name).select("id").eq("application_id", application_id).execute()
            
            if existing.data:
                # Update existing declaration
                self.supabase.table(self.table_name).update(filtered_data).eq("application_id", application_id).execute()
            else:
                # Create new declaration
                try:
                    self.supabase.table(self.table_name).insert(filtered_data).execute()
                except Exception as e:
                    if "unique" in str(e).lower() or "duplicate" in str(e).lower():
                        self.supabase.table(self.table_name).update(filtered_data).eq("application_id", application_id).execute()
                    else:
                        raise
        except Exception as e:
            logger.error(f"Failed to save declaration for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to save declaration information")

    def get_declaration(self, application_id: str) -> Optional[Dict[str, Any]]:
        """
        Get declaration by application ID.

        Args:
            application_id: Application ID to retrieve declaration for

        Returns:
            Declaration data or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        try:
            result = self.supabase.table(self.table_name).select("*").eq("application_id", application_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get declaration for application {application_id}: {str(e)}")
            raise ExternalServiceError("Database", "Failed to retrieve declaration")


# Global instance
declaration_repository = DeclarationRepository()
