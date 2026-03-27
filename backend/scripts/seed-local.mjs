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


