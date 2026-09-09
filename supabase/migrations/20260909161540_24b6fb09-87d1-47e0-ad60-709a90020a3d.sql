CREATE TABLE public.ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anon_id text NOT NULL,
  request_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_usage TO anon;
GRANT SELECT, INSERT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log AI usage"
ON public.ai_usage FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(anon_id) BETWEEN 1 AND 64
  AND length(request_type) BETWEEN 1 AND 40
);

CREATE POLICY "Anyone can read AI usage"
ON public.ai_usage FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX ai_usage_anon_id_idx ON public.ai_usage (anon_id);
CREATE INDEX ai_usage_created_at_idx ON public.ai_usage (created_at DESC);