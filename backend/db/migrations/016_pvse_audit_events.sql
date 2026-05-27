-- ============================================================================
-- Migration 016: PVS-E audit events table
-- Stores admin actions (e.g. unblock) and lock-state changes for compliance.
-- ============================================================================

-- Audit events table
CREATE TABLE IF NOT EXISTS public.pvse_audit_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID        NOT NULL,
  event_type   TEXT        NOT NULL,   -- e.g. 'admin_unblock', 'soft_locked', 'hard_locked'
  performed_by UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pvse_audit_events_parent_id
  ON public.pvse_audit_events(parent_id);

CREATE INDEX IF NOT EXISTS idx_pvse_audit_events_created_at
  ON public.pvse_audit_events(created_at DESC);

ALTER TABLE public.pvse_audit_events ENABLE ROW LEVEL SECURITY;

-- Only service-role / admins may read audit events (no user-facing SELECT policy)
DROP POLICY IF EXISTS "Service role can manage pvse audit events" ON public.pvse_audit_events;
CREATE POLICY "Service role can manage pvse audit events"
  ON public.pvse_audit_events
  USING (false)          -- no row-level access for regular users
  WITH CHECK (false);

-- ─── parent_id index on pvse_identity_verifications (for admin unblock query) ──
CREATE INDEX IF NOT EXISTS idx_pvse_identity_verifications_parent_id
  ON public.pvse_identity_verifications(parent_id);
