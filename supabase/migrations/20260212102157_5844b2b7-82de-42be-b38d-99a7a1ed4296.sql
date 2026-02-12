
-- Add recurso_humano_id to profiles to link user to their HR record
ALTER TABLE public.profiles ADD COLUMN recurso_humano_id uuid REFERENCES public.recursos_humanos(id) ON DELETE SET NULL;
