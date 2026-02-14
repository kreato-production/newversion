
-- Table to store form field validation configurations (required/suggested)
CREATE TABLE public.formulario_campos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario VARCHAR NOT NULL,
  campo VARCHAR NOT NULL,
  tipo_validacao VARCHAR NULL CHECK (tipo_validacao IN ('obrigatorio', 'sugerido')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(formulario, campo)
);

-- Enable RLS
ALTER TABLE public.formulario_campos ENABLE ROW LEVEL SECURITY;

-- Policies - authenticated users can read, admins can modify
CREATE POLICY "auth_formulario_campos_select" ON public.formulario_campos
  FOR SELECT USING (true);

CREATE POLICY "auth_formulario_campos_insert" ON public.formulario_campos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "auth_formulario_campos_update" ON public.formulario_campos
  FOR UPDATE USING (true);

CREATE POLICY "auth_formulario_campos_delete" ON public.formulario_campos
  FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_formulario_campos_updated_at
  BEFORE UPDATE ON public.formulario_campos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
