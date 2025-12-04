-- =============================================
-- Uploaded Files Table and Summary View Migration
-- Creates uploaded_files table and aggregation view
-- =============================================

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  download_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uploaded_files_pkey PRIMARY KEY (id),
  CONSTRAINT uploaded_files_application_id_fkey FOREIGN KEY (application_id) 
    REFERENCES public.applications (id) ON DELETE CASCADE,
  CONSTRAINT uploaded_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) 
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_uploaded_files_application_id 
  ON public.uploaded_files USING btree (application_id);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_document_type 
  ON public.uploaded_files USING btree (document_type);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by 
  ON public.uploaded_files USING btree (uploaded_by);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_uploaded_files_updated_at ON public.uploaded_files;
CREATE TRIGGER update_uploaded_files_updated_at 
  BEFORE UPDATE ON public.uploaded_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own uploaded files
DROP POLICY IF EXISTS "Users can view own uploaded files" ON public.uploaded_files;
CREATE POLICY "Users can view own uploaded files" ON public.uploaded_files
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Policy: Users can insert their own files
DROP POLICY IF EXISTS "Users can insert own files" ON public.uploaded_files;
CREATE POLICY "Users can insert own files" ON public.uploaded_files
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can delete their own files
DROP POLICY IF EXISTS "Users can delete own files" ON public.uploaded_files;
CREATE POLICY "Users can delete own files" ON public.uploaded_files
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- =============================================
-- CREATE AGGREGATION VIEW FOR DOCUMENT SUMMARY
-- This view provides a single row per application with counts for each document type
-- =============================================

CREATE OR REPLACE VIEW public.application_upload_summary AS
SELECT 
  application_id,
  
  -- Total counts
  COUNT(*) as total_files,
  SUM(file_size) as total_bytes,
  
  -- Document type counts (based on your actual document types)
  COUNT(*) FILTER (WHERE document_type = 'proof_of_address') as count_proof_of_address,
  COUNT(*) FILTER (WHERE document_type = 'id_document') as count_id_document,
  COUNT(*) FILTER (WHERE document_type = 'proof-of-address') as count_proof_of_address_alt,
  COUNT(*) FILTER (WHERE document_type = 'parent-guardian-id') as count_parent_guardian_id,
  COUNT(*) FILTER (WHERE document_type = 'learner-birth-certificate') as count_learner_birth_certificate,
  COUNT(*) FILTER (WHERE document_type = 'spouse-id') as count_spouse_id,
  COUNT(*) FILTER (WHERE document_type = 'optional-document') as count_optional_document,
  COUNT(*) FILTER (WHERE document_type = 'latest-payslip') as count_latest_payslip,
  COUNT(*) FILTER (WHERE document_type = 'previous-payslip') as count_previous_payslip,
  COUNT(*) FILTER (WHERE document_type = 'third-payslip') as count_third_payslip,
  COUNT(*) FILTER (WHERE document_type = 'payslip') as count_payslip,
  COUNT(*) FILTER (WHERE document_type = 'bank-statements') as count_bank_statements,
  COUNT(*) FILTER (WHERE document_type = 'bank_statement') as count_bank_statement,
  COUNT(*) FILTER (WHERE document_type = 'academic_history') as count_academic_history,
  
  -- Completion logic: Check if required document types are present
  -- Adjust these requirements based on your business rules
  CASE 
    WHEN COUNT(*) FILTER (WHERE document_type IN ('proof_of_address', 'proof-of-address')) >= 1 
         AND COUNT(*) FILTER (WHERE document_type IN ('id_document', 'parent-guardian-id', 'learner-birth-certificate')) >= 2
         AND COUNT(*) FILTER (WHERE document_type IN ('payslip', 'latest-payslip', 'previous-payslip')) >= 3
         AND COUNT(*) FILTER (WHERE document_type IN ('bank_statement', 'bank-statements')) >= 1
    THEN true 
    ELSE false 
  END as is_complete,
  
  -- Category completion checks
  CASE WHEN COUNT(*) FILTER (WHERE document_type IN ('proof_of_address', 'proof-of-address')) >= 1 
    THEN true ELSE false END as proof_of_address_complete,
  
  CASE WHEN COUNT(*) FILTER (WHERE document_type IN ('id_document', 'parent-guardian-id', 'learner-birth-certificate', 'spouse-id')) >= 2 
    THEN true ELSE false END as id_documents_complete,
  
  CASE WHEN COUNT(*) FILTER (WHERE document_type IN ('payslip', 'latest-payslip', 'previous-payslip', 'third-payslip')) >= 3 
    THEN true ELSE false END as payslips_complete,
  
  CASE WHEN COUNT(*) FILTER (WHERE document_type IN ('bank_statement', 'bank-statements')) >= 1 
    THEN true ELSE false END as bank_statements_complete,
  
  -- Timestamps
  MAX(created_at) as last_upload_at,
  MIN(created_at) as first_upload_at,
  MAX(updated_at) as last_updated_at

FROM public.uploaded_files
GROUP BY application_id;

-- Add comments for documentation
COMMENT ON TABLE public.uploaded_files IS 
  'Stores metadata for all uploaded files linked to applications. Each file is a separate row.';

COMMENT ON COLUMN public.uploaded_files.application_id IS 
  'Foreign key to applications table';

COMMENT ON COLUMN public.uploaded_files.document_type IS 
  'Type of document (e.g., proof_of_address, id_document, payslip, bank_statement)';

COMMENT ON COLUMN public.uploaded_files.bucket_name IS 
  'Storage bucket name in Supabase Storage';

COMMENT ON COLUMN public.uploaded_files.file_path IS 
  'Full path to file in storage bucket';

COMMENT ON COLUMN public.uploaded_files.download_url IS 
  'Public or signed URL for downloading the file';

COMMENT ON VIEW public.application_upload_summary IS 
  'Aggregated view showing document upload counts and completion status per application. This provides a single row per application_id with counts for each document type, making it easy to check upload progress without counting rows in the application layer.';

-- =============================================
-- EXAMPLE QUERIES
-- =============================================

-- Get upload summary for a specific application:
-- SELECT * FROM public.application_upload_summary WHERE application_id = 'your-uuid-here';

-- Find all applications with complete uploads:
-- SELECT application_id, total_files, last_upload_at 
-- FROM public.application_upload_summary 
-- WHERE is_complete = true;

-- Find applications missing proof of address:
-- SELECT application_id, count_proof_of_address 
-- FROM public.application_upload_summary 
-- WHERE proof_of_address_complete = false;

-- Get all incomplete applications with details:
-- SELECT 
--   a.application_id,
--   a.total_files,
--   a.is_complete,
--   a.proof_of_address_complete,
--   a.id_documents_complete,
--   a.payslips_complete,
--   a.bank_statements_complete
-- FROM public.application_upload_summary a
-- WHERE a.is_complete = false;
