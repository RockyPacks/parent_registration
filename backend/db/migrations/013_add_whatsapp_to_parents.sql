-- ============================================================================
-- MIGRATION 013: Add WhatsApp fields to parents and next_of_kin tables
-- Date: 2026-05-25
-- ============================================================================

-- Add whatsapp column to parents table (used for Father/Mother/Guardian rows)
ALTER TABLE public.parents
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add whatsapp column to next_of_kin table
ALTER TABLE public.next_of_kin
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;
