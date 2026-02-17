
-- Create incidencias_gravacao table
CREATE TABLE public.incidencias_gravacao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_externo varchar(10),
  titulo varchar NOT NULL,
  gravacao_id uuid REFERENCES public.gravacoes(id),
  recurso_fisico_id uuid REFERENCES public.recursos_fisicos(id),
  severidade_id uuid REFERENCES public.severidades_incidencia(id),
  impacto_id uuid REFERENCES public.impactos_incidencia(id),
  categoria_id uuid REFERENCES public.categorias_incidencia(id),
  classificacao_id uuid REFERENCES public.classificacoes_incidencia(id),
  data_incidencia date,
  horario_incidencia time without time zone,
  tempo_incidencia interval,
  descricao text,
  causa_provavel text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidencias_gravacao ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "auth_incidencias_gravacao_select" ON public.incidencias_gravacao FOR SELECT USING (true);
CREATE POLICY "auth_incidencias_gravacao_insert" ON public.incidencias_gravacao FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_incidencias_gravacao_update" ON public.incidencias_gravacao FOR UPDATE USING (true);
CREATE POLICY "auth_incidencias_gravacao_delete" ON public.incidencias_gravacao FOR DELETE USING (true);

-- Updated_at trigger
CREATE TRIGGER update_incidencias_gravacao_updated_at
  BEFORE UPDATE ON public.incidencias_gravacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create attachments table
CREATE TABLE public.incidencia_anexos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incidencia_id uuid NOT NULL REFERENCES public.incidencias_gravacao(id) ON DELETE CASCADE,
  nome varchar NOT NULL,
  url text NOT NULL,
  tipo varchar,
  tamanho integer,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.incidencia_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_incidencia_anexos_select" ON public.incidencia_anexos FOR SELECT USING (true);
CREATE POLICY "auth_incidencia_anexos_insert" ON public.incidencia_anexos FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_incidencia_anexos_delete" ON public.incidencia_anexos FOR DELETE USING (true);

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('incidencias', 'incidencias', true);

-- Storage policies
CREATE POLICY "incidencias_select" ON storage.objects FOR SELECT USING (bucket_id = 'incidencias');
CREATE POLICY "incidencias_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'incidencias');
CREATE POLICY "incidencias_delete" ON storage.objects FOR DELETE USING (bucket_id = 'incidencias');
