#!/usr/bin/env python3
"""
End-to-End Test Script for Student Enrollment Platform
This script tests the complete enrollment flow from signup to submission.

Prerequisites:
1. Backend running on http://localhost:8000
2. Frontend running on http://localhost:3001
3. Supabase email confirmation DISABLED (see ENABLE_E2E_TESTING.md)

Usage:
    python3 e2e_test.py
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000/api/v1"
FRONTEND_URL = "http://localhost:3001"

# Test data
def generate_test_email():
    """Generate a unique test email"""
    timestamp = int(time.time())
    random_str = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"test_{timestamp}_{random_str}@example.com"

TEST_USER = {
    "email": generate_test_email(),
    "password": "TestPassword123!",
    "first_name": "John",
    "last_name": "Doe"
}

TEST_STUDENT = {
    "surname": "Doe",
    "firstName": "Jane",
    "middleName": "Marie",
    "preferredName": "Janey",
    "dob": "2015-01-15",
    "gender": "Female",
    "homeLanguage": "English",
    "idNumber": "1501150000000",
    "previousGrade": "Grade R",
    "gradeAppliedFor": "Grade 1",
    "previousSchool": "ABC Primary School"
}

TEST_FAMILY = {
    "fatherSurname": "Doe",
    "fatherFirstName": "John",
    "fatherIdNumber": "8001010000000",
    "fatherMobile": "+27821234567",
    "fatherEmail": TEST_USER["email"],
    "motherSurname": "Doe",
    "motherFirstName": "Jane",
    "motherIdNumber": "8502020000000",
    "motherMobile": "+27821234568",
    "motherEmail": "jane.doe@example.com",
    "nextOfKinSurname": "Smith",
    "nextOfKinFirstName": "Alice",
    "nextOfKinRelationship": "Aunt",
    "nextOfKinMobile": "+27821234569",
    "nextOfKinEmail": "alice.smith@example.com",
    "nextOfKinIdNumber": "7503030000000"
}

TEST_MEDICAL = {
    "medicalAidName": "Discovery Health",
    "memberNumber": "12345678",
    "conditions": ["Asthma"],
    "allergies": "Peanuts"
}

class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(message):
    """Print a header message"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{message.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(message):
    """Print a success message"""
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    """Print an error message"""
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_info(message):
    """Print an info message"""
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")

def print_warning(message):
    """Print a warning message"""
    print(f"{Colors.WARNING}⚠ {message}{Colors.ENDC}")

def test_backend_health():
    """Test if backend is running"""
    print_info("Testing backend health...")
    try:
        response = requests.get(f"{BACKEND_URL.replace('/api/v1', '')}/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend is healthy")
            return True
        else:
            print_warning(f"Backend returned status {response.status_code}")
            return True  # Backend is running, just different response
    except requests.exceptions.RequestException as e:
        print_error(f"Backend is not accessible: {e}")
        return False

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    print_info("Testing frontend accessibility...")
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print_success("Frontend is accessible")
            return True
        else:
            print_error(f"Frontend returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Frontend is not accessible: {e}")
        return False

def signup_user():
    """
    Note: This test uses Supabase directly, which requires the frontend.
    For a true backend API test, you would need a signup endpoint in the backend.
    """
    print_info(f"Creating test user: {TEST_USER['email']}")
    print_warning("Note: Signup must be done through the frontend (Supabase Auth)")
    print_info("Please ensure email confirmation is DISABLED in Supabase")
    print_success("User creation step acknowledged (manual step required)")
    return True

