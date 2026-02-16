
-- Add weekly frequency columns to conteudos
ALTER TABLE public.conteudos
  ADD COLUMN frequencia_data_inicio DATE DEFAULT NULL,
  ADD COLUMN frequencia_data_fim DATE DEFAULT NULL,
  ADD COLUMN frequencia_dias_semana INTEGER[] DEFAULT NULL;
