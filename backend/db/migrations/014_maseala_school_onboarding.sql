-- ============================================================================
-- MIGRATION 014: Multi-School Fee Structure — Maseala Progressive Secondary School
-- Date: 2026-05-26
-- School Key: MASEALA_PROG_001
-- ============================================================================
-- Creates an extensible multi-school schema (Section 1–3) and fully onboards
-- Maseala Progressive Secondary School with their 2026 Fee Structure & Policy
-- (Section 4).  Any future school can be added by repeating Section 4 with a
-- new school_key and its own data — no schema changes needed.
-- ============================================================================


-- ============================================================================
-- SECTION 1: TABLE DEFINITIONS
-- ============================================================================

-- schools
-- The schools table already exists in this database with base columns
-- (id, name, email, phone, address, created_at).
-- We extend it here with the additional columns needed for the multi-school
-- fee structure.  All ADD COLUMN statements are idempotent (IF NOT EXISTS).
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS school_key               TEXT,
  ADD COLUMN IF NOT EXISTS short_name               TEXT,
  ADD COLUMN IF NOT EXISTS bank_name                TEXT,
  ADD COLUMN IF NOT EXISTS account_holder           TEXT,
  ADD COLUMN IF NOT EXISTS account_number           TEXT,
  ADD COLUMN IF NOT EXISTS branch_code              TEXT,
  ADD COLUMN IF NOT EXISTS branch_name              TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference_format TEXT,
  ADD COLUMN IF NOT EXISTS active                   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add unique constraint on school_key if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schools_key_uq'
      AND conrelid = 'public.schools'::regclass
  ) THEN
    ALTER TABLE public.schools ADD CONSTRAINT schools_key_uq UNIQUE (school_key);
  END IF;
END $$;

-- school_grade_fees
-- Monthly, term, and annual school fees per grade per school.
-- Grade 12 (and any contract-based grade) uses contract_based = TRUE
-- and leaves the fee columns NULL.
CREATE TABLE IF NOT EXISTS public.school_grade_fees (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id      UUID        NOT NULL,
  grade          TEXT        NOT NULL,
  monthly_fee    INTEGER,                          -- NULL when contract_based
  term_fee       INTEGER,
  annual_fee     INTEGER,
  contract_based BOOLEAN     NOT NULL DEFAULT FALSE,
  contract_note  TEXT,                             -- shown on form for contract grades
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_grade_fees_pkey     PRIMARY KEY (id),
  CONSTRAINT school_grade_fees_school   FOREIGN KEY (school_id)
    REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT school_grade_fees_uq       UNIQUE (school_id, grade)
);

-- school_registration_fees
-- Once-off registration fee for NEW learners, per grade per school.
CREATE TABLE IF NOT EXISTS public.school_registration_fees (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id      UUID        NOT NULL,
  grade          TEXT        NOT NULL,
  amount         INTEGER,                          -- NULL when contract_based
  is_conditional BOOLEAN     NOT NULL DEFAULT FALSE,
  condition_note TEXT,                             -- e.g. 'Subject to school approval'
  contract_based BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_reg_fees_pkey   PRIMARY KEY (id),
  CONSTRAINT school_reg_fees_school FOREIGN KEY (school_id)
    REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT school_reg_fees_uq     UNIQUE (school_id, grade)
);

-- school_re_registration_fees
-- Once-off re-registration fee for RETURNING learners.
-- Uses a grade range (grades TEXT[]) because one fee tier covers multiple grades.
CREATE TABLE IF NOT EXISTS public.school_re_registration_fees (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id    UUID        NOT NULL,
  grade_range  TEXT        NOT NULL,   -- display label: 'Grade 8–9'
  grades       TEXT[]      NOT NULL,   -- ['Grade 8', 'Grade 9']
  amount       INTEGER     NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_rereg_fees_pkey   PRIMARY KEY (id),
  CONSTRAINT school_rereg_fees_school FOREIGN KEY (school_id)
    REFERENCES public.schools(id) ON DELETE CASCADE
);

