-- ============================================================================
-- CONSOLIDATED MASTER DATABASE SCHEMA TEMPLATE
-- Parent Registration System Complete Database Migration
-- Includes every table, field, index, trigger, and Row-Level Security (RLS) policy
-- ============================================================================

-- ============================================================================
-- 1. ENUMS, TYPES, AND FUNCTIONS
-- ============================================================================

-- Application Status Enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE application_status AS ENUM (
      'pending',
      'in_progress',
      'submitted',
      'approved',
      'rejected',
      'completed'
    );
  END IF;
END $$;

-- Shared timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- Applications Table (Root Entity)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  proposed_start_term TEXT,
  year TEXT,
  grade_applying_for TEXT,
  proposed_start_date DATE,
  
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Students Table (One per Application, nullable fields to support partial auto-saves)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  surname TEXT,
  first_name TEXT,
  middle_name TEXT,
  preferred_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  home_language TEXT,
  id_number TEXT,
  previous_grade TEXT,
  grade_applied_for TEXT,
  previous_school TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT students_application_id_unique UNIQUE (application_id),
  
  CONSTRAINT students_gender_check CHECK (
    gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  CONSTRAINT students_id_number_check CHECK (
    id_number IS NULL OR id_number ~ '^\d{13}$'
  ),
  CONSTRAINT students_phone_check CHECK (
    phone IS NULL OR phone ~ '^\+?[\d\s\-\(\)]+$'
  )
);

-- Medical Info Table (One per Application)
CREATE TABLE IF NOT EXISTS public.medical_info (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  medical_aid_name TEXT,
  member_number TEXT,
  conditions TEXT[] DEFAULT '{}',
  allergies TEXT,
  religion TEXT,
  home_language TEXT,
  allergy_action_required TEXT,
  allergy_status TEXT,
  immunisations_up_to_date TEXT,
  learner_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  medicine_not_to_administer TEXT,
  medical_aid_scheme TEXT,
  medical_aid_number TEXT,
  primary_member_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT medical_info_pkey PRIMARY KEY (id),
  CONSTRAINT medical_info_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT medical_info_application_id_unique UNIQUE (application_id)
);

-- Parents & Guardians Table (One per Application)
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  father_surname TEXT,
  father_first_name TEXT,
  father_id_number TEXT,
  father_mobile TEXT,
  father_email TEXT,
  mother_surname TEXT,
  mother_first_name TEXT,
  mother_id_number TEXT,
  mother_mobile TEXT,
  mother_email TEXT,
  next_of_kin_surname TEXT,
  next_of_kin_first_name TEXT,
  next_of_kin_relationship TEXT,
  next_of_kin_mobile TEXT,
  next_of_kin_email TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT parents_pkey PRIMARY KEY (id),
  CONSTRAINT parents_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT parents_application_id_unique UNIQUE (application_id)
);

-- Next of Kin Table (Multiple per Application)
CREATE TABLE IF NOT EXISTS public.next_of_kin (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  id_number TEXT,
  relationship TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email_address TEXT NOT NULL,
  phone_number TEXT,
  alternate_mobile TEXT,
  physical_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT next_of_kin_pkey PRIMARY KEY (id),
  CONSTRAINT next_of_kin_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE
);

-- Fee Responsibility Table (One per Application)
CREATE TABLE IF NOT EXISTS public.fee_responsibility (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  fee_person TEXT NOT NULL,
  relationship TEXT NOT NULL,
  fee_terms_accepted BOOLEAN DEFAULT FALSE,
  selected_plan TEXT,
  parent_id_number TEXT,
  parent_first_name TEXT,
  parent_surname TEXT,
  parent_email TEXT,
  parent_mobile TEXT,
  bank_name TEXT,
  branch_code TEXT,
  account_number TEXT,
  account_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fee_responsibility_pkey PRIMARY KEY (id),
  CONSTRAINT fee_responsibility_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT fee_responsibility_application_id_unique UNIQUE (application_id)
);

