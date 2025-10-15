-- Psychometric results table for Holland Code test

CREATE TABLE IF NOT EXISTS public.psychometric_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  test_type text NOT NULL DEFAULT 'holland',
  holland_code text,
  raw_scores jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, test_type)
);

ALTER TABLE public.psychometric_results ENABLE ROW LEVEL SECURITY;

-- RLS: student owner or admin can read/write their result
DROP POLICY IF EXISTS psych_results_select ON public.psychometric_results;
CREATE POLICY psych_results_select ON public.psychometric_results
FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.students s WHERE s.id = psychometric_results.student_id AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS psych_results_upsert ON public.psychometric_results;
CREATE POLICY psych_results_upsert ON public.psychometric_results
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.students s WHERE s.id = psychometric_results.student_id AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS psych_results_update ON public.psychometric_results;
CREATE POLICY psych_results_update ON public.psychometric_results
FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.students s WHERE s.id = psychometric_results.student_id AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.students s WHERE s.id = psychometric_results.student_id AND s.user_id = auth.uid()
  )
);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_psych_results_updated ON public.psychometric_results;
CREATE TRIGGER trg_psych_results_updated
BEFORE UPDATE ON public.psychometric_results
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