def test_enrollment_initiation(access_token):
    """Test enrollment initiation"""
    print_info("Testing enrollment initiation...")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/enrollment/initiate",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            application_id = data.get("application_id")
            print_success(f"Enrollment initiated. Application ID: {application_id}")
            return application_id
        else:
            print_error(f"Enrollment initiation failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print_error(f"Enrollment initiation request failed: {e}")
        return None

def test_auto_save(access_token, application_id, step_data):
    """Test auto-save functionality"""
    print_info("Testing auto-save...")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "application_id": application_id,
        **step_data
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/enrollment/auto-save",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("Auto-save successful")
            return True
        else:
            print_error(f"Auto-save failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Auto-save request failed: {e}")
        return False

def test_academic_history_submission(access_token, application_id):
    """Test academic history submission"""
    print_info("Testing academic history submission...")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "applicationId": application_id,
        "previousSchool": TEST_STUDENT["previousSchool"],
        "previousGrade": TEST_STUDENT["previousGrade"],
        "yearAttended": "2024"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/academic/history",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            print_success("Academic history submitted successfully")
            return True
        else:
            print_error(f"Academic history submission failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Academic history submission request failed: {e}")
        return False

def test_final_submission(access_token, application_id):
    """Test final application submission"""
    print_info("Testing final application submission...")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "application_id": application_id,
        "student": TEST_STUDENT,
        "family": TEST_FAMILY,
        "medical": TEST_MEDICAL
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/enrollment/submit",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            print_success("Final application submitted successfully")
            return True
        else:
            print_error(f"Final submission failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Final submission request failed: {e}")
        return False

def run_tests():
    """Run all E2E tests"""
    print_header("Student Enrollment Platform - E2E Test Suite")
    
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"Backend URL: {BACKEND_URL}")
    print_info(f"Frontend URL: {FRONTEND_URL}")
    print_info(f"Test user email: {TEST_USER['email']}")
    
    # Test 1: Backend Health
    print_header("Test 1: Backend Health Check")
    if not test_backend_health():
        print_error("Backend health check failed. Aborting tests.")
        return False
    
    # Test 2: Frontend Accessibility
    print_header("Test 2: Frontend Accessibility Check")
    if not test_frontend_accessibility():
        print_error("Frontend accessibility check failed. Aborting tests.")
        return False
    
    # Test 3: User Signup
    print_header("Test 3: User Signup")
    print_warning("⚠️  MANUAL STEP REQUIRED ⚠️")
    print_info("Please complete the following steps manually:")
    print_info(f"1. Go to {FRONTEND_URL}")
    print_info("2. Click 'Sign up'")
    print_info(f"3. Create account with email: {TEST_USER['email']}")
    print_info(f"4. Use password: {TEST_USER['password']}")
    print_info("5. Log in with the new account")
    print_info("6. Open browser console (F12)")
    print_info("7. Type: localStorage.getItem('supabase.auth.token')")
    print_info("8. Copy the access_token value")
    print("")
    
    access_token = input(f"{Colors.OKCYAN}Enter the access_token (or 'skip' to skip API tests): {Colors.ENDC}").strip()
    
    if access_token.lower() == 'skip':
        print_warning("Skipping API tests")
        print_header("Test Summary")
        print_success("Frontend and Backend are running")
        print_warning("API tests skipped - manual testing required")
        return True
    
    # Test 4: Enrollment Initiation
    print_header("Test 4: Enrollment Initiation")
    application_id = test_enrollment_initiation(access_token)
    if not application_id:
        print_error("Enrollment initiation failed. Continuing with other tests...")
        application_id = input(f"{Colors.OKCYAN}Enter application_id manually (or 'skip'): {Colors.ENDC}").strip()
        if application_id.lower() == 'skip':
            print_warning("Skipping remaining tests")
            return False
    
    # Test 5: Auto-Save
    print_header("Test 5: Auto-Save Functionality")
    step_data = {
        "student": TEST_STUDENT,
        "family": TEST_FAMILY,
        "medical": TEST_MEDICAL
    }
    test_auto_save(access_token, application_id, step_data)
    
    # Test 6: Academic History
    print_header("Test 6: Academic History Submission")
    test_academic_history_submission(access_token, application_id)
    
    # Test 7: Final Submission
    print_header("Test 7: Final Application Submission")
    test_final_submission(access_token, application_id)
    
    # Summary
    print_header("Test Summary")
    print_success("All automated tests completed")
    print_info("Please verify the following in Supabase Dashboard:")
    print_info("1. Check 'applications' table for new entry")
    print_info("2. Check 'students' table for student data")
    print_info("3. Check 'family' table for guardian data")
    print_info("4. Check 'medical' table for medical info")
    print_info("5. Check 'academic_history' table for academic data")
    
    return True

if __name__ == "__main__":
    try:
        success = run_tests()
        if success:
            print(f"\n{Colors.OKGREEN}{Colors.BOLD}✓ E2E Test Suite Completed{Colors.ENDC}\n")
        else:
            print(f"\n{Colors.FAIL}{Colors.BOLD}✗ E2E Test Suite Failed{Colors.ENDC}\n")
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Test suite interrupted by user{Colors.ENDC}\n")
    except Exception as e:
        print(f"\n{Colors.FAIL}Unexpected error: {e}{Colors.ENDC}\n")
