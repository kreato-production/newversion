-- Create table for script scenes (cenas de roteiro)
CREATE TABLE public.gravacao_cenas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gravacao_id UUID NOT NULL REFERENCES public.gravacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  capitulo VARCHAR,
  numero_cena VARCHAR,
  ambiente VARCHAR,
  tipo_ambiente VARCHAR CHECK (tipo_ambiente IN ('Externo', 'Interno', '')),
  periodo VARCHAR,
  local_gravacao VARCHAR,
  personagens TEXT[] DEFAULT '{}',
  figurantes TEXT[] DEFAULT '{}',
  tempo_aproximado VARCHAR,
  ritmo VARCHAR,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gravacao_cenas ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "auth_gravacao_cenas_select" ON public.gravacao_cenas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_gravacao_cenas_insert" ON public.gravacao_cenas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_gravacao_cenas_update" ON public.gravacao_cenas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_gravacao_cenas_delete" ON public.gravacao_cenas
  FOR DELETE TO authenticated USING (true);

-- Create index for faster queries
CREATE INDEX idx_gravacao_cenas_gravacao_id ON public.gravacao_cenas(gravacao_id);
CREATE INDEX idx_gravacao_cenas_ordem ON public.gravacao_cenas(gravacao_id, ordem);