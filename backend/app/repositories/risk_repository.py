from typing import Dict, Any, List, Optional
from app.repositories.base import BaseRepository


class RiskReportRepository(BaseRepository):
    """Repository for risk reports data access"""

    def __init__(self):
        super().__init__("risk_reports")

    def find_by_application_id(self, application_id: str) -> List[Dict[str, Any]]:
        """Find risk reports by application ID"""
        return self.find_all({"application_id": application_id})

    def find_by_reference(self, reference: str) -> Optional[Dict[str, Any]]:
        """Find risk report by reference"""
        reports = self.find_all({"reference": reference})
        return reports[0] if reports else None

    def create_risk_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new risk report"""
        return self.create(report_data)

    def update_risk_report(self, report_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing risk report"""
        return self.update(report_id, update_data)


class ApplicationRepository(BaseRepository):
    """Repository for applications data access"""

    def __init__(self):
        super().__init__("applications")

    def find_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        """Find applications by user ID"""
        return self.find_all({"user_id": user_id})

    def find_by_student_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Find application by student ID number"""
        # This would require a join with students table, for now return None
        # In a full implementation, you'd use Supabase's RPC or complex queries
        return None

    def update_status(self, application_id: str, status: str) -> Dict[str, Any]:
        """Update application status"""
        return self.update(application_id, {"status": status, "updated_at": "now()"})


class StudentRepository(BaseRepository):
    """Repository for students data access"""

    def __init__(self):
        super().__init__("students")

    def find_by_id_number(self, id_number: str) -> Optional[Dict[str, Any]]:
        """Find student by ID number"""
        students = self.find_all({"id_number": id_number})
        return students[0] if students else None

    def find_by_application_id(self, application_id: str) -> Optional[Dict[str, Any]]:
        """Find student by application ID"""
        students = self.find_all({"application_id": application_id})
        return students[0] if students else None


class DocumentRepository(BaseRepository):
    """Repository for documents data access"""

    def __init__(self):
        super().__init__("documents")

    def find_by_application_id(self, application_id: str, uploaded_by: Optional[str] = None) -> List[Dict[str, Any]]:
        """Find documents by application ID and optionally by uploader"""
        filters = {"application_id": application_id}
        if uploaded_by:
            filters["uploaded_by"] = uploaded_by
        return self.find_all(filters)

    def find_by_type(self, application_id: str, document_type: str) -> List[Dict[str, Any]]:
        """Find documents by type for an application"""
        return self.find_all({
            "application_id": application_id,
            "document_type": document_type
        })


# Global repository instances
risk_report_repo = RiskReportRepository()
application_repo = ApplicationRepository()
student_repo = StudentRepository()
document_repo = DocumentRepository()
