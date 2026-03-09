-- Migration: Remove UNIQUE constraint on students.id_number
-- Purpose: Allow multiple students with the same ID number in the system
-- (This constraint was causing issues when students re-submit forms with the same ID)

ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_id_number_key;

-- Add index on id_number for faster lookups (without uniqueness constraint)
CREATE INDEX IF NOT EXISTS idx_students_id_number 
ON public.students(id_number);
