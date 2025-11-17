-- Extend coin_packages with site-specific pricing in EUR

ALTER TABLE public.coin_packages
  ADD COLUMN IF NOT EXISTS site_id uuid NULL,
  ADD COLUMN IF NOT EXISTS price_eur numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';

ALTER TABLE public.coin_packages
  ADD CONSTRAINT coin_packages_site_fkey
  FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS coin_packages_site_idx ON public.coin_packages (site_id, is_active);