-- school_extra_costs
-- Development fee, sports fee, camps, trips, fundraising, IEB exams, etc.
-- grade IS NULL for school-wide costs; set when grade_specific = TRUE.
-- amount IS NULL when amount_tbc = TRUE (determined later, e.g. after bookings).
CREATE TABLE IF NOT EXISTS public.school_extra_costs (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id      UUID        NOT NULL,
  cost_key       TEXT        NOT NULL,  -- 'development_fee', 'sports_fee', etc.
  label          TEXT        NOT NULL,
  amount         INTEGER,
  frequency      TEXT,                  -- 'yearly','every_friday','per_term_event','once_off'
  frequency_note TEXT,                  -- human-readable: 'Every Friday'
  is_compulsory  BOOLEAN     NOT NULL DEFAULT FALSE,
  grade_specific BOOLEAN     NOT NULL DEFAULT FALSE,
  grade          TEXT,                  -- set when grade_specific = TRUE, else NULL
  amount_tbc     BOOLEAN     NOT NULL DEFAULT FALSE,
  tbc_note       TEXT,                  -- shown on form when amount_tbc = TRUE
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_extra_costs_pkey   PRIMARY KEY (id),
  CONSTRAINT school_extra_costs_school FOREIGN KEY (school_id)
    REFERENCES public.schools(id) ON DELETE CASCADE
);

-- Expression-based unique index: COALESCE is not allowed in an inline UNIQUE
-- constraint but is valid in a CREATE UNIQUE INDEX expression.
-- Treats NULL grade as '' so school-wide rows have a stable key while
-- grade-specific rows (e.g. two 'compulsory_camp' rows for different grades)
-- remain unique.
CREATE UNIQUE INDEX IF NOT EXISTS school_extra_costs_uq
  ON public.school_extra_costs (school_id, cost_key, COALESCE(grade, ''));

-- school_payment_methods
-- Accepted (and explicitly rejected) payment methods per school.
-- accepted = FALSE marks methods that the school does NOT accept (e.g. cash).
CREATE TABLE IF NOT EXISTS public.school_payment_methods (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id   UUID        NOT NULL,
  method_key  TEXT        NOT NULL,  -- 'atm_transfer', 'cash', etc.
  label       TEXT        NOT NULL,
  accepted    BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_payment_methods_pkey   PRIMARY KEY (id),
  CONSTRAINT school_payment_methods_school FOREIGN KEY (school_id)
    REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT school_payment_methods_uq     UNIQUE (school_id, method_key)
);

-- school_payment_plans
-- Monthly / quarterly plan options and their due-date descriptions.
CREATE TABLE IF NOT EXISTS public.school_payment_plans (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id       UUID        NOT NULL,
  plan_key        TEXT        NOT NULL,  -- 'monthly', 'quarterly'
  label           TEXT        NOT NULL,
  due_description TEXT,                  -- 'First week of the month'
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_payment_plans_pkey   PRIMARY KEY (id),
  CONSTRAINT school_payment_plans_school FOREIGN KEY (school_id)
    REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT school_payment_plans_uq     UNIQUE (school_id, plan_key)
);

-- school_fee_policies
-- Ordered list of policy statements displayed to parents during registration.
-- policy_key is a machine-readable identifier; policy_text is shown in the UI.
CREATE TABLE IF NOT EXISTS public.school_fee_policies (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  school_id   UUID        NOT NULL,
  policy_key  TEXT        NOT NULL,
  policy_text TEXT        NOT NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_fee_policies_pkey   PRIMARY KEY (id),
  CONSTRAINT school_fee_policies_school FOREIGN KEY (school_id)
    REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT school_fee_policies_uq     UNIQUE (school_id, policy_key)
);


-- ============================================================================
-- SECTION 2: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_schools_key
  ON public.schools(school_key);

