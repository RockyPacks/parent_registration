-- ============================================================================
-- MASTER SCHEMA MIGRATION
-- Consolidated database schema for Parent Registration System
-- Date: December 1, 2025
-- ============================================================================

-- ============================================================================
-- ENUMS & TYPES
-- ============================================================================

-- Application Status
CREATE TYPE application_status AS ENUM (
  'pending',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
  'completed'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  preferred_name TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  home_language TEXT NOT NULL,
  id_number TEXT NOT NULL,
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
  -- NOTE: Database only validates format (13 digits). Application layer validates
  -- Luhn checksum and date of birth. See app/core/validators.py for full validation.
  CONSTRAINT students_id_number_check CHECK (id_number ~ '^\d{13}$'),
  CONSTRAINT students_gender_check CHECK (
    gender IN ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  CONSTRAINT students_phone_check CHECK (
    phone IS NULL OR phone ~ '^\+?[\d\s\-\(\)]+$'
  )
);

-- Medical Info Table
CREATE TABLE IF NOT EXISTS public.medical_info (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  medical_aid_name TEXT,
  member_number TEXT,
  conditions TEXT[] DEFAULT '{}',
  allergies TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT medical_info_pkey PRIMARY KEY (id),
  CONSTRAINT medical_info_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT medical_info_application_id_unique UNIQUE (application_id)
);

-- Family Info / Parents Table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT parents_pkey PRIMARY KEY (id),
  CONSTRAINT parents_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT parents_application_id_unique UNIQUE (application_id)
);

-- Next of Kin Table
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

-- Fee Responsibility Table
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

-- Academic History Table
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

-- Declarations Table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT declarations_pkey PRIMARY KEY (id),
  CONSTRAINT declarations_application_id_fkey FOREIGN KEY (application_id)
    REFERENCES public.applications(id) ON DELETE CASCADE,
  CONSTRAINT declarations_application_id_unique UNIQUE (application_id)
);

-- Financing Selections Table
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

-- Documents Table
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

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_applications_user_id 
  ON public.applications(user_id);

CREATE INDEX IF NOT EXISTS idx_applications_status 
  ON public.applications(status);

CREATE INDEX IF NOT EXISTS idx_students_application_id 
  ON public.students(application_id);

CREATE INDEX IF NOT EXISTS idx_medical_info_application_id 
  ON public.medical_info(application_id);

CREATE INDEX IF NOT EXISTS idx_parents_application_id 
  ON public.parents(application_id);

CREATE INDEX IF NOT EXISTS idx_next_of_kin_application_id 
  ON public.next_of_kin(application_id);

CREATE INDEX IF NOT EXISTS idx_fee_responsibility_application_id 
  ON public.fee_responsibility(application_id);

CREATE INDEX IF NOT EXISTS idx_academic_history_application_id 
  ON public.academic_history(application_id);

CREATE INDEX IF NOT EXISTS idx_declarations_application_id 
  ON public.declarations(application_id);

CREATE INDEX IF NOT EXISTS idx_financing_selections_application_id 
  ON public.financing_selections(application_id);

CREATE INDEX IF NOT EXISTS idx_application_documents_application_id 
  ON public.application_documents(application_id);

CREATE INDEX IF NOT EXISTS idx_application_documents_type 
  ON public.application_documents(document_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_info_updated_at
  BEFORE UPDATE ON public.medical_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON public.parents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_next_of_kin_updated_at
  BEFORE UPDATE ON public.next_of_kin
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_responsibility_updated_at
  BEFORE UPDATE ON public.fee_responsibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_history_updated_at
  BEFORE UPDATE ON public.academic_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_declarations_updated_at
  BEFORE UPDATE ON public.declarations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financing_selections_updated_at
  BEFORE UPDATE ON public.financing_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_documents_updated_at
  BEFORE UPDATE ON public.application_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
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

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
CREATE POLICY "Users can view their own applications" ON public.applications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own applications" ON public.applications;
CREATE POLICY "Users can insert their own applications" ON public.applications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
CREATE POLICY "Users can update their own applications" ON public.applications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Similar policies for related tables
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;
CREATE POLICY "Users can view their own students" ON public.students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.students.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own students" ON public.students;
CREATE POLICY "Users can insert their own students" ON public.students
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.students.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own students" ON public.students;
CREATE POLICY "Users can update their own students" ON public.students
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.students.application_id
      AND public.applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.students.application_id
      AND public.applications.user_id = auth.uid()
    )
  );
