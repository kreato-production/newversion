import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();
const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const globalAdminId = '33333333-3333-3333-3333-333333333333';
  const tenantAdminId = '44444444-4444-4444-4444-444444444444';
  const unidadeId = '55555555-5555-5555-5555-555555555555';
  const equipeId = '66666666-6666-6666-6666-666666666666';
  const programaId = '77777777-7777-7777-7777-777777777777';
  const gravacaoId = '88888888-8888-8888-8888-888888888888';
  const licenseId = '22222222-2222-2222-2222-222222222222';
  const turnoId = 'turno-demo-manha';

  const globalPasswordHash = hashPassword('Admin@123');
  const tenantPasswordHash = hashPassword('Admin@123');

  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {
      nome: 'Kreato Demo',
      slug: 'kreato-demo',
      status: 'ATIVO',
    },
    create: {
      id: tenantId,
      nome: 'Kreato Demo',
      slug: 'kreato-demo',
      status: 'ATIVO',
    },
  });

  await prisma.tenantLicense.upsert({
    where: { id: licenseId },
    update: {
      tenantId,
      dataInicio: new Date('2025-01-01T00:00:00.000Z'),
      dataFim: new Date('2035-12-31T23:59:59.000Z'),
    },
    create: {
      id: licenseId,
      tenantId,
      dataInicio: new Date('2025-01-01T00:00:00.000Z'),
      dataFim: new Date('2035-12-31T23:59:59.000Z'),
    },
  });

  await prisma.user.upsert({
    where: { id: globalAdminId },
    update: {
      tenantId,
      nome: 'Administrador Global',
      email: 'admin.global@kreato.local',
      usuario: 'admin_global',
      passwordHash: globalPasswordHash,
      perfil: 'Administrador Global',
      descricao: 'Usuario administrador global do ambiente local',
      role: 'GLOBAL_ADMIN',
      status: 'ATIVO',
      tipoAcesso: 'Operacional',
    },
    create: {
      id: globalAdminId,
      tenantId,
      nome: 'Administrador Global',
      email: 'admin.global@kreato.local',
      usuario: 'admin_global',
      passwordHash: globalPasswordHash,
      perfil: 'Administrador Global',
      descricao: 'Usuario administrador global do ambiente local',
      role: 'GLOBAL_ADMIN',
      status: 'ATIVO',
      tipoAcesso: 'Operacional',
    },
  });

  await prisma.user.upsert({
    where: { id: tenantAdminId },
    update: {
      tenantId,
      nome: 'Administrador Tenant',
      email: 'admin.tenant@kreato.local',
      usuario: 'admin_tenant',
      passwordHash: tenantPasswordHash,
      perfil: 'Administrador Tenant',
      descricao: 'Usuario administrador do tenant de testes',
      role: 'TENANT_ADMIN',
      status: 'ATIVO',
      tipoAcesso: 'Operacional',
    },
    create: {
      id: tenantAdminId,
      tenantId,
      nome: 'Administrador Tenant',
      email: 'admin.tenant@kreato.local',
      usuario: 'admin_tenant',
      passwordHash: tenantPasswordHash,
      perfil: 'Administrador Tenant',
      descricao: 'Usuario administrador do tenant de testes',
      role: 'TENANT_ADMIN',
      status: 'ATIVO',
      tipoAcesso: 'Operacional',
    },
  });

  await prisma.unidadeNegocio.upsert({
    where: { id: unidadeId },
    update: {
      tenantId,
      codigoExterno: 'UN-001',
      nome: 'Unidade Demo',
      descricao: 'Unidade de negocio padrao para ambiente local',
      moeda: 'BRL',
      createdByName: 'seed',
    },
    create: {
      id: unidadeId,
      tenantId,
      codigoExterno: 'UN-001',
      nome: 'Unidade Demo',
      descricao: 'Unidade de negocio padrao para ambiente local',
      moeda: 'BRL',
      createdByName: 'seed',
    },
  });

  await prisma.equipe.upsert({
    where: { id: equipeId },
    update: {
      tenantId,
      codigo: 'EQ-001',
      descricao: 'Equipe padrao de testes',
    },
    create: {
      id: equipeId,
      tenantId,
      codigo: 'EQ-001',
      descricao: 'Equipe padrao de testes',
    },
  });

  await prisma.programa.upsert({
    where: { id: programaId },
    update: {
      tenantId,
      codigoExterno: 'PRG-001',
      nome: 'Programa Demo',
      descricao: 'Programa inicial para validacao do ambiente local',
      unidadeNegocioId: unidadeId,
      createdById: tenantAdminId,
    },
    create: {
      id: programaId,
      tenantId,
      codigoExterno: 'PRG-001',
      nome: 'Programa Demo',
      descricao: 'Programa inicial para validacao do ambiente local',
      unidadeNegocioId: unidadeId,
      createdById: tenantAdminId,
    },
  });

  await prisma.gravacao.upsert({
    where: { id: gravacaoId },
    update: {
      tenantId,
      codigo: 'GRV-001',
      codigoExterno: 'GRV-EXT-001',
      nome: 'Gravacao Demo',
      descricao: 'Gravacao inicial para testes locais',
      unidadeNegocioId: unidadeId,
      centroLucro: 'CL-001',
      classificacao: 'Institucional',
      tipoConteudo: 'Video',
      status: 'Planejada',
      dataPrevista: new Date('2026-04-15T10:00:00.000Z'),
      conteudoId: 'CONT-001',
      orcamento: new Prisma.Decimal('15000.00'),
      programaId,
      createdById: tenantAdminId,
    },
    create: {
      id: gravacaoId,
      tenantId,
      codigo: 'GRV-001',
      codigoExterno: 'GRV-EXT-001',
      nome: 'Gravacao Demo',
      descricao: 'Gravacao inicial para testes locais',
      unidadeNegocioId: unidadeId,
      centroLucro: 'CL-001',
      classificacao: 'Institucional',
      tipoConteudo: 'Video',
      status: 'Planejada',
      dataPrevista: new Date('2026-04-15T10:00:00.000Z'),
      conteudoId: 'CONT-001',
      orcamento: new Prisma.Decimal('15000.00'),
      programaId,
      createdById: tenantAdminId,
    },
  });

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS turnos (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
      nome text NOT NULL,
      hora_inicio time NOT NULL,
      hora_fim time NOT NULL,
      dias_semana jsonb NOT NULL DEFAULT '{}'::jsonb,
      pessoas_por_dia jsonb NOT NULL DEFAULT '{}'::jsonb,
      cor text NOT NULL DEFAULT '#3B82F6',
      sigla text NULL,
      folgas_por_semana integer NOT NULL DEFAULT 0,
      folga_especial text NULL,
      descricao text NULL,
      dias_trabalhados integer NULL,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW(),
      created_by text NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS turnos_tenant_nome_key
    ON turnos (tenant_id, LOWER(nome))
  `);

  await prisma.$executeRaw`
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
      created_at,
      updated_at,
      created_by
    ) VALUES (
      ${turnoId},
      ${tenantId},
      ${'Turno Manhã'},
      ${'08:00:00'}::time,
      ${'17:00:00'}::time,
      ${JSON.stringify({ dom: 0, seg: 1, ter: 1, qua: 1, qui: 1, sex: 1, sab: 0 })}::jsonb,
      ${JSON.stringify({ dom: 0, seg: 3, ter: 3, qua: 3, qui: 3, sex: 3, sab: 0 })}::jsonb,
      ${'#3B82F6'},
      ${'TM'},
      ${2},
      ${'2_domingos_mes'},
      ${'Turno padrao de operacao diurna'},
      ${5},
      NOW(),
      NOW(),
      ${'seed'}
    )
    ON CONFLICT (id) DO UPDATE
    SET
      tenant_id = EXCLUDED.tenant_id,
      nome = EXCLUDED.nome,
      hora_inicio = EXCLUDED.hora_inicio,
      hora_fim = EXCLUDED.hora_fim,
      dias_semana = EXCLUDED.dias_semana,
      pessoas_por_dia = EXCLUDED.pessoas_por_dia,
      cor = EXCLUDED.cor,
      sigla = EXCLUDED.sigla,
      folgas_por_semana = EXCLUDED.folgas_por_semana,
      folga_especial = EXCLUDED.folga_especial,
      descricao = EXCLUDED.descricao,
      dias_trabalhados = EXCLUDED.dias_trabalhados,
      updated_at = NOW(),
      created_by = EXCLUDED.created_by
  `;

  console.log('Seed local concluido. Credenciais: admin_global / Admin@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


