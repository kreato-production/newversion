
-- Step 1: Drop the global unique constraint
ALTER TABLE public.funcoes DROP CONSTRAINT funcoes_nome_key;

-- Step 2: Add tenant-scoped unique constraint
ALTER TABLE public.funcoes ADD CONSTRAINT funcoes_nome_tenant_key UNIQUE (nome, tenant_id);
