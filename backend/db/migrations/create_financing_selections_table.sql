-- Create financing_selections table
CREATE TABLE public.financing_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  application_id UUID NULL,
  plan_type TEXT NOT NULL,
  discount_rate NUMERIC NULL,
  cost_of_credit NUMERIC NULL,
  repayment_term TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT financing_selections_pkey PRIMARY KEY (id),
  CONSTRAINT financing_selections_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT financing_selections_plan_type_check CHECK (
    plan_type = ANY (
      ARRAY[
        'monthly_flat'::TEXT,
        'termly_discount'::TEXT,
        'annual_discount'::TEXT,
        'sibling_discount'::TEXT,
        'bnpl'::TEXT,
        'forward_funding'::TEXT,
        'arrears-bnpl'::TEXT
      ]
    )
  )
) TABLESPACE pg_default;

-- Create unique index on application_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_financing_selections_application_id
ON public.financing_selections USING btree (application_id) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_financing_selections_updated_at
BEFORE UPDATE ON financing_selections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
