/**
 * GET /<recurso>/:id routes added for the form pages:
 * SPRINT-20 — feriados, recursos-tecnicos, satops/estados-evento, satops/alertas;
 * SPRINT-21 — departamentos, equipes, espacos, figurinos, fornecedores, turnos, recursos-fisicos;
 * SPRINT-22 — unidades, users, contas-pagar, parametrizacoes/centros-lucro (tenants: see below);
 * SPRINT-23 — programas, tarefas, tabelas-preco, incidencias-gravacao (+ templates, already existing).
 */
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { OTHER_TENANT_ID, TEST_TENANT_ID, createRouteAuthService, loginHeaders } from './route-auth.js';
import { FeriadosService } from '../modules/feriados/feriados.service.js';
import type { FeriadoRecord, FeriadosRepository } from '../modules/feriados/feriados.repository.js';
import { RecursosTecnicosService } from '../modules/recursos-tecnicos/recursos-tecnicos.service.js';
import type {
  RecursoTecnicoRecord,
  RecursosTecnicosRepository,
} from '../modules/recursos-tecnicos/recursos-tecnicos.repository.js';
import { EstadosEventoService } from '../modules/satops/satops.service.js';
import type { EstadoEventoRecord, EstadosEventoRepository } from '../modules/satops/satops.repository.js';
import { AlertasService } from '../modules/satops/alertas.service.js';
import type { AlertaRecord, AlertasRepository } from '../modules/satops/alertas.repository.js';
import { DepartamentosService } from '../modules/departamentos/departamentos.service.js';
import type { DepartamentosRepository } from '../modules/departamentos/departamentos.repository.js';
import { EquipesService } from '../modules/equipes/equipes.service.js';
import type { EquipesRepository } from '../modules/equipes/equipes.repository.js';
import { EspacosService } from '../modules/espacos/espacos.service.js';
import type { EspacosRepository } from '../modules/espacos/espacos.repository.js';
import { FigurinosService } from '../modules/figurinos/figurinos.service.js';
import type { FigurinosRepository } from '../modules/figurinos/figurinos.repository.js';
import { FornecedoresService } from '../modules/fornecedores/fornecedores.service.js';
import type { FornecedoresRepository } from '../modules/fornecedores/fornecedores.repository.js';
import { TurnosService } from '../modules/turnos/turnos.service.js';
import type { TurnosRepository } from '../modules/turnos/turnos.repository.js';
import { RecursosFisicosService } from '../modules/recursos-fisicos/recursos-fisicos.service.js';
import type { RecursosFisicosRepository } from '../modules/recursos-fisicos/recursos-fisicos.repository.js';
import { UnidadesService } from '../modules/unidades/unidades.service.js';
import type { UnidadesRepository } from '../modules/unidades/unidades.repository.js';
import { UsersService } from '../modules/users/users.service.js';
import type { UsersRepository } from '../modules/users/users.repository.js';
import { TenantsService } from '../modules/tenants/tenants.service.js';
import type { TenantsRepository } from '../modules/tenants/tenants.repository.js';
import { ContasPagarService } from '../modules/contas-pagar/contas-pagar.service.js';
import type { ContasPagarRepository } from '../modules/contas-pagar/contas-pagar.repository.js';
import { ParametrizacoesService } from '../modules/parametrizacoes/parametrizacoes.service.js';
import { ProgramasService } from '../modules/programas/programas.service.js';
import type { ProgramasRepository } from '../modules/programas/programas.repository.js';
import { TarefasService } from '../modules/tarefas/tarefas.service.js';
import type { TarefasRepository } from '../modules/tarefas/tarefas.repository.js';
import { TabelasPrecoService } from '../modules/tabelas-preco/tabelas-preco.service.js';
import type { TabelasPrecoRepository } from '../modules/tabelas-preco/tabelas-preco.repository.js';
import { IncidenciasGravacaoService } from '../modules/incidencias-gravacao/incidencias-gravacao.service.js';
import type { IncidenciasGravacaoRepository } from '../modules/incidencias-gravacao/incidencias-gravacao.repository.js';
import { TemplatesService } from '../modules/templates/templates.service.js';
import type { TemplatesRepository } from '../modules/templates/templates.repository.js';
import type { PrismaParametrizacoesRepository } from '../modules/parametrizacoes/parametrizacoes.repository.js';

const OWN = '44444444-4444-4444-4444-444444444444';
const FOREIGN = '55555555-5555-5555-5555-555555555555';
const MISSING = '66666666-6666-6666-6666-666666666666';
const CREATED_AT = new Date('2026-11-10T12:00:00.000Z');

/** Only `findById` is exercised by these routes; tenant-scoped finders receive the tenant. */
function fakeRepository<T extends { id: string; tenantId: string }>(records: T[], tenantScoped = false) {
  return {
    findById: async (id: string, tenantId?: string) =>
      records.find((r) => r.id === id && (!tenantScoped || r.tenantId === tenantId)) ?? null,
  };
}

