CREATE TABLE IF NOT EXISTS public.mail_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid,
  to_email text NOT NULL,
  template_key text,
  payload jsonb,
  status text DEFAULT 'queued',
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mail_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY mail_logs_admin ON public.mail_logs FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
