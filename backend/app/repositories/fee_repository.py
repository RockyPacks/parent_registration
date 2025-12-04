"""
Fee Repository
Handles database operations for school fees
"""
from typing import Optional, Dict, Any, List
from app.db.supabase_client import supabase_service
import logging

logger = logging.getLogger(__name__)


class FeeRepository:
    """Repository for managing school fees data"""
    
    def __init__(self):
        self.supabase = supabase_service
        self.table_name = "school_fees"
    
    def get_fees_by_grade(self, grade: str) -> Optional[Dict[str, Any]]:
        """
        Get school fees for a specific grade.
        
        Args:
            grade: Grade level (e.g., 'Grade R', 'Grade 1', 'Grade 10')
        
        Returns:
            Dictionary containing fee information or None if not found
        """
        try:
            logger.info(f"Fetching fees for grade: {grade}")
            
            # Query for exact grade match
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .eq("grade", grade)\
                .execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f"Found fees for grade {grade}: {result.data[0]}")
                return result.data[0]
            
            logger.warning(f"No fees found for grade: {grade}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching fees for grade {grade}: {str(e)}")
            return None
    
    def get_all_fees(self) -> List[Dict[str, Any]]:
        """
        Get all school fees.
        
        Returns:
            List of all fee structures
        """
        try:
            logger.info("Fetching all school fees")
            
            result = self.supabase.table(self.table_name)\
                .select("*")\
                .order("grade")\
                .execute()
            
            if result.data:
                logger.info(f"Found {len(result.data)} fee structures")
                return result.data
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching all fees: {str(e)}")
            return []
    
    def update_fees(self, grade: str, fee_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update fees for a specific grade.
        
        Args:
            grade: Grade level
            fee_data: Dictionary with updated fee information
        
        Returns:
            Updated fee record or None if failed
        """
        try:
            logger.info(f"Updating fees for grade: {grade}")
            
            result = self.supabase.table(self.table_name)\
                .update(fee_data)\
                .eq("grade", grade)\
                .execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f"Successfully updated fees for grade {grade}")
                return result.data[0]
            
            logger.warning(f"Failed to update fees for grade: {grade}")
            return None
            
        except Exception as e:
            logger.error(f"Error updating fees for grade {grade}: {str(e)}")
            return None


# Singleton instance
fee_repository = FeeRepository()
