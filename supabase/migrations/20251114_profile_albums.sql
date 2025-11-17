CREATE TABLE IF NOT EXISTS public.profile_albums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profile_albums
  ADD CONSTRAINT profile_albums_profile_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.album_photos (
  album_id uuid NOT NULL,
  photo_id uuid NOT NULL,
  PRIMARY KEY (album_id, photo_id)
);

ALTER TABLE public.album_photos
  ADD CONSTRAINT album_photos_album_fkey
  FOREIGN KEY (album_id) REFERENCES public.profile_albums(id) ON DELETE CASCADE;

ALTER TABLE public.album_photos
  ADD CONSTRAINT album_photos_photo_fkey
  FOREIGN KEY (photo_id) REFERENCES public.photos(id) ON DELETE CASCADE;

ALTER TABLE public.profile_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_albums_owner ON public.profile_albums
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY album_photos_owner ON public.album_photos
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.photos WHERE id = photo_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.photos WHERE id = photo_id));

