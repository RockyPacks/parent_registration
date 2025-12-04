/**
 * South African ID Number Validator
 * 
 * Validates SA ID numbers using:
 * 1. Basic format check (13 digits)
 * 2. Date of birth validation (YYMMDD)
 * 3. Luhn checksum algorithm (Modulus 10)
 */

export interface SAIDValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    dateOfBirth?: Date;
    gender?: 'Male' | 'Female';
    citizenship?: 'SA Citizen' | 'Permanent Resident';
  };
}

/**
 * Validates a South African ID number
 * @param id - The 13-digit ID number to validate
 * @returns Validation result with details if valid
 */
export const validateSAID = (id: string): SAIDValidationResult => {
  // 1. Basic format check
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'ID number is required' };
  }

  if (!/^\d{13}$/.test(id)) {
    return { isValid: false, error: 'ID number must be exactly 13 digits' };
  }

  // 2. Validate Date of Birth (YYMMDD)
  const year = parseInt(id.substring(0, 2), 10);
  const month = parseInt(id.substring(2, 4), 10);
  const day = parseInt(id.substring(4, 6), 10);

  // Month validation
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month in ID number' };
  }

  // Day validation (basic - doesn't account for leap years or month-specific days)
  if (day < 1 || day > 31) {
    return { isValid: false, error: 'Invalid day in ID number' };
  }

  // More rigorous date validation
  const currentYear = new Date().getFullYear();
  const century = year <= (currentYear % 100) ? 2000 : 1900;
  const fullYear = century + year;
  
  // Create date and verify it's valid
  const dateOfBirth = new Date(fullYear, month - 1, day);
  if (
    dateOfBirth.getFullYear() !== fullYear ||
    dateOfBirth.getMonth() !== month - 1 ||
    dateOfBirth.getDate() !== day
  ) {
    return { isValid: false, error: 'Invalid date in ID number' };
  }

  // Check if person is not from the future
  if (dateOfBirth > new Date()) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }

  // 3. Validate using Luhn Algorithm (Modulus 10)
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    let digit = parseInt(id.charAt(i), 10);
    
    // Double every second digit from the right (odd indices when counting from 0)
    if (i % 2 === 1) {
      digit *= 2;
      // If the result is > 9, subtract 9
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { 
      isValid: false, 
      error: 'Invalid ID number (checksum failed). Please check for typos' 
    };
  }

  // Extract additional details
  const genderCode = parseInt(id.substring(6, 10), 10);
  const citizenshipCode = parseInt(id.substring(10, 11), 10);

  return {
    isValid: true,
    details: {
      dateOfBirth,
      gender: genderCode >= 5000 ? 'Male' : 'Female',
      citizenship: citizenshipCode === 0 ? 'SA Citizen' : 'Permanent Resident',
    },
  };
};

/**
 * Simple validation that returns boolean only
 * @param id - The 13-digit ID number to validate
 * @returns true if valid, false otherwise
 */
export const isValidSAID = (id: string): boolean => {
  return validateSAID(id).isValid;
};
