CREATE TABLE public.admin_access_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  ip text,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_access_attempts TO authenticated;
GRANT ALL ON public.admin_access_attempts TO service_role;

ALTER TABLE public.admin_access_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log
CREATE POLICY "Admins can read admin access attempts"
ON public.admin_access_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No client INSERT/UPDATE/DELETE — only service_role writes via server function

CREATE INDEX idx_admin_access_attempts_user_recent
  ON public.admin_access_attempts (user_id, created_at DESC);
CREATE INDEX idx_admin_access_attempts_created
  ON public.admin_access_attempts (created_at DESC);