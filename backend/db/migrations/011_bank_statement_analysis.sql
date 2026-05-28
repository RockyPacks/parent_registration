-- ============================================================================
-- Migration 011: bank_statement_analyses table
-- Stores AI analysis results for uploaded bank statements
--
-- NOTE: file_id is stored as TEXT (not a FK) because uploaded_files uses a
-- JSONB-based structure (files are stored in a JSON array per application),
-- so no relational FK target exists for individual file entries.
-- ============================================================================

-- Ensure the updated_at trigger function exists (created in 003, but guard here)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.bank_statement_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  file_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result_json JSONB,
  risk_score INTEGER,
  flags TEXT[],
  ai_summary TEXT,
  model_version TEXT NOT NULL,
  analysed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT bank_statement_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT bank_statement_analyses_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT bank_statement_analyses_status_check CHECK (
    status IN ('pending', 'processing', 'complete', 'error')
  ),
  CONSTRAINT bank_statement_analyses_risk_score_check CHECK (
    risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)
  ),
  CONSTRAINT bank_statement_analyses_app_file_unique UNIQUE (application_id, file_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_statement_analyses_application_id
  ON public.bank_statement_analyses USING btree (application_id);

CREATE INDEX IF NOT EXISTS idx_bank_statement_analyses_status
  ON public.bank_statement_analyses USING btree (status);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_bank_statement_analyses_updated_at ON public.bank_statement_analyses;
CREATE TRIGGER update_bank_statement_analyses_updated_at
  BEFORE UPDATE ON public.bank_statement_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.bank_statement_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role can insert" ON public.bank_statement_analyses;
DROP POLICY IF EXISTS "Service role can update" ON public.bank_statement_analyses;
DROP POLICY IF EXISTS "Admin role can select" ON public.bank_statement_analyses;
DROP POLICY IF EXISTS "Authenticated users have no access" ON public.bank_statement_analyses;

-- RLS policies:
-- Authenticated users (parents) have NO access.
-- By default, if no policy allows access, it is denied. We explicitly deny it here for clarity.
CREATE POLICY "Authenticated users have no access" ON public.bank_statement_analyses
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Service role can INSERT/UPDATE. The service_role bypasses RLS natively,
-- but we add it to match requirements explicitly.
CREATE POLICY "Service role can insert" ON public.bank_statement_analyses
  FOR INSERT
  WITH CHECK (current_role = 'service_role');

CREATE POLICY "Service role can update" ON public.bank_statement_analyses
  FOR UPDATE
  USING (current_role = 'service_role')
  WITH CHECK (current_role = 'service_role');

-- Admin role can SELECT
CREATE POLICY "Admin role can select" ON public.bank_statement_analyses
  FOR SELECT
  TO authenticated
  USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin' OR
    (current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role') = 'admin'
  );

-- Add table/column documentation
COMMENT ON TABLE public.bank_statement_analyses IS
  'Stores AI analysis results for uploaded bank statements. One record per (application_id, file_id) pair.';

COMMENT ON COLUMN public.bank_statement_analyses.file_id IS
  'Logical file identifier — matches the id field inside the uploaded_files JSONB files array.';

COMMENT ON COLUMN public.bank_statement_analyses.status IS
  'Analysis lifecycle: pending → processing → complete | error';

COMMENT ON COLUMN public.bank_statement_analyses.result_json IS
  'Full structured AI response JSON, nullable until status = complete';

COMMENT ON COLUMN public.bank_statement_analyses.flags IS
  'Array of detected risk flags e.g. {gambling, irregular_income, large_cash_withdrawals}';

COMMENT ON COLUMN public.bank_statement_analyses.model_version IS
  'The exact model identifier used for this analysis e.g. gpt-4o';

/*
-- ============================================================================
-- ROLLBACK SQL
-- Run this block to fully undo migration 011
-- ============================================================================

DROP TRIGGER IF EXISTS update_bank_statement_analyses_updated_at ON public.bank_statement_analyses;
DROP INDEX IF EXISTS public.idx_bank_statement_analyses_application_id;
DROP INDEX IF EXISTS public.idx_bank_statement_analyses_status;
DROP TABLE IF EXISTS public.bank_statement_analyses CASCADE;
*/