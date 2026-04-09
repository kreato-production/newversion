-- Seed inicial do ambiente local Kreato
-- Credenciais padrao:
-- admin_global / Admin@123
-- admin_tenant / Admin@123

INSERT INTO tenants (id, nome, slug, status)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Kreato Demo',
  'kreato-demo',
  'ATIVO'::tenant_status
WHERE NOT EXISTS (
  SELECT 1 FROM tenants WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
);

INSERT INTO tenant_licenses (id, tenant_id, data_inicio, data_fim)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '2025-01-01T00:00:00Z'::timestamptz,
  '2035-12-31T23:59:59Z'::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_licenses WHERE id = '22222222-2222-2222-2222-222222222222'::uuid
);

INSERT INTO users (
  id,
  tenant_id,
  nome,
  email,
  usuario,
  password_hash,
  perfil,
  descricao,
  role,
  status,
  tipo_acesso
)
SELECT
  '33333333-3333-3333-3333-333333333333'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Administrador Global',
  'admin.global@kreato.local',
  'admin_global',
  '4c96c55b52f4d0febb611d455cd1daaa:91c3e215b5a7d1f87bc688c20a570e602522c84c23dfa6ca0ed60cb43f95f3768817ab1ddc71af0f3512c6eebc1b326dd5b27733020848c764b217c0762763f8',
  'Administrador Global',
  'Usuario administrador global do ambiente local',
  'GLOBAL_ADMIN'::user_role,
  'ATIVO'::user_status,
  'Operacional'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = '33333333-3333-3333-3333-333333333333'::uuid OR usuario = 'admin_global'
);

INSERT INTO users (
  id,
  tenant_id,
  nome,
  email,
  usuario,
  password_hash,
  perfil,
  descricao,
  role,
  status,
  tipo_acesso
)
SELECT
  '44444444-4444-4444-4444-444444444444'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Administrador Tenant',
  'admin.tenant@kreato.local',
  'admin_tenant',
  '4c96c55b52f4d0febb611d455cd1daaa:91c3e215b5a7d1f87bc688c20a570e602522c84c23dfa6ca0ed60cb43f95f3768817ab1ddc71af0f3512c6eebc1b326dd5b27733020848c764b217c0762763f8',
  'Administrador Tenant',
  'Usuario administrador do tenant de testes',
  'TENANT_ADMIN'::user_role,
  'ATIVO'::user_status,
  'Operacional'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = '44444444-4444-4444-4444-444444444444'::uuid OR usuario = 'admin_tenant'
);

INSERT INTO unidades_negocio (
  id,
  tenant_id,
  codigo_externo,
  nome,
  descricao,
  moeda,
  created_by_name
)
SELECT
  '55555555-5555-5555-5555-555555555555'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'UN-001',
  'Unidade Demo',
  'Unidade de negocio padrao para ambiente local',
  'BRL',
  'seed'
WHERE NOT EXISTS (
  SELECT 1 FROM unidades_negocio WHERE id = '55555555-5555-5555-5555-555555555555'::uuid
);

INSERT INTO equipes (
  id,
  tenant_id,
  codigo,
  descricao
)
SELECT
  '66666666-6666-6666-6666-666666666666'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'EQ-001',
  'Equipe padrao de testes'
WHERE NOT EXISTS (
  SELECT 1 FROM equipes WHERE id = '66666666-6666-6666-6666-666666666666'::uuid
);

INSERT INTO programas (
  id,
  tenant_id,
  codigo_externo,
  nome,
  descricao,
  unidade_negocio_id,
  created_by_id
)
SELECT
  '77777777-7777-7777-7777-777777777777'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'PRG-001',
  'Programa Demo',
  'Programa inicial para validacao do ambiente local',
  '55555555-5555-5555-5555-555555555555'::uuid,
  '44444444-4444-4444-4444-444444444444'
WHERE NOT EXISTS (
  SELECT 1 FROM programas WHERE id = '77777777-7777-7777-7777-777777777777'::uuid
);

INSERT INTO gravacoes (
  id,
  tenant_id,
  codigo,
  codigo_externo,
  nome,
  descricao,
  unidade_negocio_id,
  centro_lucro,
  classificacao,
  tipo_conteudo,
  status,
  data_prevista,
  conteudo_id,
  orcamento,
  programa_id,
  created_by_id
)
SELECT
  '88888888-8888-8888-8888-888888888888'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'GRV-001',
  'GRV-EXT-001',
  'Gravacao Demo',
  'Gravacao inicial para testes locais',
  '55555555-5555-5555-5555-555555555555'::uuid,
  'CL-001',
  'Institucional',
  'Video',
  'Planejada',
  '2026-04-15T10:00:00Z'::timestamptz,
  'CONT-001',
  15000.00,
  '77777777-7777-7777-7777-777777777777'::uuid,
  '44444444-4444-4444-4444-444444444444'
WHERE NOT EXISTS (
  SELECT 1 FROM gravacoes WHERE id = '88888888-8888-8888-8888-888888888888'::uuid
);

INSERT INTO turnos (
  id,
  tenant_id,
  nome,
  hora_inicio,
  hora_fim,
  dias_semana,
  pessoas_por_dia,
  cor,
  sigla,
  folgas_por_semana,
  folga_especial,
  descricao,
  dias_trabalhados,
  created_by
)
SELECT
  'turno-demo-manha',
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Turno Manhã',
  '08:00:00'::time,
  '17:00:00'::time,
  '{"dom":0,"seg":1,"ter":1,"qua":1,"qui":1,"sex":1,"sab":0}'::jsonb,
  '{"dom":0,"seg":3,"ter":3,"qua":3,"qui":3,"sex":3,"sab":0}'::jsonb,
  '#3B82F6',
  'TM',
  2,
  '2_domingos_mes',
  'Turno padrao de operacao diurna',
  5,
  'seed'
WHERE NOT EXISTS (
  SELECT 1 FROM turnos WHERE id = 'turno-demo-manha'
);


