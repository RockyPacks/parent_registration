-- ============================================================================
-- PVS-E Identity Verification Audit Results
-- Stores Experian transaction/result metadata only. Questions and answers are
-- intentionally not persisted for POPIA minimisation.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pvse_identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  parent_id UUID NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  result TEXT NOT NULL,
  score NUMERIC(5,2),
  threshold NUMERIC(5,2) NOT NULL DEFAULT 65,
  locked_until TIMESTAMPTZ,
  provider_status TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pvse_identity_verifications_result_check CHECK (
    result IN (
      'questions_generated',
      'passed',
      'failed',
      'soft_locked',
      'hard_locked',
      'timeout',
      'provider_validation_error',
      'provider_auth_error',
      'provider_unavailable',
      'network_error',
      'provider_contract_error',
      'abandoned'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_pvse_identity_verifications_application_id
  ON public.pvse_identity_verifications(application_id);

CREATE INDEX IF NOT EXISTS idx_pvse_identity_verifications_user_id
  ON public.pvse_identity_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_pvse_identity_verifications_created_at
  ON public.pvse_identity_verifications(created_at DESC);

ALTER TABLE public.pvse_identity_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own pvse verification status" ON public.pvse_identity_verifications;
CREATE POLICY "Users can read own pvse verification status"
  ON public.pvse_identity_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pvse verification status" ON public.pvse_identity_verifications;
CREATE POLICY "Users can insert own pvse verification status"
  ON public.pvse_identity_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pvse verification status" ON public.pvse_identity_verifications;
CREATE POLICY "Users can update own pvse verification status"
  ON public.pvse_identity_verifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