CREATE INDEX IF NOT EXISTS idx_school_grade_fees_school
  ON public.school_grade_fees(school_id);

CREATE INDEX IF NOT EXISTS idx_school_reg_fees_school
  ON public.school_registration_fees(school_id);

CREATE INDEX IF NOT EXISTS idx_school_rereg_fees_school
  ON public.school_re_registration_fees(school_id);

CREATE INDEX IF NOT EXISTS idx_school_extra_costs_school
  ON public.school_extra_costs(school_id);

CREATE INDEX IF NOT EXISTS idx_school_payment_methods_school
  ON public.school_payment_methods(school_id);

CREATE INDEX IF NOT EXISTS idx_school_payment_plans_school
  ON public.school_payment_plans(school_id);

CREATE INDEX IF NOT EXISTS idx_school_fee_policies_school
  ON public.school_fee_policies(school_id);


-- ============================================================================
-- SECTION 3: ROW-LEVEL SECURITY
-- ============================================================================
-- All school config tables are publicly readable — the registration form needs
-- to load fee data before a user is fully authenticated.
-- Only service-role can INSERT / UPDATE / DELETE (default Supabase behaviour).

-- schools RLS is already enabled in the existing schema; skip it to avoid error.
-- New tables get RLS enabled below.
ALTER TABLE public.school_grade_fees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_registration_fees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_re_registration_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_extra_costs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_payment_methods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_payment_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fee_policies        ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'schools',
    'school_grade_fees',
    'school_registration_fees',
    'school_re_registration_fees',
    'school_extra_costs',
    'school_payment_methods',
    'school_payment_plans',
    'school_fee_policies'
  ]
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY "Public read %1$s" ON public.%1$s'
        ' FOR SELECT TO authenticated, anon USING (true)',
        tbl
      );
    EXCEPTION WHEN duplicate_object THEN
      -- Policy already exists; skip silently
      NULL;
    END;
  END LOOP;
END $$;


-- ============================================================================
-- SECTION 4: MASEALA PROGRESSIVE SECONDARY SCHOOL DATA
-- School Key: MASEALA_PROG_001
-- ============================================================================
-- To onboard a new school: copy this entire section, change the school_key,
-- name, and all fee/policy values.  No schema changes are required.

DO $$
DECLARE
  v_school_id UUID;
