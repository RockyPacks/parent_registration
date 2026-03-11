-- ============================================================================
-- MAKE STUDENTS TABLE COLUMNS NULLABLE FOR PARTIAL AUTO-SAVE SUPPORT
-- ============================================================================
-- 
-- Problem: The students table has NOT NULL + CHECK constraints on required fields
-- (surname, first_name, date_of_birth, gender, home_language, id_number).
-- When auto-save fires before all fields are filled, the INSERT fails because
-- partial data cannot satisfy these constraints. This means student data is
-- never persisted until ALL required fields are provided simultaneously.
--
-- Solution: Make these columns nullable so partial saves work. Required field
-- validation is enforced at the application layer (Pydantic schemas) during
-- final submission, not at the database level during auto-save.
-- ============================================================================

-- Make required columns nullable to support partial auto-save
ALTER TABLE public.students ALTER COLUMN surname DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN home_language DROP NOT NULL;
ALTER TABLE public.students ALTER COLUMN id_number DROP NOT NULL;

-- Drop CHECK constraints that prevent partial inserts
-- Gender check: prevents inserting NULL or empty during partial save
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_gender_check;

-- ID number format check: prevents inserting NULL or partial during auto-save
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_id_number_check;

-- Re-add CHECK constraints that allow NULL but still validate when a value IS provided
-- This ensures data integrity while supporting partial saves
ALTER TABLE public.students ADD CONSTRAINT students_gender_check 
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

ALTER TABLE public.students ADD CONSTRAINT students_id_number_check 
  CHECK (id_number IS NULL OR id_number ~ '^\d{13}$');
