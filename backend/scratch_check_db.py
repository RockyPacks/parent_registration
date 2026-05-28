import os
import sys
from pathlib import Path

# Set up paths so we can import app modules
backend_dir = Path("/Users/morokolochueu/Desktop/parent-registration/parent_registration/backend")
sys.path.append(str(backend_dir))

from app.core.config import settings
from app.db.supabase_client import supabase_service

target_user = "19640f62-f4f9-4445-a1a6-8297400a00bb"

# Query user's applications
result = supabase_service.table("applications").select("*").eq("user_id", target_user).execute()
print(f"\nUser {target_user} has {len(result.data)} applications:")
for i, app in enumerate(result.data):
    app_id = app["id"]
    status = app.get("status")
    print(f"[{i}] App ID: {app_id}, Status: {status}")
    
    # Query student
    student = supabase_service.table("students").select("*").eq("application_id", app_id).execute()
    print("    Student:", student.data if student.data else "None")
    
    # Query medical
    medical = supabase_service.table("medical_info").select("*").eq("application_id", app_id).execute()
    print("    Medical:", medical.data if medical.data else "None")

    # Query parents
    parents = supabase_service.table("parents").select("*").eq("application_id", app_id).execute()
    print("    Parents:", parents.data if parents.data else "None")

    # Query fee_responsibility
    fee = supabase_service.table("fee_responsibility").select("*").eq("application_id", app_id).execute()
    print("    Fee:", fee.data if fee.data else "None")
