"""
Unit tests for validation utilities.

Tests the South African ID number validator with various valid and invalid cases.
"""

import pytest
from datetime import datetime
from app.core.validators import validate_sa_id_number, is_valid_sa_id, SAIDValidationError


class TestSAIDValidation:
    """Test cases for South African ID number validation."""
    
    def test_valid_id_number(self):
        """Test validation of a valid SA ID number."""
        # Valid ID: 9001015009087 (1 Jan 1990, Female, SA Citizen)
        result = validate_sa_id_number("9001015009087")
        assert result["valid"] is True
        assert result["gender"] == "female"
        assert result["citizenship"] == "SA Citizen"
    
    def test_valid_id_number_male(self):
        """Test validation of a valid male SA ID number."""
        # Valid ID: 8801235800086 (23 Jan 1988, Male, SA Citizen)
        result = validate_sa_id_number("8801235800086")
        assert result["valid"] is True
        assert result["gender"] == "male"
    
    def test_empty_id_number(self):
        """Test validation fails for empty ID number."""
        with pytest.raises(SAIDValidationError, match="ID number is required"):
            validate_sa_id_number("")
    
    def test_none_id_number(self):
        """Test validation fails for None ID number."""
        with pytest.raises(SAIDValidationError, match="ID number is required"):
            validate_sa_id_number(None)
    
    def test_non_string_id_number(self):
        """Test validation fails for non-string ID number."""
        with pytest.raises(SAIDValidationError, match="ID number must be a string"):
            validate_sa_id_number(1234567890123)
    
    def test_id_with_letters(self):
        """Test validation fails for ID containing letters."""
        with pytest.raises(SAIDValidationError, match="ID number must contain only digits"):
            validate_sa_id_number("900101500908A")
    
    def test_id_too_short(self):
        """Test validation fails for ID with less than 13 digits."""
        with pytest.raises(SAIDValidationError, match="ID number must be exactly 13 digits"):
            validate_sa_id_number("12345678901")
    
    def test_id_too_long(self):
        """Test validation fails for ID with more than 13 digits."""
        with pytest.raises(SAIDValidationError, match="ID number must be exactly 13 digits"):
            validate_sa_id_number("12345678901234")
    
    def test_invalid_month(self):
        """Test validation fails for invalid month (13)."""
        with pytest.raises(SAIDValidationError, match="Invalid month in ID number"):
            validate_sa_id_number("9013015009087")
    
    def test_invalid_day(self):
        """Test validation fails for invalid day (32)."""
        with pytest.raises(SAIDValidationError, match="Invalid day in ID number"):
            validate_sa_id_number("9001325009087")
    
    def test_invalid_date_combination(self):
        """Test validation fails for invalid date combination (Feb 30)."""
        with pytest.raises(SAIDValidationError, match="Invalid date in ID number"):
            validate_sa_id_number("9002305009087")
    
    def test_future_date(self):
        """Test validation fails for future date of birth."""
        # Create an ID with a future date (next year)
        next_year = (datetime.now().year + 1) % 100
        future_id = f"{next_year:02d}01015009087"
        with pytest.raises(SAIDValidationError, match="Date of birth cannot be in the future"):
            validate_sa_id_number(future_id)
    
    def test_invalid_checksum(self):
        """Test validation fails for invalid Luhn checksum."""
        # 9001015009086 - Last digit should be 7, not 6
        with pytest.raises(SAIDValidationError, match="checksum failed"):
            validate_sa_id_number("9001015009086")
    
    def test_all_same_digits(self):
        """Test validation fails for all same digits."""
        with pytest.raises(SAIDValidationError, match="checksum failed"):
            validate_sa_id_number("1111111111111")
    
    def test_is_valid_sa_id_true(self):
        """Test is_valid_sa_id returns True for valid ID."""
        assert is_valid_sa_id("9001015009087") is True
    
    def test_is_valid_sa_id_false(self):
        """Test is_valid_sa_id returns False for invalid ID."""
        assert is_valid_sa_id("1111111111111") is False
    
    def test_permanent_resident(self):
        """Test detection of permanent resident status."""
        # Valid ID with citizenship code 1 (Permanent Resident)
        result = validate_sa_id_number("9001015109083")
        assert result["valid"] is True
        assert result["citizenship"] == "Permanent Resident"
    
    def test_date_of_birth_extraction(self):
        """Test correct extraction of date of birth."""
        # 900101 = 1 Jan 1990
        result = validate_sa_id_number("9001015009087")
        dob = result["date_of_birth"]
        assert dob.year == 1990
        assert dob.month == 1
        assert dob.day == 1
    
    def test_century_determination_old_date(self):
        """Test century determination for dates in 1900s."""
        # 500101 = 1 Jan 1950 (1900s)
        result = validate_sa_id_number("5001015009084")
        dob = result["date_of_birth"]
        assert dob.year == 1950
    
    def test_century_determination_recent_date(self):
        """Test century determination for dates in 2000s."""
        # 050101 = 1 Jan 2005 (2000s)
        result = validate_sa_id_number("0501015009089")
        dob = result["date_of_birth"]
        assert dob.year == 2005


class TestSAIDEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_leap_year_feb_29(self):
        """Test valid date on leap year (Feb 29, 2000)."""
        # This should be valid as 2000 was a leap year
        result = validate_sa_id_number("0002295009083")
        assert result["valid"] is True
        assert result["date_of_birth"].day == 29
        assert result["date_of_birth"].month == 2
    
    def test_whitespace_in_id(self):
        """Test validation fails for ID with whitespace."""
        with pytest.raises(SAIDValidationError, match="ID number must contain only digits"):
            validate_sa_id_number("900101 5009087")
    
    def test_special_characters_in_id(self):
        """Test validation fails for ID with special characters."""
        with pytest.raises(SAIDValidationError, match="ID number must contain only digits"):
            validate_sa_id_number("9001015-009087")
