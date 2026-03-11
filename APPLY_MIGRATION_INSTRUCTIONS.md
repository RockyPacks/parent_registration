# MIGRATION: Add Parent Status Flags
# File: backend/db/migrations/009_add_parent_status_flags.sql
#
# This migration adds parent completion tracking to the parents table.
# It enables the system to identify when parent information is complete and who the primary fee payer is.
#
# HOW TO APPLY:
#
# Option 1: Supabase SQL Editor (Recommended - GUI based)
# ========================================================
# 1. Open https://supabase.com/dashboard
# 2. Select your project
# 3. Click "SQL Editor" on the left sidebar  
# 4. Click "+ Create a new query" or "+ New Snippet"
# 5. Copy and paste the SQL below
# 6. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)
# 7. Verify success - you should see "Query successful" message
#
# Option 2: Using Command Line (psycopg2)
# ========================================
# 1. Install: pip install psycopg2-binary
# 2. Get your Supabase connection string:
#    - Go to Settings > Database > Connection pooling > Connection string
#    - Copy the URI (looks like: postgresql://postgres:...")
# 3. Run: export DATABASE_URL="<paste_connection_string>"
# 4. Execute: python3 apply_migrations.py
#
# Option 3: Using DBeaver or pgAdmin
# ===================================
# 1. Connect to your Supabase database with these details:
#    - Host: [project-id].supabase.co (but use the actual database host)
#    - Port: 5432
#    - Database: postgres
#    - Username: postgres
#    - Password: (from Supabase settings)
# 2. Open a new SQL query window
# 3. Paste the SQL below
# 4. Execute
#
# ============================================================================
# SQL MIGRATION CODE - Copy and paste this into Supabase SQL Editor:
# ============================================================================

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

-- ============================================================================
# END OF MIGRATION
# ============================================================================
#
# VERIFICATION:
# After running the migration, verify it was applied successfully:
#
# 1. In Supabase SQL Editor, run this query to verify columns were added:
#    SELECT column_name, data_type, is_nullable 
#    FROM information_schema.columns 
#    WHERE table_name = 'parents' 
#    ORDER BY ordinal_position;
#
# 2. Verify indexes were created:
#    SELECT indexname FROM pg_indexes WHERE tablename = 'parents';
#
# WHAT THIS DOES:
# ===============
# This migration adds three new columns to the parents table:
#
# 1. is_complete (BOOLEAN): Tracks whether a parent has provided all required information
#    - Set to TRUE automatically when: surname, first_name, id_number, mobile, and email are all filled
#    - Updated by the backend whenever parent data is saved
#
# 2. is_primary (BOOLEAN): Marks the parent responsible for paying school fees  
#    - Set to TRUE for the parent specified in fee_responsibility.relationship
#    - Automatically managed by backend's update_parent_status_flags() function
#
# 3. verified_at (TIMESTAMP WITH TIME ZONE): When the parent data was last saved
#    - Set to current timestamp whenever parent information is updated
#    - Useful for tracking when applications were last worked on
#
# BACKEND INTEGRATION:
# ====================
# The backend has been updated to automatically manage these flags:
# - When parent data is saved via auto-save or submit-enrollment
# - The backend calls: enrollment_repository.update_parent_status_flags(application_id)
# - This function checks if each parent has all required fields
# - It also determines which parent is the fee payer and marks them as primary
#
# This enables the frontend to display:
# ✓ Visual indicators when parent information is complete
# ✓ Which parent is the fee-responsible party
# ✓ Status of application parent information completion
