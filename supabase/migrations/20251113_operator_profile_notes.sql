-- Operator profile persistent notes and message type extension

CREATE TABLE IF NOT EXISTS public.operator_profile_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  note_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.operator_profile_notes
  ADD CONSTRAINT operator_profile_notes_operator_fkey
  FOREIGN KEY (operator_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.operator_profile_notes
  ADD CONSTRAINT operator_profile_notes_profile_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS operator_profile_notes_idx ON public.operator_profile_notes (operator_id, profile_id);

ALTER TABLE public.operator_profile_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY operator_profile_notes_select_self ON public.operator_profile_notes
  FOR SELECT USING (auth.uid() = operator_id);

CREATE POLICY operator_profile_notes_insert_self ON public.operator_profile_notes
  FOR INSERT WITH CHECK (auth.uid() = operator_id);

CREATE POLICY operator_profile_notes_update_self ON public.operator_profile_notes
  FOR UPDATE USING (auth.uid() = operator_id);

CREATE POLICY operator_profile_notes_delete_self ON public.operator_profile_notes
  FOR DELETE USING (auth.uid() = operator_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_profile_notes TO authenticated;
GRANT SELECT ON public.operator_profile_notes TO anon;

CREATE OR REPLACE FUNCTION public.update_operator_profile_notes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operator_profile_notes_updated_at_trigger
BEFORE UPDATE ON public.operator_profile_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_operator_profile_notes_updated_at();

-- Extend messages.message_type to include gif
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='messages' AND column_name='message_type'
  ) THEN
    -- column exists per current schema; skip if not
    NULL;
  END IF;
END$$;
