ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON public.users (username) WHERE username IS NOT NULL;
