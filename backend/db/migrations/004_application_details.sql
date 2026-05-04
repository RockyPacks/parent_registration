ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS proposed_start_term TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS grade_applying_for TEXT,
ADD COLUMN IF NOT EXISTS proposed_start_date DATE;
