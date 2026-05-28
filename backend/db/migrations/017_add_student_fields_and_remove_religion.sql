-- Migration 017: Add Student Number & Designated Pickup Person, Remove Religion
-- Applies structural changes to students and medical_info tables for registration flow requirements

-- 1. Add student_number and pickup_person to public.students table
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS student_number TEXT,
  ADD COLUMN IF NOT EXISTS pickup_person TEXT;

-- 2. Clean up medical_info table by dropping religion column (now obsolete)
ALTER TABLE public.medical_info
  DROP COLUMN IF EXISTS religion;

-- 3. Add column comments for documentation
COMMENT ON COLUMN public.students.student_number IS 'Student official school/registration number';
COMMENT ON COLUMN public.students.pickup_person IS 'Designated pickup person for school dismissal';
