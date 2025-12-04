"""
Validation utilities for South African documents and data.

Contains validators for:
- South African ID numbers (with Luhn checksum)
- Other document validation logic
"""

from datetime import datetime
from typing import Optional, Dict, Any


class SAIDValidationError(ValueError):
    """Custom exception for SA ID validation errors."""
    pass


def validate_sa_id_number(id_number: str) -> Dict[str, Any]:
    """
    Validate a South African ID number.
    
    Performs three levels of validation:
    1. Basic format check (13 digits)
    2. Date of birth validation (YYMMDD)
    3. Luhn checksum algorithm (Modulus 10)
    
    Args:
        id_number: The 13-digit SA ID number to validate
        
    Returns:
        Dictionary containing validation results and extracted details
        
    Raises:
        SAIDValidationError: If the ID number is invalid
    """
    # 1. Basic format check
    if not id_number:
        raise SAIDValidationError("ID number is required")
    
    if not isinstance(id_number, str):
        raise SAIDValidationError("ID number must be a string")
    
    if not id_number.isdigit():
        raise SAIDValidationError("ID number must contain only digits")
    
    if len(id_number) != 13:
        raise SAIDValidationError("ID number must be exactly 13 digits")
    
    # 2. Validate Date of Birth (YYMMDD)
    year = int(id_number[0:2])
    month = int(id_number[2:4])
    day = int(id_number[4:6])
    
    # Month validation
    if month < 1 or month > 12:
        raise SAIDValidationError(f"Invalid month in ID number: {month}")
    
    # Day validation
    if day < 1 or day > 31:
        raise SAIDValidationError(f"Invalid day in ID number: {day}")
    
    # Determine century (assume current century if year <= current year's last 2 digits)
    current_year = datetime.now().year
    century = 2000 if year <= (current_year % 100) else 1900
    full_year = century + year
    
    # Validate the date
    try:
        date_of_birth = datetime(full_year, month, day)
    except ValueError as e:
        raise SAIDValidationError(f"Invalid date in ID number: {e}")
    
    # Check if date is not in the future
    if date_of_birth > datetime.now():
        raise SAIDValidationError("Date of birth cannot be in the future")
    
    # 3. Validate using Luhn Algorithm (Modulus 10)
    checksum = 0
    for i, digit_char in enumerate(id_number):
        digit = int(digit_char)
        
        # Double every second digit from the right (odd indices)
        if i % 2 == 1:
            digit *= 2
            # If result > 9, subtract 9
            if digit > 9:
                digit -= 9
        
        checksum += digit
    
    if checksum % 10 != 0:
        raise SAIDValidationError(
            "Invalid ID number (checksum failed). Please check for typos"
        )
    
    # Extract additional details
    gender_code = int(id_number[6:10])
    citizenship_code = int(id_number[10])
    
    return {
        "valid": True,
        "date_of_birth": date_of_birth.date(),
        "gender": "male" if gender_code >= 5000 else "female",
        "citizenship": "SA Citizen" if citizenship_code == 0 else "Permanent Resident",
    }


def is_valid_sa_id(id_number: str) -> bool:
    """
    Check if a South African ID number is valid.
    
    Args:
        id_number: The 13-digit SA ID number to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        validate_sa_id_number(id_number)
        return True
    except SAIDValidationError:
        return False