-- Academic History Table (Multiple per Application)
CREATE TABLE IF NOT EXISTS public.academic_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  school_name TEXT NOT NULL,
  school_type TEXT NOT NULL,
  last_grade_completed TEXT NOT NULL,
  academic_year_completed TEXT NOT NULL,
  reason_for_leaving TEXT,
  principal_name TEXT,
  school_phone_number TEXT,
  school_email TEXT,
  school_address TEXT,
  additional_notes TEXT,
  report_card_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT academic_history_pkey PRIMARY KEY (id),
  CONSTRAINT academic_history_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE
);

-- Declarations Table (One per Application)
CREATE TABLE IF NOT EXISTS public.declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  agree_truth BOOLEAN DEFAULT FALSE,
  agree_policies BOOLEAN DEFAULT FALSE,
  agree_financial BOOLEAN DEFAULT FALSE,
  agree_verification BOOLEAN DEFAULT FALSE,
  agree_data_processing BOOLEAN DEFAULT FALSE,
  agree_audit_storage BOOLEAN DEFAULT FALSE,
  agree_affordability_processing BOOLEAN DEFAULT FALSE,
  full_name TEXT,
  city TEXT,
  date_signed TEXT,
  status TEXT DEFAULT 'in_progress',
  signature_image TEXT, -- Base64 digital signature
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT declarations_pkey PRIMARY KEY (id),
  CONSTRAINT declarations_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT declarations_application_id_unique UNIQUE (application_id)
);

-- Financing Selections Table (One per Application)
CREATE TABLE IF NOT EXISTS public.financing_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  plan_type TEXT NOT NULL,
  discount_rate DECIMAL(5, 2),
  cost_of_credit DECIMAL(10, 2),
  repayment_term TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT financing_selections_pkey PRIMARY KEY (id),
  CONSTRAINT financing_selections_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE
);

-- Application Documents Table (Legacy/Alternative Documents Table)
CREATE TABLE IF NOT EXISTS public.application_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT application_documents_pkey PRIMARY KEY (id),
  CONSTRAINT application_documents_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE
);

-- Uploaded Files Table (Primary Storage Reference Table)
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

-- School Fees Table
CREATE TABLE IF NOT EXISTS public.school_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL UNIQUE,
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

-- ============================================================================
-- 3. VIEWS
-- ============================================================================

-- Create document upload summary view
CREATE OR REPLACE VIEW public.application_upload_summary AS
SELECT 
  application_id,
  COUNT(*) as total_files,
  SUM(file_size) as total_bytes,
  
  -- Type Counts
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
  
  -- Overall Completion Check
  CASE 
    WHEN COUNT(*) FILTER (WHERE document_type IN ('proof_of_address', 'proof-of-address')) >= 1 
         AND COUNT(*) FILTER (WHERE document_type IN ('id_document', 'parent-guardian-id', 'learner-birth-certificate')) >= 2
         AND COUNT(*) FILTER (WHERE document_type IN ('payslip', 'latest-payslip', 'previous-payslip')) >= 3
         AND COUNT(*) FILTER (WHERE document_type IN ('bank_statement', 'bank-statements')) >= 1
    THEN true 
    ELSE false 
  END as is_complete,
  
  -- Category checks
  CASE WHEN COUNT(*) FILTER (WHERE document_type IN ('proof_of_address', 'proof-of-address')) >= 1 THEN true ELSE false END as proof_of_address_complete,
  CASE WHEN COUNT(*) FILTER (WHERE document_type IN ('id_document', 'parent-guardian-id', 'learner-birth-certificate', 'spouse-id')) >= 2 THEN true ELSE false END as id_documents_complete,
  CASE WHEN COUNT(*) FILTER (WHERE document_type IN ('payslip', 'latest-payslip', 'previous-payslip', 'third-payslip')) >= 3 THEN true ELSE false END as payslips_complete,
  CASE WHEN COUNT(*) FILTER (WHERE document_type IN ('bank_statement', 'bank-statements')) >= 1 THEN true ELSE false END as bank_statements_complete,
  
  MAX(created_at) as last_upload_at,
  MIN(created_at) as first_upload_at,
  MAX(updated_at) as last_updated_at
