
-- Add parent_recurso_id to link RH rows to specific anchor instances
ALTER TABLE public.gravacao_recursos 
ADD COLUMN parent_recurso_id uuid REFERENCES public.gravacao_recursos(id) ON DELETE CASCADE;

-- Clean existing data to start fresh with the new model
DELETE FROM public.gravacao_recursos;
