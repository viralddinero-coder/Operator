CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL,
  code text UNIQUE NOT NULL,
  site_id uuid NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_links
  ADD CONSTRAINT affiliate_links_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_link_id uuid NOT NULL,
  user_id uuid NOT NULL,
  profile_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_referrals
  ADD CONSTRAINT affiliate_referrals_link_id_fkey FOREIGN KEY (affiliate_link_id) REFERENCES public.affiliate_links(id) ON DELETE CASCADE;

ALTER TABLE public.affiliate_referrals
  ADD CONSTRAINT affiliate_referrals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliate_links_admin ON public.affiliate_links FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role='admin'));
CREATE POLICY affiliate_referrals_admin ON public.affiliate_referrals FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role='admin'));
CREATE POLICY affiliate_referrals_insert_self ON public.affiliate_referrals FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.affiliate_links TO authenticated;
GRANT SELECT, INSERT ON public.affiliate_referrals TO authenticated;
