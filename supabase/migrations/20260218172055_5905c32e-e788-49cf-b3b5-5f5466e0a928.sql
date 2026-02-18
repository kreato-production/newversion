
-- Create programas table
CREATE TABLE public.programas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_externo VARCHAR(10),
  nome VARCHAR(200) NOT NULL,
  unidade_negocio_id UUID REFERENCES public.unidades_negocio(id),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_programas_select" ON public.programas FOR SELECT USING (true);
CREATE POLICY "auth_programas_insert" ON public.programas FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_programas_update" ON public.programas FOR UPDATE USING (true);
CREATE POLICY "auth_programas_delete" ON public.programas FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_programas_updated_at
  BEFORE UPDATE ON public.programas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create usuario_programas table (links users to programs they can access)
CREATE TABLE public.usuario_programas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  programa_id UUID NOT NULL REFERENCES public.programas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(usuario_id, programa_id)
);

ALTER TABLE public.usuario_programas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_usuario_programas_select" ON public.usuario_programas FOR SELECT USING (true);
CREATE POLICY "auth_usuario_programas_insert" ON public.usuario_programas FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_usuario_programas_delete" ON public.usuario_programas FOR DELETE USING (true);

-- Add programa_id to conteudos
ALTER TABLE public.conteudos ADD COLUMN programa_id UUID REFERENCES public.programas(id);

-- Add programa_id to gravacoes
ALTER TABLE public.gravacoes ADD COLUMN programa_id UUID REFERENCES public.programas(id);
