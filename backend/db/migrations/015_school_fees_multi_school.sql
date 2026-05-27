-- Migration 015: Onboard Maseala Independent Schools
-- 1. Register school in schools table (canonical reference, school_key = 'MASEALA_PROG_001')
-- 2. Add school_key column to school_fees for legacy fee lookup compatibility
-- 3. Insert grade fees into school_grade_fees (normalised FK-based table)
-- 4. Insert grade fees into school_fees (legacy flat table used by current API)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Insert Maseala into schools (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.schools (
  name,
  short_name,
  school_key,
  email,
  bank_name,
  account_holder,
  account_number,
  branch_code,
  branch_name,
  payment_reference_format,
  active
)
VALUES (
  'Maseala Independent Schools',
  'Maseala',
  'MASEALA_PROG_001',
  'finance@maseala.co.za',
  'NEDBANK',
  'Maseala Independent Schools',
  '1203 251 815',
  '198765',
  'Nedbank Limpopo',
  'STUDENT_NAME_GRADE',
  true
)
ON CONFLICT (school_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Insert into school_grade_fees (normalised table, FK to schools.id)
--    Add school_key column for direct identification without JOIN
--    Grade 12 is contract-based (contract_based = true, fees = 0)
-- ─────────────────────────────────────────────────────────────────────────────

-- Add school_key column so rows are self-identifying (e.g. 'MASEALA_PROG_001')
ALTER TABLE public.school_grade_fees ADD COLUMN IF NOT EXISTS school_key TEXT;

-- Keep it in sync with schools.school_key via FK source
UPDATE public.school_grade_fees sgf
SET school_key = s.school_key
FROM public.schools s
WHERE sgf.school_id = s.id
  AND sgf.school_key IS NULL;
INSERT INTO public.school_grade_fees (school_id, school_key, grade, monthly_fee, term_fee, annual_fee, contract_based, contract_note)
SELECT
  s.id,
  s.school_key,
  v.grade,
  v.monthly_fee,
  v.term_fee,
  v.annual_fee,
  v.contract_based,
  v.contract_note
FROM public.schools s
CROSS JOIN (VALUES
  ('Grade 8',  950,  2850, 11400, false, NULL),
  ('Grade 9',  1100, 3300, 13200, false, NULL),
  ('Grade 10', 1150, 3450, 13800, false, NULL),
  ('Grade 11', 1150, 3450, 13800, false, NULL),
  ('Grade 12', 0,    0,    0,     true,  'Fee by individual contract. Contact school for quote.')
) AS v(grade, monthly_fee, term_fee, annual_fee, contract_based, contract_note)
WHERE s.school_key = 'MASEALA_PROG_001'
  AND NOT EXISTS (
    SELECT 1 FROM public.school_grade_fees sgf
    WHERE sgf.school_id = s.id AND sgf.grade = v.grade
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Insert into school_registration_fees (per-grade registration amounts)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.school_registration_fees (school_id, grade, amount, is_conditional, contract_based)
SELECT
  s.id,
  v.grade,
  v.amount,
  false,
  false
FROM public.schools s
CROSS JOIN (VALUES
  ('Grade 8',  1000),
  ('Grade 9',  1000),
  ('Grade 10', 1100),
  ('Grade 11', 1100),
  ('Grade 12', 0)
) AS v(grade, amount)
WHERE s.school_key = 'MASEALA_PROG_001'
  AND NOT EXISTS (
    SELECT 1 FROM public.school_registration_fees srf
    WHERE srf.school_id = s.id AND srf.grade = v.grade
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Add school_key column to school_fees (legacy flat table, used by current API)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.school_fees ADD COLUMN IF NOT EXISTS school_key TEXT;

-- Drop any old single-grade unique constraint so same grade can exist per school
ALTER TABLE public.school_fees DROP CONSTRAINT IF EXISTS school_fees_grade_key;
ALTER TABLE public.school_fees DROP CONSTRAINT IF EXISTS school_fees_grade_unique;

-- Composite unique index: (grade, school_key) where NULL school_key = generic row
CREATE UNIQUE INDEX IF NOT EXISTS school_fees_grade_school_uq
  ON public.school_fees (grade, COALESCE(school_key, ''));

-- Insert Maseala rows into legacy school_fees table
-- Fees match school_grade_fees above; sport_fee added as extra cost
INSERT INTO public.school_fees (grade, annual_fee, term_fee, registration_fee, re_registration_fee, sport_fee, school_key)
SELECT v.grade, v.annual_fee, v.term_fee, v.reg_fee, v.rereg_fee, v.sport_fee, 'MASEALA_PROG_001'
FROM (VALUES
  ('Grade 8',  11400, 2850, 1000, 750, 600),
  ('Grade 9',  13200, 3300, 1000, 750, 600),
  ('Grade 10', 13800, 3450, 1100, 850, 600),
  ('Grade 11', 13800, 3450, 1100, 850, 600),
  ('Grade 12', 0,     0,    0,    0,   0)
) AS v(grade, annual_fee, term_fee, reg_fee, rereg_fee, sport_fee)
WHERE NOT EXISTS (
  SELECT 1 FROM public.school_fees sf
  WHERE sf.grade = v.grade AND sf.school_key = 'MASEALA_PROG_001'
);