FROM public.uploaded_files
GROUP BY application_id;

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_students_application_id ON public.students(application_id);
CREATE INDEX IF NOT EXISTS idx_medical_info_application_id ON public.medical_info(application_id);
CREATE INDEX IF NOT EXISTS idx_parents_application_id ON public.parents(application_id);
CREATE INDEX IF NOT EXISTS idx_parents_is_complete ON public.parents(is_complete);
CREATE INDEX IF NOT EXISTS idx_parents_is_primary ON public.parents(is_primary);
CREATE INDEX IF NOT EXISTS idx_next_of_kin_application_id ON public.next_of_kin(application_id);
CREATE INDEX IF NOT EXISTS idx_fee_responsibility_application_id ON public.fee_responsibility(application_id);
CREATE INDEX IF NOT EXISTS idx_academic_history_application_id ON public.academic_history(application_id);
CREATE INDEX IF NOT EXISTS idx_declarations_application_id ON public.declarations(application_id);
CREATE INDEX IF NOT EXISTS idx_financing_selections_application_id ON public.financing_selections(application_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON public.application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_type ON public.application_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_application_id ON public.uploaded_files(application_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_document_type ON public.uploaded_files(document_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON public.uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_school_fees_grade ON public.school_fees(grade);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

CREATE OR REPLACE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_medical_info_updated_at
  BEFORE UPDATE ON public.medical_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON public.parents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_next_of_kin_updated_at
  BEFORE UPDATE ON public.next_of_kin
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_fee_responsibility_updated_at
  BEFORE UPDATE ON public.fee_responsibility
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_academic_history_updated_at
  BEFORE UPDATE ON public.academic_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_declarations_updated_at
  BEFORE UPDATE ON public.declarations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_financing_selections_updated_at
  BEFORE UPDATE ON public.financing_selections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_application_documents_updated_at
  BEFORE UPDATE ON public.application_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_uploaded_files_updated_at
  BEFORE UPDATE ON public.uploaded_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_update_school_fees_timestamp
  BEFORE UPDATE ON public.school_fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_of_kin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_responsibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financing_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;

-- Applications Policies
CREATE POLICY "Users can view their own applications" ON public.applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own applications" ON public.applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own applications" ON public.applications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Students Policies
CREATE POLICY "Users can view their own students" ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own students" ON public.students FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own students" ON public.students FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own students" ON public.students FOR DELETE USING (user_id = auth.uid());

-- Medical Info Policies
CREATE POLICY "Users can view their own medical info" ON public.medical_info FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.medical_info.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can insert their own medical info" ON public.medical_info FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.medical_info.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can update their own medical info" ON public.medical_info FOR UPDATE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.medical_info.application_id AND public.applications.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.medical_info.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can delete their own medical info" ON public.medical_info FOR DELETE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.medical_info.application_id AND public.applications.user_id = auth.uid()));

-- Parents Policies
CREATE POLICY "Users can view their own parents" ON public.parents FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.parents.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can insert their own parents" ON public.parents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.parents.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can update their own parents" ON public.parents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.parents.application_id AND public.applications.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.parents.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can delete their own parents" ON public.parents FOR DELETE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.parents.application_id AND public.applications.user_id = auth.uid()));

-- Next of Kin Policies
CREATE POLICY "Users can view their own next of kin" ON public.next_of_kin FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.next_of_kin.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can insert their own next of kin" ON public.next_of_kin FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.next_of_kin.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can update their own next of kin" ON public.next_of_kin FOR UPDATE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.next_of_kin.application_id AND public.applications.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.next_of_kin.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can delete their own next of kin" ON public.next_of_kin FOR DELETE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.next_of_kin.application_id AND public.applications.user_id = auth.uid()));

-- Fee Responsibility Policies
CREATE POLICY "Users can view their own fee responsibility" ON public.fee_responsibility FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.fee_responsibility.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can insert their own fee responsibility" ON public.fee_responsibility FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.fee_responsibility.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can update their own fee responsibility" ON public.fee_responsibility FOR UPDATE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.fee_responsibility.application_id AND public.applications.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.fee_responsibility.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can delete their own fee responsibility" ON public.fee_responsibility FOR DELETE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.fee_responsibility.application_id AND public.applications.user_id = auth.uid()));

-- Academic History Policies
CREATE POLICY "Users can view their own academic history" ON public.academic_history FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.academic_history.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can insert their own academic history" ON public.academic_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.academic_history.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can update their own academic history" ON public.academic_history FOR UPDATE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.academic_history.application_id AND public.applications.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.academic_history.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can delete their own academic history" ON public.academic_history FOR DELETE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.academic_history.application_id AND public.applications.user_id = auth.uid()));

-- Declarations Policies
CREATE POLICY "Users can view their own declarations" ON public.declarations FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.declarations.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can insert their own declarations" ON public.declarations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.declarations.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can update their own declarations" ON public.declarations FOR UPDATE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.declarations.application_id AND public.applications.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.declarations.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can delete their own declarations" ON public.declarations FOR DELETE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.declarations.application_id AND public.applications.user_id = auth.uid()));

-- Financing Selections Policies
CREATE POLICY "Users can view their own financing selections" ON public.financing_selections FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.financing_selections.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can insert their own financing selections" ON public.financing_selections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.financing_selections.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can update their own financing selections" ON public.financing_selections FOR UPDATE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.financing_selections.application_id AND public.applications.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.financing_selections.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can delete their own financing selections" ON public.financing_selections FOR DELETE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.financing_selections.application_id AND public.applications.user_id = auth.uid()));

-- Application Documents Policies
CREATE POLICY "Users can view their own application documents" ON public.application_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.application_documents.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can insert their own application documents" ON public.application_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.application_documents.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can update their own application documents" ON public.application_documents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.application_documents.application_id AND public.applications.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.application_documents.application_id AND public.applications.user_id = auth.uid()));
CREATE POLICY "Users can delete their own application documents" ON public.application_documents FOR DELETE USING (EXISTS (SELECT 1 FROM public.applications WHERE public.applications.id = public.application_documents.application_id AND public.applications.user_id = auth.uid()));

-- Uploaded Files Policies
CREATE POLICY "Users can view own uploaded files" ON public.uploaded_files FOR SELECT TO authenticated USING (uploaded_by = auth.uid());
CREATE POLICY "Users can insert own files" ON public.uploaded_files FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users can delete own files" ON public.uploaded_files FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- School Fees Policies (Read-Only)
CREATE POLICY "Authenticated users can view fees" ON public.school_fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public can view fees" ON public.school_fees FOR SELECT TO anon USING (true);

-- ============================================================================
-- 7. INITIAL/SEED DATA (Links Combined College Fee Schedule 2026)
-- ============================================================================

INSERT INTO public.school_fees (grade, annual_fee, term_fee, registration_fee, re_registration_fee, sport_fee) 
VALUES 
  ('Grade R', 14400, 3600, 800, 400, 0),
  ('Grade 1', 20400, 5100, 800, 400, 0),
  ('Grade 2', 20400, 5100, 800, 400, 0),
  ('Grade 3', 20400, 5100, 800, 400, 0),
  ('Grade 4', 20400, 5100, 800, 400, 0),
  ('Grade 5', 20400, 5100, 800, 400, 0),
  ('Grade 6', 20400, 5100, 800, 400, 0),
  ('Grade 7', 26400, 6600, 800, 400, 0),
  ('Grade 8', 26400, 6600, 800, 400, 0),
  ('Grade 9', 26400, 6600, 800, 400, 0),
  ('Grade 10', 30000, 7500, 800, 400, 0),
  ('Grade 11', 30000, 7500, 800, 400, 0),
  ('Grade 12', 32400, 8100, 800, 400, 0)
ON CONFLICT (grade) DO UPDATE SET
  annual_fee = EXCLUDED.annual_fee,
  term_fee = EXCLUDED.term_fee,
  registration_fee = EXCLUDED.registration_fee,
  re_registration_fee = EXCLUDED.re_registration_fee,
  sport_fee = EXCLUDED.sport_fee,
  updated_at = NOW();

-- Auth Grants
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
