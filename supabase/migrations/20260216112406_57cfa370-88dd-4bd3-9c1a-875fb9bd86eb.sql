
-- Add is_inicial column to status_tarefa
ALTER TABLE public.status_tarefa ADD COLUMN is_inicial boolean NOT NULL DEFAULT false;

-- Add is_inicial column to status_gravacao  
ALTER TABLE public.status_gravacao ADD COLUMN is_inicial boolean NOT NULL DEFAULT false;

-- Create unique partial index to ensure only one initial status per table
CREATE UNIQUE INDEX idx_status_tarefa_unico_inicial ON public.status_tarefa (is_inicial) WHERE is_inicial = true;
CREATE UNIQUE INDEX idx_status_gravacao_unico_inicial ON public.status_gravacao (is_inicial) WHERE is_inicial = true;

-- Function to enforce single initial status for status_tarefa
CREATE OR REPLACE FUNCTION public.enforce_single_inicial_status_tarefa()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_inicial = true THEN
    UPDATE public.status_tarefa SET is_inicial = false WHERE id != NEW.id AND is_inicial = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to enforce single initial status for status_gravacao
CREATE OR REPLACE FUNCTION public.enforce_single_inicial_status_gravacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_inicial = true THEN
    UPDATE public.status_gravacao SET is_inicial = false WHERE id != NEW.id AND is_inicial = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers
CREATE TRIGGER trg_enforce_single_inicial_status_tarefa
BEFORE INSERT OR UPDATE ON public.status_tarefa
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_inicial_status_tarefa();

CREATE TRIGGER trg_enforce_single_inicial_status_gravacao
BEFORE INSERT OR UPDATE ON public.status_gravacao
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_inicial_status_gravacao();
