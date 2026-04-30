-- Migration 011: Add new Medical & Learner Health Details fields to medical_info table
-- Run this in your Supabase SQL editor

ALTER TABLE public.medical_info
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS home_language text,
  ADD COLUMN IF NOT EXISTS allergy_action_required text,
  ADD COLUMN IF NOT EXISTS allergy_status text,
  ADD COLUMN IF NOT EXISTS immunisations_up_to_date text,
  ADD COLUMN IF NOT EXISTS learner_conditions text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS medicine_not_to_administer text,
  -- Map new frontend field names to existing columns (via aliases in backend)
  -- medicalAidScheme  -> medical_aid_name (existing)
  -- medicalAidNumber  -> member_number (existing)
  -- primaryMemberDetails -> main_member_name (existing)
  ADD COLUMN IF NOT EXISTS medical_aid_scheme text,
  ADD COLUMN IF NOT EXISTS medical_aid_number text,
  ADD COLUMN IF NOT EXISTS primary_member_details text;

-- Update timestamps trigger (if not already set)
-- updated_at is already handled by existing trigger
