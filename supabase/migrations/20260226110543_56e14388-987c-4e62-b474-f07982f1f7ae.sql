
-- Create temp mapping table
CREATE TEMP TABLE funcao_mapping AS
SELECT f.id AS old_id, f.nome, t.id AS tenant_id, gen_random_uuid() AS new_id
FROM public.funcoes f
CROSS JOIN public.tenants t
WHERE f.tenant_id IS NULL;

-- Insert new tenant-scoped functions
INSERT INTO public.funcoes (id, nome, descricao, codigo_externo, tenant_id, created_by, created_at, updated_at)
SELECT m.new_id, f.nome, f.descricao, f.codigo_externo, m.tenant_id, f.created_by, f.created_at, f.updated_at
FROM funcao_mapping m
JOIN public.funcoes f ON f.id = m.old_id;

-- Update recursos_humanos references (with tenant match)
UPDATE public.recursos_humanos rh
SET funcao_id = m.new_id
FROM funcao_mapping m
WHERE rh.funcao_id = m.old_id
AND rh.tenant_id = m.tenant_id;

-- Update recursos_humanos without tenant (fallback)
UPDATE public.recursos_humanos rh
SET funcao_id = (SELECT m.new_id FROM funcao_mapping m WHERE m.old_id = rh.funcao_id LIMIT 1)
WHERE rh.funcao_id IN (SELECT old_id FROM funcao_mapping)
AND rh.tenant_id IS NULL;

-- Update departamento_funcoes references
UPDATE public.departamento_funcoes df
SET funcao_id = m.new_id
FROM funcao_mapping m
WHERE df.funcao_id = m.old_id
AND df.tenant_id = m.tenant_id;

UPDATE public.departamento_funcoes df
SET funcao_id = (SELECT m.new_id FROM funcao_mapping m WHERE m.old_id = df.funcao_id LIMIT 1)
WHERE df.funcao_id IN (SELECT old_id FROM funcao_mapping)
AND df.tenant_id IS NULL;

-- Update recursos_tecnicos references
UPDATE public.recursos_tecnicos rt
SET funcao_operador_id = m.new_id
FROM funcao_mapping m
WHERE rt.funcao_operador_id = m.old_id
AND rt.tenant_id = m.tenant_id;

UPDATE public.recursos_tecnicos rt
SET funcao_operador_id = (SELECT m.new_id FROM funcao_mapping m WHERE m.old_id = rt.funcao_operador_id LIMIT 1)
WHERE rt.funcao_operador_id IN (SELECT old_id FROM funcao_mapping)
AND rt.tenant_id IS NULL;

-- Delete original records without tenant
DELETE FROM public.funcoes WHERE tenant_id IS NULL;

DROP TABLE funcao_mapping;