BEGIN

  -- ── 4.1  School Profile ────────────────────────────────────────────────────
  INSERT INTO public.schools (
    school_key,
    name,
    short_name,
    bank_name,
    account_holder,
    account_number,
    branch_code,
    branch_name,
    payment_reference_format
  ) VALUES (
    'MASEALA_PROG_001',
    'Maseala Progressive Secondary School',
    'Maseala',
    'NEDBANK',
    'Maseala Independent Schools',
    '1203251815',
    '198765',
    'Polokwane',
    'Child''s Name & Grade'
  )
  ON CONFLICT (school_key) DO UPDATE SET
    name                     = EXCLUDED.name,
    short_name               = EXCLUDED.short_name,
    bank_name                = EXCLUDED.bank_name,
    account_holder           = EXCLUDED.account_holder,
    account_number           = EXCLUDED.account_number,
    branch_code              = EXCLUDED.branch_code,
    branch_name              = EXCLUDED.branch_name,
    payment_reference_format = EXCLUDED.payment_reference_format,
    updated_at               = NOW();

  -- ON CONFLICT ... DO UPDATE does not fire RETURNING, so fetch the id
  SELECT id INTO v_school_id
  FROM public.schools
  WHERE school_key = 'MASEALA_PROG_001';

  -- ── 4.2  School Fees per Grade (Monthly / Term / Annual) ──────────────────

  -- Grade 8: R950/month · R2,850/term · R11,400/year
  INSERT INTO public.school_grade_fees
    (school_id, grade, monthly_fee, term_fee, annual_fee)
  VALUES (v_school_id, 'Grade 8', 950, 2850, 11400)
  ON CONFLICT (school_id, grade) DO UPDATE SET
    monthly_fee = EXCLUDED.monthly_fee,
    term_fee    = EXCLUDED.term_fee,
    annual_fee  = EXCLUDED.annual_fee,
    updated_at  = NOW();

  -- Grade 9: R1,100/month · R3,300/term · R13,200/year
  INSERT INTO public.school_grade_fees
    (school_id, grade, monthly_fee, term_fee, annual_fee)
  VALUES (v_school_id, 'Grade 9', 1100, 3300, 13200)
  ON CONFLICT (school_id, grade) DO UPDATE SET
    monthly_fee = EXCLUDED.monthly_fee,
    term_fee    = EXCLUDED.term_fee,
    annual_fee  = EXCLUDED.annual_fee,
    updated_at  = NOW();

  -- Grade 10: R1,150/month · R3,450/term · R13,800/year
  INSERT INTO public.school_grade_fees
    (school_id, grade, monthly_fee, term_fee, annual_fee)
  VALUES (v_school_id, 'Grade 10', 1150, 3450, 13800)
  ON CONFLICT (school_id, grade) DO UPDATE SET
    monthly_fee = EXCLUDED.monthly_fee,
    term_fee    = EXCLUDED.term_fee,
    annual_fee  = EXCLUDED.annual_fee,
    updated_at  = NOW();

  -- Grade 11: R1,150/month · R3,450/term · R13,800/year
  INSERT INTO public.school_grade_fees
    (school_id, grade, monthly_fee, term_fee, annual_fee)
  VALUES (v_school_id, 'Grade 11', 1150, 3450, 13800)
  ON CONFLICT (school_id, grade) DO UPDATE SET
    monthly_fee = EXCLUDED.monthly_fee,
    term_fee    = EXCLUDED.term_fee,
    annual_fee  = EXCLUDED.annual_fee,
    updated_at  = NOW();

  -- Grade 12: Internal — fees by contract (no fixed monthly/term/annual amount)
  INSERT INTO public.school_grade_fees
    (school_id, grade, monthly_fee, term_fee, annual_fee, contract_based, contract_note)
  VALUES (
    v_school_id, 'Grade 12', NULL, NULL, NULL, TRUE,
    'Internal fees — please contact the school for a contract.'
  )
  ON CONFLICT (school_id, grade) DO UPDATE SET
    monthly_fee    = NULL,
    term_fee       = NULL,
    annual_fee     = NULL,
    contract_based = TRUE,
    contract_note  = EXCLUDED.contract_note,
    updated_at     = NOW();

  -- ── 4.3  Registration Fees — NEW Learners ─────────────────────────────────
  -- Grade 11 is conditional (subject to school approval)

  INSERT INTO public.school_registration_fees
    (school_id, grade, amount, is_conditional, condition_note, contract_based)
  VALUES
    (v_school_id, 'Grade 8',  1000, FALSE, NULL,                                    FALSE),
    (v_school_id, 'Grade 9',  1000, FALSE, NULL,                                    FALSE),
    (v_school_id, 'Grade 10', 1100, FALSE, NULL,                                    FALSE),
    (v_school_id, 'Grade 11', 1100, TRUE,  'Conditional — subject to school approval', FALSE),
    (v_school_id, 'Grade 12', NULL, FALSE, NULL,                                    TRUE)
  ON CONFLICT (school_id, grade) DO UPDATE SET
    amount         = EXCLUDED.amount,
    is_conditional = EXCLUDED.is_conditional,
    condition_note = EXCLUDED.condition_note,
    contract_based = EXCLUDED.contract_based,
    updated_at     = NOW();

  -- ── 4.4  Re-Registration Fees — RETURNING Learners ────────────────────────
  -- Delete and re-insert; grade ranges have no natural unique key.

  DELETE FROM public.school_re_registration_fees
  WHERE school_id = v_school_id;

  INSERT INTO public.school_re_registration_fees
    (school_id, grade_range, grades, amount)
  VALUES
    (v_school_id, 'Grade 8–9',
      ARRAY['Grade 8', 'Grade 9'],
      750),
    (v_school_id, 'Grade 10–12',
      ARRAY['Grade 10', 'Grade 11', 'Grade 12'],
      850);

  -- ── 4.5  Extra Costs ───────────────────────────────────────────────────────

  -- Development Fee: R600 per year (school-wide, compulsory)
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency, frequency_note, is_compulsory, sort_order)
  VALUES
    (v_school_id, 'development_fee', 'Development Fee',
     600, 'yearly', 'R600 per year', TRUE, 1)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    amount = EXCLUDED.amount, updated_at = NOW();

  -- Sports Fee: R600 per year (school-wide, compulsory)
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency, frequency_note, is_compulsory, sort_order)
  VALUES
    (v_school_id, 'sports_fee', 'Sports Fee',
     600, 'yearly', 'R600 per year', TRUE, 2)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    amount = EXCLUDED.amount, updated_at = NOW();

  -- Fundraising: R10 every Friday
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency, frequency_note, is_compulsory, sort_order)
  VALUES
    (v_school_id, 'fundraising', 'Fundraising',
     10, 'every_friday', 'R10 every Friday', TRUE, 3)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    amount = EXCLUDED.amount, updated_at = NOW();

  -- Term Events: 3 per year at R150 each
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency, frequency_note, is_compulsory, sort_order)
  VALUES
    (v_school_id, 'term_events', 'Term Events',
     150, 'per_term_event', '3 events per year at R150 each', TRUE, 4)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    amount = EXCLUDED.amount, updated_at = NOW();

  -- IEB Exam Fees: grade-specific, TBC — contact school
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency,
     is_compulsory, grade_specific, amount_tbc, tbc_note, sort_order)
  VALUES
    (v_school_id, 'ieb_exam_fees', 'IEB Exam Fees',
     NULL, 'yearly',
     TRUE, TRUE, TRUE, 'Fees available per grade — contact the school', 5)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    amount_tbc = TRUE, tbc_note = EXCLUDED.tbc_note, updated_at = NOW();

  -- Annual Trips & Camps: grade-specific, TBC after bookings (not always compulsory)
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency,
     is_compulsory, grade_specific, amount_tbc, tbc_note, sort_order)
  VALUES
    (v_school_id, 'annual_trips', 'Annual Trips & Camps',
     NULL, 'yearly',
     FALSE, TRUE, TRUE, 'Cost determined after bookings — grade specific', 6)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    amount_tbc = TRUE, tbc_note = EXCLUDED.tbc_note, updated_at = NOW();

  -- Compulsory Camp — Grade 8: R4,500
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency, frequency_note,
     is_compulsory, grade_specific, grade, sort_order)
  VALUES
    (v_school_id, 'compulsory_camp', 'Compulsory Camp',
     4500, 'once_off', 'Once-off per school year',
     TRUE, TRUE, 'Grade 8', 7)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    amount = EXCLUDED.amount, updated_at = NOW();

  -- Compulsory Camp — Grade 12: R8,500
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency, frequency_note,
     is_compulsory, grade_specific, grade, sort_order)
  VALUES
    (v_school_id, 'compulsory_camp', 'Compulsory Camp',
     8500, 'once_off', 'Once-off per school year',
     TRUE, TRUE, 'Grade 12', 7)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    amount = EXCLUDED.amount, updated_at = NOW();

  -- Other grades: letter to indicate whether camp payment is required
  INSERT INTO public.school_extra_costs
    (school_id, cost_key, label, amount, frequency,
     is_compulsory, grade_specific, amount_tbc, tbc_note, sort_order)
  VALUES
    (v_school_id, 'camp_other_grades', 'Camp (Other Grades)',
     NULL, 'once_off',
     FALSE, TRUE, TRUE,
     'A letter will indicate whether a camp payment is required for this grade', 8)
  ON CONFLICT (school_id, cost_key, COALESCE(grade, '')) DO UPDATE SET
    tbc_note = EXCLUDED.tbc_note, updated_at = NOW();

  -- ── 4.6  Payment Methods ───────────────────────────────────────────────────
  -- accepted = FALSE explicitly marks cash as NOT accepted

  INSERT INTO public.school_payment_methods
    (school_id, method_key, label, accepted, sort_order)
  VALUES
    (v_school_id, 'atm_transfer',        'ATM Transfer',              TRUE,  1),
    (v_school_id, 'electronic_transfer', 'Electronic Transfer (EFT)', TRUE,  2),
    (v_school_id, 'debit_order',         'Debit Order',               TRUE,  3),
    (v_school_id, 'bank_deposit',        'Bank Deposit',              TRUE,  4),
    (v_school_id, 'speed_point',         'Speed Point (at school)',   TRUE,  5),
    (v_school_id, 'cash',                'Cash',                      FALSE, 6)
  ON CONFLICT (school_id, method_key) DO UPDATE SET
    label      = EXCLUDED.label,
    accepted   = EXCLUDED.accepted,
    sort_order = EXCLUDED.sort_order;

  -- ── 4.7  Payment Plans ─────────────────────────────────────────────────────

  INSERT INTO public.school_payment_plans
    (school_id, plan_key, label, due_description, sort_order)
  VALUES
    (v_school_id, 'monthly',
      'Monthly',
      'Due in the first week of each month',
      1),
    (v_school_id, 'quarterly',
      'Quarterly',
      'Due on the first day of each school quarter',
      2)
  ON CONFLICT (school_id, plan_key) DO UPDATE SET
    label           = EXCLUDED.label,
    due_description = EXCLUDED.due_description,
    sort_order      = EXCLUDED.sort_order;

  -- ── 4.8  Fees Policy ───────────────────────────────────────────────────────

  INSERT INTO public.school_fee_policies
    (school_id, policy_key, policy_text, sort_order)
  VALUES
    (v_school_id,
     'first_payment',
     'The first payment must include re-registration fees, registration fees, '
     'development fee, sports fee, and the first monthly instalment — all due '
     'on the first day of the school year.',
     1),

    (v_school_id,
     'foreign_learners',
     'All foreign learners are expected to pay 50% of the total fees on the '
     'first day of the academic year.',
     2),

    (v_school_id,
     'early_payment_discount',
     'A 10% discount is applicable for once-off payment of School Fees, '
     'Registration Fees, Sports Fees, and Development Fees when paid on or '
     'before 31 January.',
     3),

    (v_school_id,
     'no_refund',
     'There is no refund for re-registration, registration, sports, '
     'development, or school fees once paid.',
     4),

    (v_school_id,
     'sibling_development_fee',
     'For more than one child enrolled at Maseala Schools, no Development Fee '
     'will be charged for the youngest child enrolled.',
     5),

    (v_school_id,
     'payment_terms',
     'Fees are due on the first day of opening for the 1st quarter. Payments '
     'must be made timeously to avoid charges. Once-off payments '
     '(re-registration, registration, sports fees, etc.) must be settled before '
     'commencement of Term 1 each academic year.',
     6),

    (v_school_id,
     'failure_to_pay',
     'The relationship between the school and the parent is a commercial one '
     'based on a contractual agreement. Failure to pay school fees is a breach '
     'of contract. The school reserves the right to refer accounts to school '
     'attorneys and/or exclude the learner from school activities. Parents may '
     'be advised to transfer their child to a no-fee-paying school. '
     'By accepting, you confirm that you understand and accept the legal '
     'consequences as per clause 12 of this contract.',
     7),

    (v_school_id,
     'no_cash',
     'No cash payments are accepted under any circumstances.',
     8)

  ON CONFLICT (school_id, policy_key) DO UPDATE SET
    policy_text = EXCLUDED.policy_text,
    sort_order  = EXCLUDED.sort_order;

