-- ============================================================================
-- FIX RLS POLICIES - ENABLE DATA WRITES
-- ============================================================================
-- This migration adds the missing RLS policies for tables that were previously
-- blocking all access due to enabled RLS without policies
-- ============================================================================

-- ============================================================================
-- MEDICAL_INFO POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own medical info" ON public.medical_info;
CREATE POLICY "Users can view their own medical info" ON public.medical_info
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.medical_info.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own medical info" ON public.medical_info;
CREATE POLICY "Users can insert their own medical info" ON public.medical_info
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.medical_info.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own medical info" ON public.medical_info;
CREATE POLICY "Users can update their own medical info" ON public.medical_info
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.medical_info.application_id
      AND public.applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.medical_info.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own medical info" ON public.medical_info;
CREATE POLICY "Users can delete their own medical info" ON public.medical_info
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.medical_info.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PARENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own parents" ON public.parents;
CREATE POLICY "Users can view their own parents" ON public.parents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.parents.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own parents" ON public.parents;
CREATE POLICY "Users can insert their own parents" ON public.parents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.parents.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own parents" ON public.parents;
CREATE POLICY "Users can update their own parents" ON public.parents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.parents.application_id
      AND public.applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.parents.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own parents" ON public.parents;
CREATE POLICY "Users can delete their own parents" ON public.parents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.parents.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

-- ============================================================================
-- NEXT_OF_KIN POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own next of kin" ON public.next_of_kin;
CREATE POLICY "Users can view their own next of kin" ON public.next_of_kin
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.next_of_kin.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own next of kin" ON public.next_of_kin;
CREATE POLICY "Users can insert their own next of kin" ON public.next_of_kin
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.next_of_kin.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own next of kin" ON public.next_of_kin;
CREATE POLICY "Users can update their own next of kin" ON public.next_of_kin
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.next_of_kin.application_id
      AND public.applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.next_of_kin.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own next of kin" ON public.next_of_kin;
CREATE POLICY "Users can delete their own next of kin" ON public.next_of_kin
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.next_of_kin.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FEE_RESPONSIBILITY POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own fee responsibility" ON public.fee_responsibility;
CREATE POLICY "Users can view their own fee responsibility" ON public.fee_responsibility
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.fee_responsibility.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own fee responsibility" ON public.fee_responsibility;
CREATE POLICY "Users can insert their own fee responsibility" ON public.fee_responsibility
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.fee_responsibility.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own fee responsibility" ON public.fee_responsibility;
CREATE POLICY "Users can update their own fee responsibility" ON public.fee_responsibility
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.fee_responsibility.application_id
      AND public.applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.fee_responsibility.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own fee responsibility" ON public.fee_responsibility;
CREATE POLICY "Users can delete their own fee responsibility" ON public.fee_responsibility
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.fee_responsibility.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

-- ============================================================================
-- ACADEMIC_HISTORY POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own academic history" ON public.academic_history;
CREATE POLICY "Users can view their own academic history" ON public.academic_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.academic_history.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own academic history" ON public.academic_history;
CREATE POLICY "Users can insert their own academic history" ON public.academic_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.academic_history.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own academic history" ON public.academic_history;
CREATE POLICY "Users can update their own academic history" ON public.academic_history
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.academic_history.application_id
      AND public.applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.academic_history.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own academic history" ON public.academic_history;
CREATE POLICY "Users can delete their own academic history" ON public.academic_history
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.academic_history.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

-- ============================================================================
-- DECLARATIONS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own declarations" ON public.declarations;
CREATE POLICY "Users can view their own declarations" ON public.declarations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.declarations.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own declarations" ON public.declarations;
CREATE POLICY "Users can insert their own declarations" ON public.declarations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.declarations.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own declarations" ON public.declarations;
CREATE POLICY "Users can update their own declarations" ON public.declarations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.declarations.application_id
      AND public.applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.declarations.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own declarations" ON public.declarations;
CREATE POLICY "Users can delete their own declarations" ON public.declarations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.declarations.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

-- ============================================================================
-- APPLICATION_DOCUMENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own application documents" ON public.application_documents;
CREATE POLICY "Users can view their own application documents" ON public.application_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.application_documents.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own application documents" ON public.application_documents;
CREATE POLICY "Users can insert their own application documents" ON public.application_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.application_documents.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own application documents" ON public.application_documents;
CREATE POLICY "Users can update their own application documents" ON public.application_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.application_documents.application_id
      AND public.applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.application_documents.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own application documents" ON public.application_documents;
CREATE POLICY "Users can delete their own application documents" ON public.application_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.application_documents.application_id
      AND public.applications.user_id = auth.uid()
    )
  );

-- Grant necessary permissions on auth schema for policy execution
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
