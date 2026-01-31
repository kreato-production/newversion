-- Create table for stock items of physical resources
CREATE TABLE public.rf_estoque_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurso_fisico_id UUID NOT NULL REFERENCES public.recursos_fisicos(id) ON DELETE CASCADE,
  numerador INTEGER NOT NULL,
  codigo VARCHAR(50),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.rf_estoque_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "auth_rf_estoque_itens_select" ON public.rf_estoque_itens
  FOR SELECT USING (true);

CREATE POLICY "auth_rf_estoque_itens_insert" ON public.rf_estoque_itens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "auth_rf_estoque_itens_update" ON public.rf_estoque_itens
  FOR UPDATE USING (true);

CREATE POLICY "auth_rf_estoque_itens_delete" ON public.rf_estoque_itens
  FOR DELETE USING (true);

-- Add index for better performance
CREATE INDEX idx_rf_estoque_itens_recurso ON public.rf_estoque_itens(recurso_fisico_id);