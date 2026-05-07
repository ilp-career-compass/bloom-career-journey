-- admin_audit_log: records who created/deleted orgs, schools, classes, users, etc., and when
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  uuid         REFERENCES public.users(id) ON DELETE SET NULL,
  action         text         NOT NULL,
  target_type    text         NOT NULL,
  target_id      text,
  target_name    text,
  created_at     timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit rows
CREATE POLICY "audit_select_admin"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert audit rows
CREATE POLICY "audit_insert_admin"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for chronological queries
CREATE INDEX admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
