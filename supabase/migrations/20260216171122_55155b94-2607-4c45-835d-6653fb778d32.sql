
-- Add quantidade column to conteudo_recursos_tecnicos
ALTER TABLE public.conteudo_recursos_tecnicos
ADD COLUMN quantidade integer NOT NULL DEFAULT 1;

-- Add quantidade column to conteudo_recursos_fisicos
ALTER TABLE public.conteudo_recursos_fisicos
ADD COLUMN quantidade integer NOT NULL DEFAULT 1;
