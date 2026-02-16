
ALTER TABLE public.tabelas_preco ADD COLUMN unidade_negocio_id uuid REFERENCES public.unidades_negocio(id);
