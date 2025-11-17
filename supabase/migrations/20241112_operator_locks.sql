-- Create operator_locks table for managing locked conversations
CREATE TABLE IF NOT EXISTS public.operator_locks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    operator_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.operator_locks 
ADD CONSTRAINT operator_locks_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE public.operator_locks 
ADD CONSTRAINT operator_locks_operator_id_fkey 
FOREIGN KEY (operator_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create unique constraint to prevent duplicate locks per conversation
CREATE UNIQUE INDEX operator_locks_conversation_operator_idx 
ON public.operator_locks (conversation_id, operator_id) 
WHERE is_active = true;

-- Create index for faster queries
CREATE INDEX operator_locks_operator_active_idx 
ON public.operator_locks (operator_id, is_active);

CREATE INDEX operator_locks_conversation_active_idx 
ON public.operator_locks (conversation_id, is_active);

-- Enable RLS
ALTER TABLE public.operator_locks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Operators can view their own locks" ON public.operator_locks
    FOR SELECT USING (auth.uid() = operator_id);

CREATE POLICY "Operators can create locks for themselves" ON public.operator_locks
    FOR INSERT WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators can update their own locks" ON public.operator_locks
    FOR UPDATE USING (auth.uid() = operator_id);

CREATE POLICY "Operators can delete their own locks" ON public.operator_locks
    FOR DELETE USING (auth.uid() = operator_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.operator_locks TO anon;
GRANT SELECT ON public.operator_locks TO authenticated;
GRANT INSERT ON public.operator_locks TO authenticated;
GRANT UPDATE ON public.operator_locks TO authenticated;
GRANT DELETE ON public.operator_locks TO authenticated;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_operator_locks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_operator_locks_updated_at_trigger
    BEFORE UPDATE ON public.operator_locks
    FOR EACH ROW
    EXECUTE FUNCTION update_operator_locks_updated_at();
