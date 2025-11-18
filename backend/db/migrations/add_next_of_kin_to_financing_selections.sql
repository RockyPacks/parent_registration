-- Add next_of_kin fields to financing_selections table
-- This consolidates family information into the financing selections table

ALTER TABLE public.financing_selections
ADD COLUMN IF NOT EXISTS next_of_kin_surname TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_first_name TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_mobile TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_email TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.financing_selections.next_of_kin_surname IS 'Next of kin surname';
COMMENT ON COLUMN public.financing_selections.next_of_kin_first_name IS 'Next of kin first name';
COMMENT ON COLUMN public.financing_selections.next_of_kin_relationship IS 'Next of kin relationship to student';
COMMENT ON COLUMN public.financing_selections.next_of_kin_mobile IS 'Next of kin mobile number';
COMMENT ON COLUMN public.financing_selections.next_of_kin_email IS 'Next of kin email address';

-- Add validation constraints
ALTER TABLE public.financing_selections
ADD CONSTRAINT next_of_kin_mobile_format CHECK (
  next_of_kin_mobile IS NULL OR
  next_of_kin_mobile ~ '^[\+]?[0-9\s\-\(\)]+$'
),
ADD CONSTRAINT next_of_kin_email_format CHECK (
  next_of_kin_email IS NULL OR
  next_of_kin_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
);

-- Create index for better query performance on application_id
CREATE INDEX IF NOT EXISTS idx_financing_selections_next_of_kin_lookup
ON public.financing_selections (application_id)
WHERE next_of_kin_surname IS NOT NULL;
