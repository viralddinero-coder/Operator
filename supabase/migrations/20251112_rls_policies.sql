-- RLS policies for users, profiles, photos allowing self-access and admin full access

-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_self ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert_self ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_admin_all ON public.users
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Profiles policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY profiles_admin_all ON public.profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Photos policies
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY photos_select_self ON public.photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY photos_insert_self ON public.photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY photos_update_self ON public.photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY photos_admin_all ON public.photos
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT SELECT ON public.photos TO anon;
