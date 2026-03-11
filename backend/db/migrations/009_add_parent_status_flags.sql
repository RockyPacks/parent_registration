-- ============================================================================
-- Add Parent Status Flags Migration
-- Tracks whether parent information is complete and verified
-- ============================================================================

-- Add status fields to parents table
ALTER TABLE public.parents
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_parents_is_complete ON public.parents(is_complete);
CREATE INDEX IF NOT EXISTS idx_parents_is_primary ON public.parents(is_primary);

-- Add comment for clarity
COMMENT ON COLUMN public.parents.is_complete IS 'Set to TRUE when parent information is fully filled in and saved';
COMMENT ON COLUMN public.parents.is_primary IS 'Set to TRUE for the primary/responsible parent for this application';
COMMENT ON COLUMN public.parents.verified_at IS 'Timestamp when parent information was last verified/updated';
