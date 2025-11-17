CREATE TABLE IF NOT EXISTS public.mass_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  message_text text NOT NULL,
  rate_per_min integer DEFAULT 60,
  total_targets integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  status text DEFAULT 'scheduled', -- scheduled|running|completed|stopped
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.mass_messages
  ADD CONSTRAINT mass_messages_profile_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.mass_messages
  ADD CONSTRAINT mass_messages_site_fkey
  FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;

ALTER TABLE public.mass_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY mass_messages_admin ON public.mass_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

