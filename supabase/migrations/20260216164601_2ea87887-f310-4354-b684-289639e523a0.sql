
-- Add tabela_preco_id column to conteudos table
ALTER TABLE public.conteudos
ADD COLUMN tabela_preco_id uuid REFERENCES public.tabelas_preco(id) ON DELETE SET NULL;
