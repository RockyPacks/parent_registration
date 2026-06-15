-- St Andrews POPIA consent flow.
-- Disclosure text and KBA enablement live in the database so legal-reviewed
-- copy and school config can change without a frontend deployment.

CREATE TABLE IF NOT EXISTS public.consent_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_key TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'screening',
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  responsible_party TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  rights JSONB NOT NULL DEFAULT '[]'::jsonb,
  kba_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_key, purpose, version)
);

CREATE TABLE IF NOT EXISTS public.application_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  school_key TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'screening',
  disclosure_id UUID REFERENCES public.consent_disclosures(id),
  disclosure_version TEXT NOT NULL,
  consent_token UUID NOT NULL DEFAULT gen_random_uuid(),
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_disclosures_school_key
  ON public.consent_disclosures(school_key);

CREATE INDEX IF NOT EXISTS idx_application_consents_application_id
  ON public.application_consents(application_id);

CREATE INDEX IF NOT EXISTS idx_application_consents_user_id
  ON public.application_consents(user_id);

ALTER TABLE public.consent_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active disclosures are readable by authenticated users" ON public.consent_disclosures;
CREATE POLICY "Active disclosures are readable by authenticated users"
  ON public.consent_disclosures
  FOR SELECT
  TO authenticated
  USING (active = TRUE);

DROP POLICY IF EXISTS "Users can read own application consents" ON public.application_consents;
CREATE POLICY "Users can read own application consents"
  ON public.application_consents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own application consents" ON public.application_consents;
CREATE POLICY "Users can create own application consents"
  ON public.application_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

INSERT INTO public.consent_disclosures (
  school_key,
  purpose,
  version,
  title,
  body,
  checks,
  responsible_party,
  operator_name,
  rights,
  kba_enabled,
  active
) VALUES (
  'ST_ANDREWS',
  'screening',
  'st-andrews-popia-screening-v1',
  'Consent for screening checks',
  'Before your application is submitted, St Andrews uses Knit to help complete admissions screening checks. As part of this process, Experian may ask identity questions to confirm the person responsible for fees. This is not a credit application, and it does not create a loan or give you credit. St Andrews is the Responsible Party under POPIA. Knit and Experian process your information only for this admissions screening purpose. You may ask what information was used, request that inaccurate information be corrected, withdraw consent where the law allows, or contact the Information Regulator if you believe your rights have not been respected.',
  '["Identity and person verification", "Admissions screening checks linked to the fee-responsible parent", "Knowledge-based questions if person verification is enabled"]'::jsonb,
  'St Andrews',
  'Experian via Knit',
  '["Ask what personal information was used", "Request correction of inaccurate personal information", "Withdraw consent where the law allows", "Contact St Andrews or the Information Regulator about POPIA concerns"]'::jsonb,
  TRUE,
  TRUE
)
ON CONFLICT (school_key, purpose, version) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  checks = EXCLUDED.checks,
  responsible_party = EXCLUDED.responsible_party,
  operator_name = EXCLUDED.operator_name,
  rights = EXCLUDED.rights,
  kba_enabled = EXCLUDED.kba_enabled,
  active = TRUE,
  updated_at = NOW();
