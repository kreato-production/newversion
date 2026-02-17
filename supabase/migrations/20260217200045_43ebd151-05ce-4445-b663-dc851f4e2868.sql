
CREATE TABLE public.severidades_incidencia (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_externo varchar(10),
  titulo varchar NOT NULL,
  descricao text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.severidades_incidencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_severidades_incidencia_select" ON public.severidades_incidencia FOR SELECT USING (true);
CREATE POLICY "auth_severidades_incidencia_insert" ON public.severidades_incidencia FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_severidades_incidencia_update" ON public.severidades_incidencia FOR UPDATE USING (true);
CREATE POLICY "auth_severidades_incidencia_delete" ON public.severidades_incidencia FOR DELETE USING (true);

CREATE TRIGGER update_severidades_incidencia_updated_at
  BEFORE UPDATE ON public.severidades_incidencia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
