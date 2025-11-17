-- Add blur capability to photos

ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS is_blurred boolean DEFAULT true;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS blur_level integer DEFAULT 6;

-- RLS remains as defined; operators/admin can moderate per existing policies
