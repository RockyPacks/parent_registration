--- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    documents_completed BOOLEAN DEFAULT FALSE,
    declaration_step_status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    submitted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    surname VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    preferred_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    home_language VARCHAR(50) NOT NULL,
    id_number VARCHAR(20) UNIQUE NOT NULL,
    previous_grade VARCHAR(20) NOT NULL,
    grade_applied_for VARCHAR(20) NOT NULL,
    previous_school VARCHAR(200) NOT NULL,
    PRIMARY KEY (application_id)
);

-- Create medical_info table
CREATE TABLE IF NOT EXISTS medical_info (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    medical_aid_name VARCHAR(100),
    member_number VARCHAR(50),
    conditions TEXT[],
    allergies TEXT,
    PRIMARY KEY (application_id)
);

-- Create family_info table
CREATE TABLE IF NOT EXISTS family_info (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    father_surname VARCHAR(100) NOT NULL,
    father_first_name VARCHAR(100) NOT NULL,
    father_id_number VARCHAR(20) NOT NULL,
    father_mobile VARCHAR(15) NOT NULL,
    father_email VARCHAR(150) NOT NULL,
    mother_surname VARCHAR(100) NOT NULL,
    mother_first_name VARCHAR(100) NOT NULL,
    mother_id_number VARCHAR(20) NOT NULL,
    mother_mobile VARCHAR(15) NOT NULL,
    mother_email VARCHAR(150) NOT NULL,
    PRIMARY KEY (application_id)
);

-- Create fee_responsibility table
CREATE TABLE IF NOT EXISTS fee_responsibility (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    fee_person VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    fee_terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (application_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    bucket_name VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    download_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by VARCHAR(100)
);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_applications_status;
CREATE INDEX idx_applications_status ON applications(status);
DROP INDEX IF EXISTS idx_applications_created_at;
CREATE INDEX idx_applications_created_at ON applications(created_at);
DROP INDEX IF EXISTS idx_documents_application_id;
CREATE INDEX idx_documents_application_id ON documents(application_id);
DROP INDEX IF EXISTS idx_documents_document_type;
CREATE INDEX idx_documents_document_type ON documents(document_type);

-- Enable Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_responsibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication setup)
-- For now, allow all operations (you should restrict based on user roles)
DROP POLICY IF EXISTS "Allow all operations on applications" ON applications;
CREATE POLICY "Allow all operations on applications" ON applications FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on students" ON students;
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on medical_info" ON medical_info;
CREATE POLICY "Allow all operations on medical_info" ON medical_info FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on family_info" ON family_info;
CREATE POLICY "Allow all operations on family_info" ON family_info FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on fee_responsibility" ON fee_responsibility;
CREATE POLICY "Allow all operations on fee_responsibility" ON fee_responsibility FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;
CREATE POLICY "Allow all operations on documents" ON documents FOR ALL USING (true);

