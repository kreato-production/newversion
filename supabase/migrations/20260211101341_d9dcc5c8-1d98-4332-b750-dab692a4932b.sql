
-- Create equipes table
CREATE TABLE public.equipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo character varying NOT NULL,
  descricao character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create junction table for equipe members
CREATE TABLE public.equipe_membros (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id uuid NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  recurso_humano_id uuid NOT NULL REFERENCES public.recursos_humanos(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (equipe_id, recurso_humano_id)
);

-- Enable RLS
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_membros ENABLE ROW LEVEL SECURITY;

-- RLS policies for equipes
CREATE POLICY "auth_equipes_select" ON public.equipes FOR SELECT USING (true);
CREATE POLICY "auth_equipes_insert" ON public.equipes FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_equipes_update" ON public.equipes FOR UPDATE USING (true);
CREATE POLICY "auth_equipes_delete" ON public.equipes FOR DELETE USING (true);

-- RLS policies for equipe_membros
CREATE POLICY "auth_equipe_membros_select" ON public.equipe_membros FOR SELECT USING (true);
CREATE POLICY "auth_equipe_membros_insert" ON public.equipe_membros FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_equipe_membros_delete" ON public.equipe_membros FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_equipes_updated_at
BEFORE UPDATE ON public.equipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
