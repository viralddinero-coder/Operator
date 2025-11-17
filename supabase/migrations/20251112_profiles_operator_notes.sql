-- Extend profiles with operator fields and status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_operator_profile boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_operator_id uuid NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'offline' CHECK (status = ANY (ARRAY['online','offline','switching']));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_assigned_operator_id_fkey
  FOREIGN KEY (assigned_operator_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_operator_status_idx ON public.profiles (is_operator_profile, status);
CREATE INDEX IF NOT EXISTS profiles_assigned_operator_idx ON public.profiles (assigned_operator_id);

-- Operator notes table
CREATE TABLE IF NOT EXISTS public.operator_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  note_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.operator_notes
  ADD CONSTRAINT operator_notes_operator_id_fkey
  FOREIGN KEY (operator_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.operator_notes
  ADD CONSTRAINT operator_notes_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS operator_notes_operator_conv_idx ON public.operator_notes (operator_id, conversation_id);

ALTER TABLE public.operator_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators read own notes" ON public.operator_notes
  FOR SELECT USING (auth.uid() = operator_id);

CREATE POLICY "Operators write own notes" ON public.operator_notes
  FOR INSERT WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators update own notes" ON public.operator_notes
  FOR UPDATE USING (auth.uid() = operator_id);

CREATE POLICY "Operators delete own notes" ON public.operator_notes
  FOR DELETE USING (auth.uid() = operator_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_notes TO authenticated;
GRANT SELECT ON public.operator_notes TO anon;

CREATE OR REPLACE FUNCTION public.update_operator_notes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operator_notes_updated_at_trigger
BEFORE UPDATE ON public.operator_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_operator_notes_updated_at();
