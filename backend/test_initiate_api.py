import os
import sys
import json
from pathlib import Path

# Set up paths so we can import app modules
backend_dir = Path("/Users/morokolochueu/Desktop/parent-registration/parent_registration/backend")
sys.path.append(str(backend_dir))

from app.services.enrollment_service import enrollment_service

target_user = "19640f62-f4f9-4445-a1a6-8297400a00bb"
user_metadata = {
    "school_applying_for": "Knit Edu",
    "school_id_external": 1,
    "full_name": "morokolo chueu"
}

# Simulate get_or_create_application_for_user call
response = enrollment_service.get_or_create_application_for_user(target_user, user_metadata)

print("RESPONSE KEYS:", list(response.keys()))
print("RESPONSE STATUS:", response.get("status"))
print("APPLICATION KEYS:", list(response.get("application", {}).keys()) if response.get("application") else "None")

# Print the student details inside application
if response.get("application"):
    student = response["application"].get("student")
    print("\nSTUDENT DATA:", student)
    
    # Print next_of_kin details
    nok = response["application"].get("next_of_kin")
    print("\nNEXT OF KIN DATA:", nok)
    
    # Print family details
    family = response["application"].get("family")
    print("\nFAMILY DATA:", family)
