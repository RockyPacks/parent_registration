-- ============================================================================
-- CREATE PROSPECTS TABLE AND RLS POLICIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  parent_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  grade TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inquiry',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT prospects_pkey PRIMARY KEY (id)
);

-- Enable Row-Level Security
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert to prospects" ON public.prospects;
DROP POLICY IF EXISTS "Allow authenticated users to read prospects" ON public.prospects;
DROP POLICY IF EXISTS "Allow authenticated users to update prospects" ON public.prospects;
DROP POLICY IF EXISTS "Allow authenticated users to delete prospects" ON public.prospects;

-- RLS Policies
-- Allow anyone to submit an inquiry anonymously (for public form)
CREATE POLICY "Allow public insert to prospects" ON public.prospects 
  FOR INSERT WITH CHECK (true);

-- Allow admins/authenticated users to view and manage prospect cards in the Kanban
CREATE POLICY "Allow authenticated users to read prospects" ON public.prospects 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update prospects" ON public.prospects 
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete prospects" ON public.prospects 
  FOR DELETE TO authenticated USING (true);

-- Index for school_id and created_at
CREATE INDEX IF NOT EXISTS idx_prospects_school_id ON public.prospects(school_id);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON public.prospects(created_at);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
