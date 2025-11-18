-- Supabase Row Level Security (RLS) Policies
-- Execute these policies in your Supabase SQL editor

-- Enable RLS on all tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_responsibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_selections ENABLE ROW LEVEL SECURITY;

-- Applications table policies
CREATE POLICY "Users can view their own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Student info policies
CREATE POLICY "Users can view their own student info" ON student_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = student_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own student info" ON student_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = student_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own student info" ON student_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = student_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Medical info policies
CREATE POLICY "Users can view their own medical info" ON medical_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = medical_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own medical info" ON medical_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = medical_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own medical info" ON medical_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = medical_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Family info policies
CREATE POLICY "Users can view their own family info" ON family_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = family_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own family info" ON family_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = family_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own family info" ON family_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = family_info.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Fee responsibility policies
CREATE POLICY "Users can view their own fee responsibility" ON fee_responsibility
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = fee_responsibility.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own fee responsibility" ON fee_responsibility
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = fee_responsibility.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own fee responsibility" ON fee_responsibility
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = fee_responsibility.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Academic history policies
CREATE POLICY "Users can view their own academic history" ON academic_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = academic_history.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own academic history" ON academic_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = academic_history.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own academic history" ON academic_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = academic_history.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Declarations policies
CREATE POLICY "Users can view their own declarations" ON declarations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = declarations.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own declarations" ON declarations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = declarations.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own declarations" ON declarations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = declarations.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Uploaded files policies
CREATE POLICY "Users can view their own uploaded files" ON uploaded_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = uploaded_files.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own uploaded files" ON uploaded_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = uploaded_files.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own uploaded files" ON uploaded_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = uploaded_files.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own uploaded files" ON uploaded_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = uploaded_files.application_id
            AND applications.user_id = auth.uid()
        )
    );

-- Financing selections policies
CREATE POLICY "Users can view their own financing selections" ON financing_selections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = financing_selections.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own financing selections" ON financing_selections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = financing_selections.application_id
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own financing selections" ON financing_selections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = financing_selections.application_id
            AND applications.user_id = auth.uid()
        )
    );
