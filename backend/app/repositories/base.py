"""
Base repository classes providing common database operations.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, TypeVar, Generic
from app.db.supabase_client import supabase_service
from app.core.exceptions import ExternalServiceError
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """
    Base repository class providing common database operations.

    This class provides standardized CRUD operations and error handling
    for all repository implementations.
    """

    def __init__(self, table_name: str):
        """
        Initialize repository with table name.

        Args:
            table_name: Name of the database table
        """
        self.table_name = table_name
        self.supabase = supabase_service

    def _check_supabase(self) -> None:
        """Check if Supabase is configured and available."""
        if not self.supabase:
            raise ExternalServiceError("Database", "Database not configured")

    def insert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert a new record.

        Args:
            data: Record data to insert

        Returns:
            Inserted record data

        Raises:
            ExternalServiceError: If database operation fails
        """
        self._check_supabase()
        try:
            logger.info(f"Inserting into {self.table_name}: {data}")
            result = self.supabase.table(self.table_name).insert(data).execute()
            logger.info(f"Insert result for {self.table_name}: {result}")
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Failed to insert into {self.table_name}: {e.__class__.__name__} - {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Supabase error details: {e.response.text}")
            raise ExternalServiceError("Database", f"Failed to insert into {self.table_name}")

    def update(self, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a record by ID.

        Args:
            record_id: ID of record to update
            data: Updated record data

        Returns:
            Updated record data

        Raises:
            ExternalServiceError: If database operation fails
        """
        self._check_supabase()
        try:
            result = self.supabase.table(self.table_name).update(data).eq("id", record_id).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Failed to update {self.table_name} with id {record_id}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to update {self.table_name}")

    def get_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a record by ID.

        Args:
            record_id: ID of record to retrieve

        Returns:
            Record data or None if not found

        Raises:
            ExternalServiceError: If database operation fails
        """
        self._check_supabase()
        try:
            result = self.supabase.table(self.table_name).select("*").eq("id", record_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get {self.table_name} by id {record_id}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to retrieve {self.table_name}")

    def get_all(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get all records with pagination.

        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip

        Returns:
            List of records

        Raises:
            ExternalServiceError: If database operation fails
        """
        self._check_supabase()
        try:
            result = self.supabase.table(self.table_name).select("*").range(offset, offset + limit - 1).execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to get all {self.table_name}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to retrieve {self.table_name} records")

    def delete(self, record_id: str) -> bool:
        """
        Delete a record by ID.

        Args:
            record_id: ID of record to delete

        Returns:
            True if record was deleted, False otherwise

        Raises:
            ExternalServiceError: If database operation fails
        """
        self._check_supabase()
        try:
            result = self.supabase.table(self.table_name).delete().eq("id", record_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Failed to delete {self.table_name} with id {record_id}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to delete from {self.table_name}")

    def find_by_field(self, field: str, value: Any) -> List[Dict[str, Any]]:
        """
        Find records by a specific field value.

        Args:
            field: Field name to search by
            value: Value to search for

        Returns:
            List of matching records

        Raises:
            ExternalServiceError: If database operation fails
        """
        self._check_supabase()
        try:
            result = self.supabase.table(self.table_name).select("*").eq(field, value).execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to find {self.table_name} by {field}={value}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to search {self.table_name}")

    def upsert(self, data: Dict[str, Any], on_conflict_fields: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Upsert a record (insert or update on conflict).

        Args:
            data: Record data to upsert
            on_conflict_fields: Fields to check for conflicts (optional)

        Returns:
            Upserted record data

        Raises:
            ExternalServiceError: If database operation fails
        """
        self._check_supabase()
        try:
            if on_conflict_fields:
                # Use upsert with on_conflict specification
                result = self.supabase.table(self.table_name).upsert(data, on_conflict=on_conflict_fields).execute()
            else:
                result = self.supabase.table(self.table_name).upsert(data).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"Failed to upsert into {self.table_name}: {str(e)}")
            raise ExternalServiceError("Database", f"Failed to upsert into {self.table_name}")
