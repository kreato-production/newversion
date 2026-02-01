-- 1. Criar tabela para arquivos de fornecedores
CREATE TABLE public.fornecedor_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  url TEXT NOT NULL,
  tipo VARCHAR,
  tamanho INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.fornecedor_arquivos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "auth_fornecedor_arquivos_select" ON public.fornecedor_arquivos
  FOR SELECT USING (true);

CREATE POLICY "auth_fornecedor_arquivos_insert" ON public.fornecedor_arquivos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "auth_fornecedor_arquivos_update" ON public.fornecedor_arquivos
  FOR UPDATE USING (true);

CREATE POLICY "auth_fornecedor_arquivos_delete" ON public.fornecedor_arquivos
  FOR DELETE USING (true);

-- 2. Criar bucket para arquivos de fornecedores
INSERT INTO storage.buckets (id, name, public)
VALUES ('fornecedores', 'fornecedores', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fornecedores bucket
CREATE POLICY "Fornecedor files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'fornecedores');

CREATE POLICY "Authenticated users can upload fornecedor files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fornecedores');

CREATE POLICY "Authenticated users can update fornecedor files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fornecedores');

CREATE POLICY "Authenticated users can delete fornecedor files"
ON storage.objects FOR DELETE
USING (bucket_id = 'fornecedores');

-- 3. Adicionar coluna moeda na tabela unidades_negocio
ALTER TABLE public.unidades_negocio
ADD COLUMN moeda VARCHAR(3) DEFAULT 'BRL';