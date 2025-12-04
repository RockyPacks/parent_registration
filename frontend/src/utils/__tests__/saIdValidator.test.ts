/**
 * Unit tests for SA ID Validator
 */

import { validateSAID, isValidSAID } from '../saIdValidator';

describe('validateSAID', () => {
  describe('Valid ID numbers', () => {
    it('should validate a correct SA ID number (female, SA citizen)', () => {
      // 9001015009087 (1 Jan 1990, Female, SA Citizen)
      const result = validateSAID('9001015009087');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.details?.gender).toBe('Female');
      expect(result.details?.citizenship).toBe('SA Citizen');
    });

    it('should validate a correct SA ID number (male, SA citizen)', () => {
      // 8801235800086 (23 Jan 1988, Male, SA Citizen)
      const result = validateSAID('8801235800086');
      expect(result.isValid).toBe(true);
      expect(result.details?.gender).toBe('Male');
    });

    it('should extract correct date of birth', () => {
      const result = validateSAID('9001015009087');
      expect(result.isValid).toBe(true);
      expect(result.details?.dateOfBirth?.getFullYear()).toBe(1990);
      expect(result.details?.dateOfBirth?.getMonth()).toBe(0); // January (0-indexed)
      expect(result.details?.dateOfBirth?.getDate()).toBe(1);
    });

    it('should handle dates from 1900s correctly', () => {
      // 500101 = 1 Jan 1950
      const result = validateSAID('5001015009084');
      expect(result.isValid).toBe(true);
      expect(result.details?.dateOfBirth?.getFullYear()).toBe(1950);
    });

    it('should handle dates from 2000s correctly', () => {
      // 050101 = 1 Jan 2005
      const result = validateSAID('0501015009089');
      expect(result.isValid).toBe(true);
      expect(result.details?.dateOfBirth?.getFullYear()).toBe(2005);
    });

    it('should detect permanent resident status', () => {
      // ID with citizenship code 1 (Permanent Resident)
      const result = validateSAID('9001015109083');
      expect(result.isValid).toBe(true);
      expect(result.details?.citizenship).toBe('Permanent Resident');
    });
  });

  describe('Invalid ID numbers - Format', () => {
    it('should reject empty string', () => {
      const result = validateSAID('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID number is required');
    });

    it('should reject non-string input', () => {
      const result = validateSAID(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID number is required');
    });

    it('should reject ID with less than 13 digits', () => {
      const result = validateSAID('12345678901');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID number must be exactly 13 digits');
    });

    it('should reject ID with more than 13 digits', () => {
      const result = validateSAID('12345678901234');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID number must be exactly 13 digits');
    });

    it('should reject ID with letters', () => {
      const result = validateSAID('900101500908A');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID number must be exactly 13 digits');
    });

    it('should reject ID with special characters', () => {
      const result = validateSAID('9001015-009087');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID number must be exactly 13 digits');
    });

    it('should reject ID with whitespace', () => {
      const result = validateSAID('900101 5009087');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('ID number must be exactly 13 digits');
    });
  });

  describe('Invalid ID numbers - Date validation', () => {
    it('should reject invalid month (13)', () => {
      const result = validateSAID('9013015009087');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid month in ID number');
    });

    it('should reject invalid month (00)', () => {
      const result = validateSAID('9000015009087');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid month in ID number');
    });

    it('should reject invalid day (32)', () => {
      const result = validateSAID('9001325009087');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid day in ID number');
    });

    it('should reject invalid day (00)', () => {
      const result = validateSAID('9001005009087');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid day in ID number');
    });

    it('should reject impossible date (Feb 30)', () => {
      const result = validateSAID('9002305009087');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid date in ID number');
    });

    it('should reject future date of birth', () => {
      const nextYear = (new Date().getFullYear() + 1) % 100;
      const futureId = `${nextYear.toString().padStart(2, '0')}01015009087`;
      const result = validateSAID(futureId);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date of birth cannot be in the future');
    });
  });

  describe('Invalid ID numbers - Checksum validation', () => {
    it('should reject ID with invalid checksum', () => {
      // 9001015009086 - Last digit should be 7, not 6
      const result = validateSAID('9001015009086');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('checksum failed');
    });

    it('should reject all same digits', () => {
      const result = validateSAID('1111111111111');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('checksum failed');
    });

    it('should reject sequential digits', () => {
      const result = validateSAID('1234567890123');
      expect(result.isValid).toBe(false);
      // This should fail either date validation or checksum
      expect(result.isValid).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should accept valid leap year date (Feb 29, 2000)', () => {
      const result = validateSAID('0002295009083');
      expect(result.isValid).toBe(true);
      expect(result.details?.dateOfBirth?.getDate()).toBe(29);
      expect(result.details?.dateOfBirth?.getMonth()).toBe(1); // February (0-indexed)
    });
  });
});

describe('isValidSAID', () => {
  it('should return true for valid ID', () => {
    expect(isValidSAID('9001015009087')).toBe(true);
  });

  it('should return false for invalid ID', () => {
    expect(isValidSAID('1111111111111')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidSAID('')).toBe(false);
  });
});
