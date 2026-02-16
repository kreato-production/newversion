
-- Table to store planned third-party services per content
CREATE TABLE public.conteudo_terceiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conteudo_id UUID NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  valor_previsto NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID DEFAULT NULL,
  UNIQUE(conteudo_id, servico_id)
);

-- Enable RLS
ALTER TABLE public.conteudo_terceiros ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "auth_conteudo_terceiros_select" ON public.conteudo_terceiros FOR SELECT USING (true);
CREATE POLICY "auth_conteudo_terceiros_insert" ON public.conteudo_terceiros FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_conteudo_terceiros_update" ON public.conteudo_terceiros FOR UPDATE USING (true);
CREATE POLICY "auth_conteudo_terceiros_delete" ON public.conteudo_terceiros FOR DELETE USING (true);
