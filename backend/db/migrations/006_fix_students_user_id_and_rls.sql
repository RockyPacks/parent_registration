-- ============================================================================
-- FIX STUDENTS TABLE - ADD USER_ID AND UPDATE RLS POLICIES
-- ============================================================================

-- Add user_id column if it doesn't exist
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Re-create students RLS policies with user_id check
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;
CREATE POLICY "Users can view their own students" ON public.students
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert their own students" ON public.students;
CREATE POLICY "Users can insert their own students" ON public.students
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own students" ON public.students;
CREATE POLICY "Users can update their own students" ON public.students
  FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own students" ON public.students;
CREATE POLICY "Users can delete their own students" ON public.students
  FOR DELETE
  USING (
    user_id = auth.uid()
  );
