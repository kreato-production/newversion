
-- Table for technical resources linked to content via price table
CREATE TABLE public.conteudo_recursos_tecnicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conteudo_id UUID NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  recurso_tecnico_id UUID NOT NULL REFERENCES public.recursos_tecnicos(id) ON DELETE CASCADE,
  tabela_preco_id UUID NOT NULL REFERENCES public.tabelas_preco(id) ON DELETE CASCADE,
  valor_hora NUMERIC NOT NULL DEFAULT 0,
  quantidade_horas NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  desconto_percentual NUMERIC NOT NULL DEFAULT 0,
  valor_com_desconto NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID DEFAULT NULL
);

-- Table for physical resources linked to content via price table
CREATE TABLE public.conteudo_recursos_fisicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conteudo_id UUID NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  recurso_fisico_id UUID NOT NULL REFERENCES public.recursos_fisicos(id) ON DELETE CASCADE,
  tabela_preco_id UUID NOT NULL REFERENCES public.tabelas_preco(id) ON DELETE CASCADE,
  valor_hora NUMERIC NOT NULL DEFAULT 0,
  quantidade_horas NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  desconto_percentual NUMERIC NOT NULL DEFAULT 0,
  valor_com_desconto NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.conteudo_recursos_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudo_recursos_fisicos ENABLE ROW LEVEL SECURITY;

-- RLS policies for conteudo_recursos_tecnicos
CREATE POLICY "auth_conteudo_rt_select" ON public.conteudo_recursos_tecnicos FOR SELECT USING (true);
CREATE POLICY "auth_conteudo_rt_insert" ON public.conteudo_recursos_tecnicos FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_conteudo_rt_update" ON public.conteudo_recursos_tecnicos FOR UPDATE USING (true);
CREATE POLICY "auth_conteudo_rt_delete" ON public.conteudo_recursos_tecnicos FOR DELETE USING (true);

-- RLS policies for conteudo_recursos_fisicos
CREATE POLICY "auth_conteudo_rf_select" ON public.conteudo_recursos_fisicos FOR SELECT USING (true);
CREATE POLICY "auth_conteudo_rf_insert" ON public.conteudo_recursos_fisicos FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_conteudo_rf_update" ON public.conteudo_recursos_fisicos FOR UPDATE USING (true);
CREATE POLICY "auth_conteudo_rf_delete" ON public.conteudo_recursos_fisicos FOR DELETE USING (true);
