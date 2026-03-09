-- ============================================================================
-- ADD MISSING DELETE POLICY FOR STUDENTS TABLE
-- ============================================================================

-- Add the missing DELETE policy for students table
DROP POLICY IF EXISTS "Users can delete their own students" ON public.students;
CREATE POLICY "Users can delete their own students" ON public.students
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE public.applications.id = public.students.application_id
      AND public.applications.user_id = auth.uid()
    )
  );
