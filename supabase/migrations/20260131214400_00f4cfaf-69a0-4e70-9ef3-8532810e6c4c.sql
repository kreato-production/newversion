-- Criar o trigger para gerar código automaticamente ao inserir uma nova gravação
CREATE TRIGGER trigger_generate_gravacao_codigo
  BEFORE INSERT ON public.gravacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_gravacao_codigo();