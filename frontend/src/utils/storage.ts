// Utility functions for localStorage operations
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage: ${key}`, error);
    }
  },

  getString: (key: string, defaultValue: string = ''): string => {
    return localStorage.getItem(key) || defaultValue;
  },

  setString: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  }
};

// ─── School-type helpers ────────────────────────────────────────────────────
export type SchoolType = 'molo' | 'maseala' | 'default';

export const SELECTED_SCHOOL_NAME_KEY = 'selectedSchoolName';

export const MOLO_CLASS_OPTIONS = [
  'Empress of Menen',
  'Frances Gqoba',
  'Sibulelo Mashale',
  'Thandeka Nonkasana',
  'Nosiseko Dlakavu',
  'Amanirenas of Kush',
];

export const MASEALA_GRADE_OPTIONS = [
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

/**
 * Returns the school type based on the stored school name.
 * Defaults to 'default' (grade-based) for unrecognised schools.
 * Only returns 'molo' when the school is explicitly identified as Molo Mohlaba.
 */
export const getSchoolType = (name: string): SchoolType => {
  const n = name.toLowerCase();
  if (n.includes('molo') || n.includes('mhlaba') || n.includes('tennyson')) return 'molo';
  if (n.includes('maseala') || n.includes('maseal')) return 'maseala';
  return 'default';
};

/** Reads school name from localStorage and returns the school type. */
export const getActiveSchoolType = (): SchoolType =>
  getSchoolType(localStorage.getItem(SELECTED_SCHOOL_NAME_KEY) || '');

/**
 * Returns the correct grade/class options and label for the active school.
 * Molo Mohlaba → class names. All other schools → Grade 8–12.
 */
export const getGradeConfig = (schoolType: SchoolType) => ({
  options: schoolType === 'molo' ? MOLO_CLASS_OPTIONS : MASEALA_GRADE_OPTIONS,
  label: schoolType === 'molo' ? 'Class Name' : 'Grade',
});
