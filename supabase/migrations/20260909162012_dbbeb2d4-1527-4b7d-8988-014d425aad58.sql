CREATE TABLE public.ai_credit_resets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anon_id text NOT NULL,
  reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_credit_resets TO anon;
GRANT SELECT, INSERT ON public.ai_credit_resets TO authenticated;
GRANT ALL ON public.ai_credit_resets TO service_role;

ALTER TABLE public.ai_credit_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit resets"
ON public.ai_credit_resets FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can create credit resets"
ON public.ai_credit_resets FOR INSERT
TO anon, authenticated
WITH CHECK (length(anon_id) BETWEEN 1 AND 64);

CREATE INDEX ai_credit_resets_anon_id_idx ON public.ai_credit_resets (anon_id, reset_at DESC);