const feriado = (id: string, tenantId: string): FeriadoRecord => ({
  id,
  tenantId,
  data: '2026-12-25',
  feriado: 'Natal',
  observacoes: null,
  traducoes: { en: 'Christmas' },
  createdAt: CREATED_AT,
  createdBy: 'Ana Silva',
});
const recursoTecnico = (id: string, tenantId: string): RecursoTecnicoRecord => ({
  id,
  tenantId,
  codigoExterno: 'CAM1',
  nome: 'Câmera 4K',
  funcaoOperadorId: 'f1',
  funcaoOperadorNome: 'Operador de Câmera',
  createdAt: CREATED_AT,
  createdBy: 'user-1',
  createdByNome: 'Ana Silva',
});
const estado = (id: string, tenantId: string): EstadoEventoRecord => ({
  id,
  tenantId,
  codigoExterno: 'AT',
  nome: 'Ativo',
  cor: '#00ff00',
  traducoes: null,
  createdAt: CREATED_AT,
  createdBy: 'Ana Silva',
});
const alerta = (id: string, tenantId: string): AlertaRecord => ({
  id,
  tenantId,
  nome: 'Fecho em 30 min',
  tempoParaAlerta: '00:30:00',
  regra: 'Antes',
  campoReferencia: 'fechoPrevisto',
  createdAt: CREATED_AT,
  createdBy: 'Ana Silva',
});

/** Minimal record for the SPRINT-21 modules: only what their DTO mappers dereference. */
const generic = (id: string, tenantId: string) => ({
  id,
  tenantId,
  nome: 'Registro',
  codigo: 'R1',
  descricao: 'Registro de teste',
  createdAt: CREATED_AT,
  imagens: [],
  estoqueItens: [],
  faixasDisponibilidade: [],
  diasSemana: {},
  pessoasPorDia: {},
  email: 'registro@kreato.app',
  usuario: 'registro',
  status: 'ATIVO',
  role: 'OPERADOR',
  tipoAcesso: 'Operacional',
});
const genericRepo = <T>(extra: Record<string, unknown> = {}) =>
  ({
    ...fakeRepository([generic(OWN, TEST_TENANT_ID), generic(FOREIGN, OTHER_TENANT_ID)]),
    ...extra,
  }) as unknown as T;

let app: FastifyInstance;
let headers: Record<string, string>;

// One app + one login for the whole file: the login route rate-limits per user.
beforeAll(async () => {
  app = await buildApp({
    authService: createRouteAuthService(),
    feriadosService: new FeriadosService(
      fakeRepository([feriado(OWN, TEST_TENANT_ID), feriado(FOREIGN, OTHER_TENANT_ID)]) as unknown as FeriadosRepository,
    ),
    recursosTecnicosService: new RecursosTecnicosService(
      fakeRepository([
        recursoTecnico(OWN, TEST_TENANT_ID),
        recursoTecnico(FOREIGN, OTHER_TENANT_ID),
      ]) as unknown as RecursosTecnicosRepository,
    ),
    estadosEventoService: new EstadosEventoService(
      fakeRepository([estado(OWN, TEST_TENANT_ID), estado(FOREIGN, OTHER_TENANT_ID)], true) as unknown as EstadosEventoRepository,
    ),
    departamentosService: new DepartamentosService(genericRepo<DepartamentosRepository>()),
    equipesService: new EquipesService(
      genericRepo<EquipesRepository>({ countMembros: async () => ({ [OWN]: 3 }) }),
    ),
    espacosService: new EspacosService(genericRepo<EspacosRepository>()),
    figurinosService: new FigurinosService(genericRepo<FigurinosRepository>()),
    fornecedoresService: new FornecedoresService(genericRepo<FornecedoresRepository>()),
    turnosService: new TurnosService(genericRepo<TurnosRepository>()),
    recursosFisicosService: new RecursosFisicosService(genericRepo<RecursosFisicosRepository>()),
    unidadesService: new UnidadesService(genericRepo<UnidadesRepository>()),
    usersService: new UsersService(genericRepo<UsersRepository>()),
    contasPagarService: new ContasPagarService(
      fakeRepository([generic(OWN, TEST_TENANT_ID), generic(FOREIGN, OTHER_TENANT_ID)], true) as unknown as ContasPagarRepository,
    ),
    parametrizacoesService: new ParametrizacoesService({
      findCentroLucro: async (id: string) =>
        [OWN, FOREIGN].includes(id)
          ? {
              id,
              tenant_id: id === OWN ? TEST_TENANT_ID : OTHER_TENANT_ID,
              codigo_externo: 'CL1',
              nome: 'Centro',
              descricao: null,
              status: 'Ativo',
              parent_id: null,
              traducoes: null,
              created_at: CREATED_AT,
              created_by: null,
            }
          : null,
    } as unknown as PrismaParametrizacoesRepository),
    programasService: new ProgramasService(genericRepo<ProgramasRepository>()),
    tarefasService: new TarefasService(genericRepo<TarefasRepository>()),
    tabelasPrecoService: new TabelasPrecoService(genericRepo<TabelasPrecoRepository>()),
    incidenciasGravacaoService: new IncidenciasGravacaoService(genericRepo<IncidenciasGravacaoRepository>()),
    templatesService: new TemplatesService(genericRepo<TemplatesRepository>()),
    alertasService: new AlertasService(
      fakeRepository([alerta(OWN, TEST_TENANT_ID), alerta(FOREIGN, OTHER_TENANT_ID)], true) as unknown as AlertasRepository,
    ),
  });
  headers = await loginHeaders(app);
});

