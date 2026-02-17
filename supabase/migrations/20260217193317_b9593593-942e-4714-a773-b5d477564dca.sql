
-- Categorias de Incidência
CREATE TABLE public.categorias_incidencia (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_externo varchar(10),
  titulo varchar NOT NULL,
  descricao text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.categorias_incidencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_categorias_incidencia_select" ON public.categorias_incidencia FOR SELECT USING (true);
CREATE POLICY "auth_categorias_incidencia_insert" ON public.categorias_incidencia FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_categorias_incidencia_update" ON public.categorias_incidencia FOR UPDATE USING (true);
CREATE POLICY "auth_categorias_incidencia_delete" ON public.categorias_incidencia FOR DELETE USING (true);

CREATE TRIGGER update_categorias_incidencia_updated_at
  BEFORE UPDATE ON public.categorias_incidencia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Classificações de Incidência (child of categorias_incidencia)
CREATE TABLE public.classificacoes_incidencia (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_incidencia_id uuid NOT NULL REFERENCES public.categorias_incidencia(id) ON DELETE CASCADE,
  codigo_externo varchar(10),
  titulo varchar NOT NULL,
  descricao text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.classificacoes_incidencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_classificacoes_incidencia_select" ON public.classificacoes_incidencia FOR SELECT USING (true);
CREATE POLICY "auth_classificacoes_incidencia_insert" ON public.classificacoes_incidencia FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_classificacoes_incidencia_update" ON public.classificacoes_incidencia FOR UPDATE USING (true);
CREATE POLICY "auth_classificacoes_incidencia_delete" ON public.classificacoes_incidencia FOR DELETE USING (true);

CREATE TRIGGER update_classificacoes_incidencia_updated_at
  BEFORE UPDATE ON public.classificacoes_incidencia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
