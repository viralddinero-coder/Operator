CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY likes_owner_select ON public.likes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY likes_owner_insert ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY likes_owner_delete ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS likes_user_target_idx ON public.likes (user_id, target_user_id);

