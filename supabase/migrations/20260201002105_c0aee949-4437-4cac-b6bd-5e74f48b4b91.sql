-- Permitir alocação de colaborador em recurso técnico (recurso_tecnico_id + recurso_humano_id)
-- A constraint atual impede esse caso e faz o insert falhar silenciosamente no app.

ALTER TABLE public.gravacao_recursos
DROP CONSTRAINT IF EXISTS gravacao_recursos_check;

ALTER TABLE public.gravacao_recursos
ADD CONSTRAINT gravacao_recursos_check
CHECK (
  (
    recurso_humano_id IS NOT NULL
    AND recurso_tecnico_id IS NULL
    AND recurso_fisico_id IS NULL
  )
  OR (
    recurso_humano_id IS NULL
    AND recurso_tecnico_id IS NOT NULL
    AND recurso_fisico_id IS NULL
  )
  OR (
    recurso_humano_id IS NULL
    AND recurso_tecnico_id IS NULL
    AND recurso_fisico_id IS NOT NULL
  )
  OR (
    recurso_humano_id IS NOT NULL
    AND recurso_tecnico_id IS NOT NULL
    AND recurso_fisico_id IS NULL
  )
);