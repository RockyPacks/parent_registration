-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
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

-- Create storage bucket for uploads (skip if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('enrollment-documents', 'enrollment-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'enrollment-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
FOR SELECT USING (bucket_id = 'enrollment-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
FOR DELETE USING (bucket_id = 'enrollment-documents' AND auth.role() = 'authenticated');

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

-- Create financing_options table
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
    full_name VARCHAR(150) NOT NULL,
    city VARCHAR(100),
    date_signed DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (application_id)
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
ALTER TABLE financing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication setup)
DROP POLICY IF EXISTS "Allow all operations on academic_history" ON academic_history;
CREATE POLICY "Allow all operations on academic_history" ON academic_history FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on selected_subjects" ON selected_subjects;
CREATE POLICY "Allow all operations on selected_subjects" ON selected_subjects FOR ALL USING (true);
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
