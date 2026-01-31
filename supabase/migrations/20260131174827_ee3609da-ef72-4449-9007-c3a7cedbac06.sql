-- Create servicos table for general service parameters
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  codigo_externo VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "auth_servicos_select" ON public.servicos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_servicos_insert" ON public.servicos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_servicos_update" ON public.servicos
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_servicos_delete" ON public.servicos
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();