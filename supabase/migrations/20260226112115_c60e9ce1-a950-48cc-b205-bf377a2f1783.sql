
-- Drop global unique constraint on nome
ALTER TABLE public.status_gravacao DROP CONSTRAINT status_gravacao_nome_key;

-- Add tenant-scoped unique constraint
ALTER TABLE public.status_gravacao ADD CONSTRAINT status_gravacao_nome_tenant_key UNIQUE (nome, tenant_id);
