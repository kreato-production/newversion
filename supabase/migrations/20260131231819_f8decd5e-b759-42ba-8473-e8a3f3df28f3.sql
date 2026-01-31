-- Add hora_inicio and hora_fim columns to tarefas table
ALTER TABLE public.tarefas
ADD COLUMN hora_inicio time without time zone,
ADD COLUMN hora_fim time without time zone;