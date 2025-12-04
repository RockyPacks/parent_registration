-- =============================================
-- School Fees Table Migration
-- Links Combined College Fee Schedule 2026
-- =============================================

-- Create School Fees Table
CREATE TABLE IF NOT EXISTS public.school_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL UNIQUE, -- e.g., 'Grade R', 'Grade 1', 'Grade 2', etc.
  annual_fee INTEGER NOT NULL,
  term_fee INTEGER NOT NULL,
  registration_fee INTEGER NOT NULL DEFAULT 800,
  re_registration_fee INTEGER NOT NULL DEFAULT 400,
  sport_fee INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT school_fees_pkey PRIMARY KEY (id),
  CONSTRAINT school_fees_grade_unique UNIQUE (grade)
);

-- Create index on grade for faster lookups
CREATE INDEX IF NOT EXISTS idx_school_fees_grade ON public.school_fees(grade);

-- Enable Row Level Security
ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view fees (read-only)
CREATE POLICY "Authenticated users can view fees" ON public.school_fees
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anonymous users to view fees (for public enrollment forms)
CREATE POLICY "Public can view fees" ON public.school_fees
  FOR SELECT
  TO anon
  USING (true);

-- =============================================
-- Populate Data (Fee Schedule 2026)
-- Source: Links Combined College Fee Schedule 2026 PDF
-- =============================================

-- Grade R: Annual R14,400 | Term R3,600
INSERT INTO public.school_fees (grade, annual_fee, term_fee, registration_fee, re_registration_fee, sport_fee) 
VALUES ('Grade R', 14400, 3600, 800, 400, 0)
ON CONFLICT (grade) DO UPDATE SET
  annual_fee = EXCLUDED.annual_fee,
  term_fee = EXCLUDED.term_fee,
  registration_fee = EXCLUDED.registration_fee,
  re_registration_fee = EXCLUDED.re_registration_fee,
  sport_fee = EXCLUDED.sport_fee,
  updated_at = NOW();

-- Grades 1-6: Annual R20,400 | Term R5,100
INSERT INTO public.school_fees (grade, annual_fee, term_fee, registration_fee, re_registration_fee, sport_fee) 
VALUES 
  ('Grade 1', 20400, 5100, 800, 400, 0),
  ('Grade 2', 20400, 5100, 800, 400, 0),
  ('Grade 3', 20400, 5100, 800, 400, 0),
  ('Grade 4', 20400, 5100, 800, 400, 0),
  ('Grade 5', 20400, 5100, 800, 400, 0),
  ('Grade 6', 20400, 5100, 800, 400, 0)
ON CONFLICT (grade) DO UPDATE SET
  annual_fee = EXCLUDED.annual_fee,
  term_fee = EXCLUDED.term_fee,
  registration_fee = EXCLUDED.registration_fee,
  re_registration_fee = EXCLUDED.re_registration_fee,
  sport_fee = EXCLUDED.sport_fee,
  updated_at = NOW();

-- Grades 7-9: Annual R26,400 | Term R6,600
INSERT INTO public.school_fees (grade, annual_fee, term_fee, registration_fee, re_registration_fee, sport_fee) 
VALUES 
  ('Grade 7', 26400, 6600, 800, 400, 0),
  ('Grade 8', 26400, 6600, 800, 400, 0),
  ('Grade 9', 26400, 6600, 800, 400, 0)
ON CONFLICT (grade) DO UPDATE SET
  annual_fee = EXCLUDED.annual_fee,
  term_fee = EXCLUDED.term_fee,
  registration_fee = EXCLUDED.registration_fee,
  re_registration_fee = EXCLUDED.re_registration_fee,
  sport_fee = EXCLUDED.sport_fee,
  updated_at = NOW();

-- Grades 10-11: Annual R30,000 | Term R7,500
INSERT INTO public.school_fees (grade, annual_fee, term_fee, registration_fee, re_registration_fee, sport_fee) 
VALUES 
  ('Grade 10', 30000, 7500, 800, 400, 0),
  ('Grade 11', 30000, 7500, 800, 400, 0)
ON CONFLICT (grade) DO UPDATE SET
  annual_fee = EXCLUDED.annual_fee,
  term_fee = EXCLUDED.term_fee,
  registration_fee = EXCLUDED.registration_fee,
  re_registration_fee = EXCLUDED.re_registration_fee,
  sport_fee = EXCLUDED.sport_fee,
  updated_at = NOW();

-- Grade 12: Annual R32,400 | Term R8,100
INSERT INTO public.school_fees (grade, annual_fee, term_fee, registration_fee, re_registration_fee, sport_fee) 
VALUES ('Grade 12', 32400, 8100, 800, 400, 0)
ON CONFLICT (grade) DO UPDATE SET
  annual_fee = EXCLUDED.annual_fee,
  term_fee = EXCLUDED.term_fee,
  registration_fee = EXCLUDED.registration_fee,
  re_registration_fee = EXCLUDED.re_registration_fee,
  sport_fee = EXCLUDED.sport_fee,
  updated_at = NOW();

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_school_fees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_school_fees_timestamp
  BEFORE UPDATE ON public.school_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_school_fees_updated_at();

-- Add comment to table
COMMENT ON TABLE public.school_fees IS 'Links Combined College Fee Schedule 2026 - Official school fees by grade';
COMMENT ON COLUMN public.school_fees.grade IS 'Grade level (e.g., Grade R, Grade 1, Grade 2, etc.)';
COMMENT ON COLUMN public.school_fees.annual_fee IS 'Annual tuition fee in ZAR cents';
COMMENT ON COLUMN public.school_fees.term_fee IS 'Per-term tuition fee in ZAR cents';
COMMENT ON COLUMN public.school_fees.registration_fee IS 'New student registration fee in ZAR cents';
COMMENT ON COLUMN public.school_fees.re_registration_fee IS 'Returning student re-registration fee in ZAR cents';
COMMENT ON COLUMN public.school_fees.sport_fee IS 'Additional sports fee in ZAR cents (if applicable)';