afterAll(async () => {
  await app.close();
});

const CASES: Array<{ path: string; expected: Record<string, unknown>; foreignStatus: number }> = [
  {
    path: '/feriados',
    expected: { data: '2026-12-25', feriado: 'Natal', traducoes: { en: 'Christmas' } },
    foreignStatus: 403,
  },
  {
    path: '/recursos-tecnicos',
    expected: { codigoExterno: 'CAM1', nome: 'Câmera 4K', funcaoOperadorId: 'f1' },
    foreignStatus: 403,
  },
  // SatOps finders are tenant-scoped: another tenant's record is simply not found.
  { path: '/satops/estados-evento', expected: { codigoExterno: 'AT', nome: 'Ativo' }, foreignStatus: 404 },
  {
    path: '/satops/alertas',
    expected: { nome: 'Fecho em 30 min', regra: 'Antes', campoReferencia: 'fechoPrevisto' },
    foreignStatus: 404,
  },
  { path: '/departamentos', expected: {}, foreignStatus: 403 },
  { path: '/equipes', expected: { codigo: 'R1', membrosCount: 3 }, foreignStatus: 403 },
  { path: '/espacos', expected: {}, foreignStatus: 403 },
  { path: '/figurinos', expected: { imagens: [] }, foreignStatus: 403 },
  { path: '/fornecedores', expected: {}, foreignStatus: 403 },
  { path: '/turnos', expected: {}, foreignStatus: 403 },
  { path: '/recursos-fisicos', expected: { estoqueItens: [], estoqueCount: 0 }, foreignStatus: 403 },
  { path: '/unidades', expected: {}, foreignStatus: 403 },
  { path: '/users', expected: { usuario: 'registro', senha: '' }, foreignStatus: 403 },
  // Tenant-scoped finder: another tenant's conta is simply not found.
  { path: '/contas-pagar', expected: {}, foreignStatus: 404 },
  { path: '/parametrizacoes/centros-lucro', expected: { codigoExterno: 'CL1', nome: 'Centro' }, foreignStatus: 403 },
  { path: '/programas', expected: { nome: 'Registro' }, foreignStatus: 403 },
  { path: '/tarefas', expected: {}, foreignStatus: 403 },
  { path: '/tabelas-preco', expected: { nome: 'Registro' }, foreignStatus: 403 },
  { path: '/incidencias-gravacao', expected: {}, foreignStatus: 403 },
  { path: '/templates', expected: {}, foreignStatus: 403 },
];

describe.each(CASES)('GET $path/:id', ({ path, expected, foreignStatus }) => {
  it('retorna o registro do tenant', async () => {
    const response = await app.inject({ method: 'GET', url: `${path}/${OWN}`, headers });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.objectContaining({ id: OWN, ...expected }));
  });

  it('retorna 404 quando nao existe', async () => {
    const response = await app.inject({ method: 'GET', url: `${path}/${MISSING}`, headers });
    expect(response.statusCode).toBe(404);
  });

  it('nao expoe registro de outro tenant', async () => {
    const response = await app.inject({ method: 'GET', url: `${path}/${FOREIGN}`, headers });
    expect(response.statusCode).toBe(foreignStatus);
  });
});

describe('GET /tenants/:id (restrita ao admin global)', () => {
  const tenantsRepo = {
    findById: async (id: string) =>
      id === OWN
        ? { id: OWN, nome: 'Câmara de Alcanena', plano: 'Mensal', status: 'ATIVO', notas: null, createdAt: CREATED_AT, licencaFim: null }
        : null,
  } as unknown as TenantsRepository;
  const usersRepo = {
    findTenantAdmin: async () => ({ nome: 'Admin', usuario: 'admin_alcanena' }),
  } as unknown as UsersRepository;

  it('retorna o tenant com o administrador para o admin global', async () => {
    const globalApp = await buildApp({
      authService: createRouteAuthService('GLOBAL_ADMIN'),
      tenantsService: new TenantsService(tenantsRepo, usersRepo),
    });
    const globalHeaders = await loginHeaders(globalApp);

    const found = await globalApp.inject({ method: 'GET', url: `/tenants/${OWN}`, headers: globalHeaders });
    const missing = await globalApp.inject({ method: 'GET', url: `/tenants/${MISSING}`, headers: globalHeaders });

    expect(found.statusCode).toBe(200);
    expect(found.json()).toEqual(
      expect.objectContaining({ id: OWN, status: 'Ativo', adminUsuario: 'admin_alcanena' }),
    );
    expect(missing.statusCode).toBe(404);
    await globalApp.close();
  });

  it('nega acesso a quem nao e admin global', async () => {
    const response = await app.inject({ method: 'GET', url: `/tenants/${OWN}`, headers });
    expect(response.statusCode).toBe(403);
  });
});
