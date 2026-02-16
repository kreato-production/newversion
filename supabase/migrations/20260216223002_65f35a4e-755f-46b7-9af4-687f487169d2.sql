
-- Add servico_id FK to fornecedor_servicos linking to servicos table
ALTER TABLE public.fornecedor_servicos 
ADD COLUMN servico_id uuid REFERENCES public.servicos(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_fornecedor_servicos_servico_id ON public.fornecedor_servicos(servico_id);