END $$;


-- ============================================================================
-- SECTION 5: HELPER VIEW (optional — useful for the backend/API layer)
-- Returns the complete fee profile for a given school_key in a single query.
-- ============================================================================

CREATE OR REPLACE VIEW public.v_school_fee_summary AS
SELECT
  s.school_key,
  s.name                     AS school_name,
  s.short_name,
  s.bank_name,
  s.account_holder,
  s.account_number,
  s.branch_code,
  s.branch_name,
  s.payment_reference_format,
  -- Grade fees as JSON array
  (SELECT json_agg(
     json_build_object(
       'grade',          gf.grade,
       'monthly_fee',    gf.monthly_fee,
       'term_fee',       gf.term_fee,
       'annual_fee',     gf.annual_fee,
       'contract_based', gf.contract_based,
       'contract_note',  gf.contract_note
     ) ORDER BY gf.grade
   )
   FROM public.school_grade_fees gf WHERE gf.school_id = s.id
  )                          AS grade_fees,
  -- Registration fees as JSON array
  (SELECT json_agg(
     json_build_object(
       'grade',          rf.grade,
       'amount',         rf.amount,
       'is_conditional', rf.is_conditional,
       'condition_note', rf.condition_note,
       'contract_based', rf.contract_based
     ) ORDER BY rf.grade
   )
   FROM public.school_registration_fees rf WHERE rf.school_id = s.id
  )                          AS registration_fees,
  -- Re-registration fees as JSON array
  (SELECT json_agg(
     json_build_object(
       'grade_range', rr.grade_range,
       'grades',      rr.grades,
       'amount',      rr.amount
     ) ORDER BY rr.amount
   )
   FROM public.school_re_registration_fees rr WHERE rr.school_id = s.id
  )                          AS re_registration_fees,
  -- Extra costs as JSON array
  (SELECT json_agg(
     json_build_object(
       'cost_key',      ec.cost_key,
       'label',         ec.label,
       'amount',        ec.amount,
       'frequency',     ec.frequency,
       'frequency_note',ec.frequency_note,
       'is_compulsory', ec.is_compulsory,
       'grade_specific',ec.grade_specific,
       'grade',         ec.grade,
       'amount_tbc',    ec.amount_tbc,
       'tbc_note',      ec.tbc_note
     ) ORDER BY ec.sort_order
   )
   FROM public.school_extra_costs ec WHERE ec.school_id = s.id
  )                          AS extra_costs,
  -- Payment methods as JSON array (accepted only)
  (SELECT json_agg(
     json_build_object(
       'method_key', pm.method_key,
       'label',      pm.label,
       'accepted',   pm.accepted
     ) ORDER BY pm.sort_order
   )
   FROM public.school_payment_methods pm WHERE pm.school_id = s.id
  )                          AS payment_methods,
  -- Payment plans as JSON array
  (SELECT json_agg(
     json_build_object(
       'plan_key',       pp.plan_key,
       'label',          pp.label,
       'due_description',pp.due_description
     ) ORDER BY pp.sort_order
   )
   FROM public.school_payment_plans pp WHERE pp.school_id = s.id
  )                          AS payment_plans,
  -- Policies as JSON array
  (SELECT json_agg(
     json_build_object(
       'policy_key',  fp.policy_key,
       'policy_text', fp.policy_text
     ) ORDER BY fp.sort_order
   )
   FROM public.school_fee_policies fp WHERE fp.school_id = s.id
  )                          AS fee_policies
FROM public.schools s
WHERE s.active = TRUE;

-- ============================================================================
-- END OF MIGRATION 014
-- ============================================================================
-- To verify the Maseala data was inserted correctly run:
--   SELECT school_key, name, bank_name, account_number FROM public.schools
--   WHERE school_key = 'MASEALA_PROG_001';
--
--   SELECT * FROM public.v_school_fee_summary
--   WHERE school_key = 'MASEALA_PROG_001';
-- ============================================================================
