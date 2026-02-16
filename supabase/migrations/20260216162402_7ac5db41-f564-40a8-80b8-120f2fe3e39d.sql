
-- Tabela principal de Tabelas de Preço
CREATE TABLE public.tabelas_preco (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_externo VARCHAR NULL,
  nome VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'Ativo',
  vigencia_inicio DATE NULL,
  vigencia_fim DATE NULL,
  descricao TEXT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  created_by UUID NULL
);

ALTER TABLE public.tabelas_preco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_tabelas_preco_select" ON public.tabelas_preco FOR SELECT USING (true);
CREATE POLICY "auth_tabelas_preco_insert" ON public.tabelas_preco FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_tabelas_preco_update" ON public.tabelas_preco FOR UPDATE USING (true);
CREATE POLICY "auth_tabelas_preco_delete" ON public.tabelas_preco FOR DELETE USING (true);

CREATE TRIGGER update_tabelas_preco_updated_at
  BEFORE UPDATE ON public.tabelas_preco
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Itens de Recursos Técnicos na Tabela de Preço
CREATE TABLE public.tabela_preco_recursos_tecnicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_preco_id UUID NOT NULL REFERENCES public.tabelas_preco(id) ON DELETE CASCADE,
  recurso_tecnico_id UUID NOT NULL REFERENCES public.recursos_tecnicos(id) ON DELETE CASCADE,
  valor_hora NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NULL DEFAULT now()
);

ALTER TABLE public.tabela_preco_recursos_tecnicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_tp_rt_select" ON public.tabela_preco_recursos_tecnicos FOR SELECT USING (true);
CREATE POLICY "auth_tp_rt_insert" ON public.tabela_preco_recursos_tecnicos FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_tp_rt_update" ON public.tabela_preco_recursos_tecnicos FOR UPDATE USING (true);
CREATE POLICY "auth_tp_rt_delete" ON public.tabela_preco_recursos_tecnicos FOR DELETE USING (true);

-- Itens de Recursos Físicos na Tabela de Preço
CREATE TABLE public.tabela_preco_recursos_fisicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_preco_id UUID NOT NULL REFERENCES public.tabelas_preco(id) ON DELETE CASCADE,
  recurso_fisico_id UUID NOT NULL REFERENCES public.recursos_fisicos(id) ON DELETE CASCADE,
  valor_hora NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NULL DEFAULT now()
);

ALTER TABLE public.tabela_preco_recursos_fisicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_tp_rf_select" ON public.tabela_preco_recursos_fisicos FOR SELECT USING (true);
CREATE POLICY "auth_tp_rf_insert" ON public.tabela_preco_recursos_fisicos FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_tp_rf_update" ON public.tabela_preco_recursos_fisicos FOR UPDATE USING (true);
CREATE POLICY "auth_tp_rf_delete" ON public.tabela_preco_recursos_fisicos FOR DELETE USING (true);
