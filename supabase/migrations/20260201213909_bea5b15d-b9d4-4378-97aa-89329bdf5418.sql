-- Add orcamento (budget) column to conteudos table
ALTER TABLE public.conteudos 
ADD COLUMN orcamento numeric DEFAULT 0;

-- Add orcamento (budget) column to gravacoes table
ALTER TABLE public.gravacoes 
ADD COLUMN orcamento numeric DEFAULT 0;

-- Add comment to explain the columns
COMMENT ON COLUMN public.conteudos.orcamento IS 'Budget value for the content, currency based on business unit';
COMMENT ON COLUMN public.gravacoes.orcamento IS 'Budget value for the recording, can be distributed from content';