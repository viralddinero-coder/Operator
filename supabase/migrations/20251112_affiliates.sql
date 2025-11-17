-- Affiliates and related transactions
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  code text UNIQUE NOT NULL,
  commission_rate numeric DEFAULT 0.1,
  site_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliates
  ADD CONSTRAINT affiliates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.affiliate_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL,
  user_id uuid NOT NULL,
  coin_transaction_id uuid NOT NULL,
  amount numeric NOT NULL,
  commission numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_transactions
  ADD CONSTRAINT affiliate_transactions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;

ALTER TABLE public.affiliate_transactions
  ADD CONSTRAINT affiliate_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.affiliate_transactions
  ADD CONSTRAINT affiliate_transactions_coin_tx_id_fkey FOREIGN KEY (coin_transaction_id) REFERENCES public.coin_transactions(id) ON DELETE CASCADE;

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliates_self ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY affiliates_admin ON public.affiliates FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role='admin'));

CREATE POLICY affiliate_tx_admin ON public.affiliate_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role='admin'));

GRANT SELECT, INSERT, UPDATE ON public.affiliates TO authenticated;
GRANT SELECT ON public.affiliates TO anon;
GRANT SELECT ON public.affiliate_transactions TO authenticated;
