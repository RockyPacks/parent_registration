from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.db.session import supabase


class BaseRepository(ABC):
    """Base repository class with common database operations"""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.client = supabase

    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        """Find record by ID"""
        try:
            result = self.client.table(self.table_name).select("*").eq("id", id).execute()
            return result.data[0] if result.data else None
        except Exception:
            return None

    def find_all(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Find all records with optional filters"""
        try:
            query = self.client.table(self.table_name).select("*")
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            result = query.execute()
            return result.data or []
        except Exception:
            return []

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record"""
        result = self.client.table(self.table_name).insert(data).execute()
        return result.data[0] if result.data else {}

    def update(self, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a record by ID"""
        result = self.client.table(self.table_name).update(data).eq("id", id).execute()
        return result.data[0] if result.data else {}

    def delete(self, id: str) -> bool:
        """Delete a record by ID"""
        try:
            self.client.table(self.table_name).delete().eq("id", id).execute()
            return True
        except Exception:
            return False

    def upsert(self, data: Dict[str, Any], on_conflict: Optional[str] = None) -> Dict[str, Any]:
        """Upsert a record"""
        result = self.client.table(self.table_name).upsert(data).execute()
        return result.data[0] if result.data else {}
