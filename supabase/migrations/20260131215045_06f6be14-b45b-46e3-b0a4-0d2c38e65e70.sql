-- Criar tabela de associação entre centros de lucro e unidades de negócio
CREATE TABLE public.centro_lucro_unidades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  centro_lucro_id uuid NOT NULL REFERENCES public.centros_lucro(id) ON DELETE CASCADE,
  unidade_negocio_id uuid NOT NULL REFERENCES public.unidades_negocio(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(centro_lucro_id, unidade_negocio_id)
);

-- Habilitar RLS
ALTER TABLE public.centro_lucro_unidades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "auth_centro_lucro_unidades_select" ON public.centro_lucro_unidades
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_centro_lucro_unidades_insert" ON public.centro_lucro_unidades
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_centro_lucro_unidades_delete" ON public.centro_lucro_unidades
  FOR DELETE TO authenticated USING (true);