-- Create dedicated storage buckets for different document types
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('proof_of_address', 'proof_of_address', false),
  ('id_documents', 'id_documents', false),
  ('payslips', 'payslips', false),
  ('bank_statements', 'bank_statements', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for each bucket - owner and admin access
DROP POLICY IF EXISTS "Users can upload their own files to proof_of_address" ON storage.objects;
CREATE POLICY "Users can upload their own files to proof_of_address" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'proof_of_address' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can view their own files in proof_of_address" ON storage.objects;
CREATE POLICY "Users can view their own files in proof_of_address" ON storage.objects
FOR SELECT USING (bucket_id = 'proof_of_address' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can delete their own files in proof_of_address" ON storage.objects;
CREATE POLICY "Users can delete their own files in proof_of_address" ON storage.objects
FOR DELETE USING (bucket_id = 'proof_of_address' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can upload their own files to id_documents" ON storage.objects;
CREATE POLICY "Users can upload their own files to id_documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'id_documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can view their own files in id_documents" ON storage.objects;
CREATE POLICY "Users can view their own files in id_documents" ON storage.objects
FOR SELECT USING (bucket_id = 'id_documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can delete their own files in id_documents" ON storage.objects;
CREATE POLICY "Users can delete their own files in id_documents" ON storage.objects
FOR DELETE USING (bucket_id = 'id_documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can upload their own files to payslips" ON storage.objects;
CREATE POLICY "Users can upload their own files to payslips" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payslips' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can view their own files in payslips" ON storage.objects;
CREATE POLICY "Users can view their own files in payslips" ON storage.objects
FOR SELECT USING (bucket_id = 'payslips' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can delete their own files in payslips" ON storage.objects;
CREATE POLICY "Users can delete their own files in payslips" ON storage.objects
FOR DELETE USING (bucket_id = 'payslips' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can upload their own files to bank_statements" ON storage.objects;
CREATE POLICY "Users can upload their own files to bank_statements" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bank_statements' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can view their own files in bank_statements" ON storage.objects;
CREATE POLICY "Users can view their own files in bank_statements" ON storage.objects
FOR SELECT USING (bucket_id = 'bank_statements' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

DROP POLICY IF EXISTS "Users can delete their own files in bank_statements" ON storage.objects;
CREATE POLICY "Users can delete their own files in bank_statements" ON storage.objects
FOR DELETE USING (bucket_id = 'bank_statements' AND (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'school_admin'));

-- Create application_documents table for upload metadata and completion tracking
CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('proof_of_address', 'id_document', 'payslip', 'bank_statement')),
  file_url TEXT NOT NULL,
  upload_status TEXT DEFAULT 'in_progress' CHECK (upload_status IN ('in_progress', 'completed')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on application_documents
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for application_documents
DROP POLICY IF EXISTS "Users can view their own application documents" ON application_documents;
CREATE POLICY "Users can view their own application documents" ON application_documents
FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'school_admin');

DROP POLICY IF EXISTS "Users can insert their own application documents" ON application_documents;
CREATE POLICY "Users can insert their own application documents" ON application_documents
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own application documents" ON application_documents;
CREATE POLICY "Users can update their own application documents" ON application_documents
FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'school_admin');

-- Create view for application upload summary
CREATE OR REPLACE VIEW application_upload_summary AS
SELECT
  application_id,
  COUNT(DISTINCT document_type) FILTER (WHERE upload_status = 'completed') AS completed_categories,
  ARRAY_AGG(DISTINCT document_type ORDER BY document_type) FILTER (WHERE upload_status = 'completed') AS uploaded_types
FROM application_documents
GROUP BY application_id;

-- Create function to mark upload complete
CREATE OR REPLACE FUNCTION mark_upload_complete(app_id UUID, doc_type TEXT)
RETURNS VOID AS $$
UPDATE application_documents
SET upload_status = 'completed'
WHERE application_id = app_id AND document_type = doc_type;
$$ LANGUAGE SQL;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for applications table
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create academic_history table
CREATE TABLE IF NOT EXISTS academic_history (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    school_name VARCHAR(200) NOT NULL,
    school_type VARCHAR(50),
    last_grade_completed VARCHAR(20) NOT NULL,
    academic_year_completed VARCHAR(20) NOT NULL,
    reason_for_leaving TEXT,
    principal_name VARCHAR(100),
    school_phone_number VARCHAR(15),
    school_email VARCHAR(150),
    school_address TEXT,
    report_card_url TEXT,
    subjects_performed_well_in TEXT[],
    areas_needing_improvement TEXT[],
    additional_notes TEXT,
    PRIMARY KEY (application_id)
);

-- Create selected_subjects table
CREATE TABLE IF NOT EXISTS selected_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    subject_type VARCHAR(20) NOT NULL, -- 'core' or 'elective'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financing_selections table
CREATE TABLE IF NOT EXISTS financing_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN (
        'monthly_flat',
        'termly_discount',
        'annual_discount',
        'sibling_discount',
        'bnpl',
        'forward_funding',
        'arrears-bnpl'
    )),
    discount_rate NUMERIC,
    cost_of_credit NUMERIC,
    repayment_term TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financing_options table (keeping for backward compatibility)
CREATE TABLE IF NOT EXISTS financing_options (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    selected_plan VARCHAR(50), -- 'forward-funding', 'bnpl', 'arrears-bnpl', or null for skipped
    plan_details JSONB, -- Store detailed plan information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (application_id)
);

-- Create declarations table
CREATE TABLE IF NOT EXISTS declarations (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    agree_truth BOOLEAN NOT NULL DEFAULT FALSE,
    agree_policies BOOLEAN NOT NULL DEFAULT FALSE,
    agree_financial BOOLEAN NOT NULL DEFAULT FALSE,
    agree_verification BOOLEAN NOT NULL DEFAULT FALSE,
    agree_data_processing BOOLEAN NOT NULL DEFAULT FALSE,
    full_name VARCHAR(150), -- Made nullable to handle partial saves during auto-save
    city VARCHAR(100),
    date DATE, -- Added to store the declaration date from frontend
    date_signed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (application_id),
    -- Add constraint to ensure full_name is provided when status is 'completed'
    CONSTRAINT check_full_name_completed CHECK (
        (status = 'completed' AND full_name IS NOT NULL AND length(trim(full_name)) >= 3) OR
        (status != 'completed')
    )
);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_academic_history_application_id;
CREATE INDEX idx_academic_history_application_id ON academic_history(application_id);
DROP INDEX IF EXISTS idx_selected_subjects_application_id;
CREATE INDEX idx_selected_subjects_application_id ON selected_subjects(application_id);
DROP INDEX IF EXISTS idx_selected_subjects_subject_type;
CREATE INDEX idx_selected_subjects_subject_type ON selected_subjects(subject_type);
DROP INDEX IF EXISTS idx_financing_options_selected_plan;
CREATE INDEX idx_financing_options_selected_plan ON financing_options(selected_plan);
DROP INDEX IF EXISTS idx_declarations_status;
CREATE INDEX idx_declarations_status ON declarations(status);

-- Enable Row Level Security (RLS)
ALTER TABLE academic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE selected_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication setup)
DROP POLICY IF EXISTS "Allow all operations on academic_history" ON academic_history;
CREATE POLICY "Allow all operations on academic_history" ON academic_history FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on selected_subjects" ON selected_subjects;
CREATE POLICY "Allow all operations on selected_subjects" ON selected_subjects FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on financing_selections" ON financing_selections;
CREATE POLICY "Allow all operations on financing_selections" ON financing_selections FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on financing_options" ON financing_options;
CREATE POLICY "Allow all operations on financing_options" ON financing_options FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on declarations" ON declarations;
CREATE POLICY "Allow all operations on declarations" ON declarations FOR ALL USING (true);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_financing_options_updated_at ON financing_options;
CREATE TRIGGER update_financing_options_updated_at
    BEFORE UPDATE ON financing_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_declarations_updated_at ON declarations;
CREATE TRIGGER update_declarations_updated_at
    BEFORE UPDATE ON declarations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create risk_reports table for storing Netcash risk assessment results
CREATE TABLE IF NOT EXISTS risk_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    reference VARCHAR(100) NOT NULL, -- Unique reference for the risk check
    guardian_email VARCHAR(150), -- Email of the guardian being checked
    guardian_name VARCHAR(150), -- Name of the guardian being checked
    guardian_id_number VARCHAR(20), -- ID number of the guardian being checked
    branch_code VARCHAR(10), -- Bank branch code
    account_number VARCHAR(20), -- Bank account number
    risk_score NUMERIC(5,2) CHECK (risk_score >= 0 AND risk_score <= 100), -- Risk score from Netcash (0-100)
    flags TEXT[], -- Array of validation flags (e.g., ["BankAccountValidated", "IDVerified"])
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'error'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When the risk check was performed
    raw_response JSONB, -- Full JSON response from Netcash API for audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_risk_reports_application_id;
CREATE INDEX idx_risk_reports_application_id ON risk_reports(application_id);
DROP INDEX IF EXISTS idx_risk_reports_reference;
CREATE INDEX idx_risk_reports_reference ON risk_reports(reference);
DROP INDEX IF EXISTS idx_risk_reports_risk_score;
CREATE INDEX idx_risk_reports_risk_score ON risk_reports(risk_score);

-- Enable Row Level Security (RLS)
ALTER TABLE risk_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for risk_reports
DROP POLICY IF EXISTS "Users can view risk reports for their applications" ON risk_reports;
CREATE POLICY "Users can view risk reports for their applications" ON risk_reports
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = risk_reports.application_id
        AND a.id::text = auth.jwt() ->> 'application_id'
    ) OR auth.jwt() ->> 'role' = 'school_admin'
);

DROP POLICY IF EXISTS "System can insert risk reports" ON risk_reports;
CREATE POLICY "System can insert risk reports" ON risk_reports
FOR INSERT WITH CHECK (true); -- Allow system to insert risk reports

DROP POLICY IF EXISTS "Admins can update risk reports" ON risk_reports;
CREATE POLICY "Admins can update risk reports" ON risk_reports
FOR UPDATE USING (auth.jwt() ->> 'role' = 'school_admin');

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_risk_reports_updated_at ON risk_reports;
CREATE TRIGGER update_risk_reports_updated_at
    BEFORE UPDATE ON risk_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create payments table for tracking Netcash payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    reference VARCHAR(100) NOT NULL UNIQUE, -- Unique payment reference
    amount NUMERIC(10,2) NOT NULL, -- Payment amount
    currency VARCHAR(3) DEFAULT 'ZAR',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    plan_type VARCHAR(50), -- Financing plan selected
    netcash_transaction_id VARCHAR(100), -- Transaction ID from Netcash
    redirect_url TEXT, -- URL to redirect user to Netcash
    return_url TEXT, -- URL to return after payment
    notify_url TEXT, -- Webhook URL for Netcash notifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payments table
DROP INDEX IF EXISTS idx_payments_application_id;
CREATE INDEX idx_payments_application_id ON payments(application_id);
DROP INDEX IF EXISTS idx_payments_reference;
CREATE INDEX idx_payments_reference ON payments(reference);
DROP INDEX IF EXISTS idx_payments_status;
CREATE INDEX idx_payments_status ON payments(status);

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for payments (avoid complex subqueries that might fail)
DROP POLICY IF EXISTS "Allow authenticated users to view payments" ON payments;
CREATE POLICY "Allow authenticated users to view payments" ON payments
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow system to insert payments" ON payments;
CREATE POLICY "Allow system to insert payments" ON payments
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow system to update payments" ON payments;
CREATE POLICY "Allow system to update payments" ON payments
FOR UPDATE USING (true);

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
