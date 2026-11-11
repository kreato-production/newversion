import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import {
  OTHER_TENANT_ID,
  TEST_TENANT_ID,
  createRouteAuthService,
  loginHeaders,
} from '../../../test/route-auth.js';
import { ParametrizacoesService } from '../parametrizacoes.service.js';
import type { PrismaParametrizacoesRepository } from '../parametrizacoes.repository.js';

type Row = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  codigo?: string | null;
  titulo: string;
  nome?: string;
  descricao: string | null;
  cor: string | null;
  is_inicial?: boolean;
  is_baixa?: boolean;
  is_padrao?: boolean;
  traducoes: Record<string, string> | null;
  created_at: Date | null;
  created_by: string | null;
};

const FINDERS = [
  'findStatusContaPagar',
  'findFormaPagamento',
  'findTipoDocumentoFinanceiro',
  'findTipoPagamento',
  'findCategoriaDespesa',
  'findStatusGravacao',
  'findStatusPlaneamento',
  'findStatusTarefa',
  'findCategoriaIncidencia',
  'findSeveridadeIncidencia',
  'findImpactoIncidencia',
] as const;

/** Fake with only the finders used by the GET /:id routes (the service takes the Prisma class). */
function createRepository(rows: Row[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const find = async (id: string) => byId.get(id) ?? null;
  return Object.fromEntries(FINDERS.map((name) => [name, find])) as unknown as PrismaParametrizacoesRepository;
}

const OWN = '44444444-4444-4444-4444-444444444444';
const FOREIGN = '55555555-5555-5555-5555-555555555555';
const MISSING = '66666666-6666-6666-6666-666666666666';

function row(id: string, tenantId: string): Row {
  return {
    id,
    tenant_id: tenantId,
    codigo_externo: 'X1',
    codigo: 'ST1',
    titulo: 'Boleto',
    nome: 'Boleto',
    descricao: 'Pagamento por boleto',
    cor: '#ff0000',
    is_inicial: true,
    is_baixa: false,
    is_padrao: true,
    traducoes: { en: 'Bank slip' },
    created_at: new Date('2026-11-10T12:00:00.000Z'),
    created_by: 'Ana Silva',
  };
}

// One app + one login for the whole file: the login route rate-limits per user.
let app: FastifyInstance;
let headers: Record<string, string>;

beforeAll(async () => {
  app = await buildApp({
    authService: createRouteAuthService(),
    parametrizacoesService: new ParametrizacoesService(
      createRepository([row(OWN, TEST_TENANT_ID), row(FOREIGN, OTHER_TENANT_ID)]),
    ),
  });
  headers = await loginHeaders(app);
});

afterAll(async () => {
  await app.close();
});

const ENDPOINTS: Array<{ path: string; expected: Record<string, unknown> }> = [
  {
    path: 'status-contas-pagar',
    expected: { codigoExterno: 'X1', titulo: 'Boleto', isInicial: true, isBaixa: false },
  },
  { path: 'formas-pagamento', expected: { codigoExterno: 'X1', titulo: 'Boleto', isPadrao: true } },
  { path: 'tipos-documentos-financeiro', expected: { codigo_externo: 'X1', titulo: 'Boleto' } },
  { path: 'tipos-pagamento', expected: { codigo_externo: 'X1', titulo: 'Boleto' } },
  { path: 'categorias-despesa', expected: { codigo_externo: 'X1', titulo: 'Boleto' } },
  { path: 'status-gravacao', expected: { codigoExterno: 'X1', nome: 'Boleto', isInicial: true } },
  { path: 'status-planeamento', expected: { codigoExterno: 'X1', nome: 'Boleto', isInicial: true } },
  { path: 'status-tarefa', expected: { codigo: 'ST1', nome: 'Boleto', isInicial: true } },
  { path: 'categorias-incidencia', expected: { codigo_externo: 'X1', titulo: 'Boleto' } },
  { path: 'severidades-incidencia', expected: { codigo_externo: 'X1', titulo: 'Boleto' } },
  { path: 'impactos-incidencia', expected: { codigo_externo: 'X1', titulo: 'Boleto' } },
];

describe.each(ENDPOINTS)('GET /parametrizacoes/$path/:id', ({ path, expected }) => {
  it('retorna o registro do tenant', async () => {
    const response = await app.inject({ method: 'GET', url: `/parametrizacoes/${path}/${OWN}`, headers });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({ id: OWN, traducoes: { en: 'Bank slip' }, ...expected }),
    );
  });

  it('retorna 404 quando nao existe', async () => {
    const response = await app.inject({ method: 'GET', url: `/parametrizacoes/${path}/${MISSING}`, headers });

    expect(response.statusCode).toBe(404);
  });

  it('bloqueia registro de outro tenant', async () => {
    const response = await app.inject({ method: 'GET', url: `/parametrizacoes/${path}/${FOREIGN}`, headers });

    expect(response.statusCode).toBe(403);
  });
});
