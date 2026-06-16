import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

let ensurePromise: Promise<void> | null = null;

async function ensureTables() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE gestao_eventos ADD COLUMN IF NOT EXISTS unidade_negocio_id uuid NULL
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE gestao_eventos ADD COLUMN IF NOT EXISTS orcamento_itens jsonb NOT NULL DEFAULT '[]'
      `);
    })();
  }
  await ensurePromise;
}

export type EventoExpositor = {
  id: string;
  nome: string;
  logo: string | null;
  tipoExpositorNome: string;
};

export type AgendaAtividade = {
  id: string;
  horarioInicio: string;
  horarioFim: string;
  titulo: string;
  descricao: string;
  cor: string;
  executada: boolean;
};

export type AgendaDia = {
  id: string;
  data: string;
  atividades: AgendaAtividade[];
};

export type OrcamentoEventoItem = {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoIds: string[];
  servicoNomes: string[];
  centroLucroId: string | null;
  centroLucroNome: string | null;
  valor: number;
  moeda: string;
  dataPagamento: string | null;
};

export type EventoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  tipoEventoId: string | null;
  unidadeNegocioId: string | null;
  descricao: string | null;
  tags: string[];
  inicioEvento: Date | null;
  fimEvento: Date | null;
  local: string | null;
  latitude: string | null;
  longitude: string | null;
  publicoEstimado: string | null;
  expositores: EventoExpositor[];
  layoutArquivo: string | null;
  layoutNome: string | null;
  layoutTipo: string | null;
  agenda: AgendaDia[];
  orcamentoItens: OrcamentoEventoItem[];
  createdAt: Date | null;
  createdBy: string | null;
};

export type SaveEventoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  tipoEventoId?: string | null;
  unidadeNegocioId?: string | null;
  descricao?: string | null;
  tags?: string[];
  inicioEvento?: string | null;
  fimEvento?: string | null;
  local?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  publicoEstimado?: string | null;
  expositores?: EventoExpositor[];
  layoutArquivo?: string | null;
  layoutNome?: string | null;
  layoutTipo?: string | null;
  agenda?: AgendaDia[];
  orcamentoItens?: OrcamentoEventoItem[];
  createdBy?: string | null;
};

export type ListEventosOptions = { limit?: number; offset?: number };
export type PaginatedEventos = { data: EventoRecord[]; total: number };

type EventoRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  tipo_evento_id: string | null;
  unidade_negocio_id: string | null;
  descricao: string | null;
  tags: string[] | null;
  inicio_evento: Date | null;
  fim_evento: Date | null;
  local: string | null;
  latitude: string | null;
  longitude: string | null;
  publico_estimado: string | null;
  expositores: EventoExpositor[] | null;
  layout_arquivo: string | null;
  layout_nome: string | null;
  layout_tipo: string | null;
  agenda: AgendaDia[] | null;
  orcamento_itens: OrcamentoEventoItem[] | null;
  created_at: Date | null;
  created_by: string | null;
};

function mapRow(row: EventoRow): EventoRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    nome: row.nome,
    tipoEventoId: row.tipo_evento_id,
    unidadeNegocioId: row.unidade_negocio_id,
    descricao: row.descricao,
    tags: Array.isArray(row.tags) ? row.tags : [],
    inicioEvento: row.inicio_evento,
    fimEvento: row.fim_evento,
    local: row.local,
    latitude: row.latitude,
    longitude: row.longitude,
    publicoEstimado: row.publico_estimado,
    expositores: Array.isArray(row.expositores) ? row.expositores : [],
    layoutArquivo: row.layout_arquivo,
    layoutNome: row.layout_nome,
    layoutTipo: row.layout_tipo,
    agenda: Array.isArray(row.agenda) ? row.agenda : [],
    orcamentoItens: Array.isArray(row.orcamento_itens) ? row.orcamento_itens : [],
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export interface EventosRepository {
  listByTenant(tenantId: string, opts?: ListEventosOptions): Promise<PaginatedEventos>;
  findById(id: string, tenantId: string): Promise<EventoRecord | null>;
  save(input: SaveEventoInput): Promise<EventoRecord>;
  remove(id: string, tenantId: string): Promise<void>;
}

export class PrismaEventosRepository implements EventosRepository {
  async listByTenant(tenantId: string, opts?: ListEventosOptions): Promise<PaginatedEventos> {
    await ensureTables();
    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const [rows, totals] = await Promise.all([
      prisma.$queryRawUnsafe<EventoRow[]>(
        `SELECT id, tenant_id, codigo_externo, nome, tipo_evento_id, unidade_negocio_id, descricao, tags, inicio_evento, fim_evento,
                local, latitude, longitude, publico_estimado, expositores,
                layout_arquivo, layout_nome, layout_tipo, agenda, orcamento_itens, created_at, created_by
         FROM gestao_eventos
         WHERE tenant_id = $1
         ORDER BY nome ASC
         LIMIT $2 OFFSET $3`,
        tenantId,
        take,
        skip,
      ),
      prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint AS total FROM gestao_eventos WHERE tenant_id = $1`,
        tenantId,
      ),
    ]);

    return { data: rows.map(mapRow), total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: string, tenantId: string): Promise<EventoRecord | null> {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<EventoRow[]>(
      `SELECT id, tenant_id, codigo_externo, nome, tipo_evento_id, unidade_negocio_id, descricao, tags, inicio_evento, fim_evento,
              local, latitude, longitude, publico_estimado, expositores,
              layout_arquivo, layout_nome, layout_tipo, agenda, orcamento_itens, created_at, created_by
       FROM gestao_eventos
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      id,
      tenantId,
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async save(input: SaveEventoInput): Promise<EventoRecord> {
    await ensureTables();
    const tags = JSON.stringify(input.tags ?? []);
    const expositores = JSON.stringify(input.expositores ?? []);
    const agenda = JSON.stringify(input.agenda ?? []);

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<EventoRow[]>(
        `UPDATE gestao_eventos
         SET codigo_externo = $1, nome = $2, tipo_evento_id = $3, descricao = $4, tags = $5::jsonb,
             inicio_evento = $6::timestamptz, fim_evento = $7::timestamptz, local = $8,
             latitude = $9, longitude = $10, publico_estimado = $11, expositores = $12::jsonb,
             layout_arquivo = $13, layout_nome = $14, layout_tipo = $15, agenda = $16::jsonb,
             unidade_negocio_id = $17::uuid, orcamento_itens = $18::jsonb, updated_at = NOW()
         WHERE id = $19 AND tenant_id = $20
         RETURNING id, tenant_id, codigo_externo, nome, tipo_evento_id, unidade_negocio_id, descricao, tags, inicio_evento, fim_evento,
                   local, latitude, longitude, publico_estimado, expositores,
                   layout_arquivo, layout_nome, layout_tipo, agenda, orcamento_itens, created_at, created_by`,
        input.codigoExterno ?? null,
        input.nome,
        input.tipoEventoId ?? null,
        input.descricao ?? null,
        tags,
        input.inicioEvento ?? null,
        input.fimEvento ?? null,
        input.local ?? null,
        input.latitude ?? null,
        input.longitude ?? null,
        input.publicoEstimado ?? null,
        expositores,
        input.layoutArquivo ?? null,
        input.layoutNome ?? null,
        input.layoutTipo ?? null,
        agenda,
        input.unidadeNegocioId ?? null,
        JSON.stringify(input.orcamentoItens ?? []),
        input.id,
        input.tenantId,
      );
      return mapRow(rows[0]);
    }

    const newId = randomUUID();
    const rows = await prisma.$queryRawUnsafe<EventoRow[]>(
      `INSERT INTO gestao_eventos
         (id, tenant_id, codigo_externo, nome, tipo_evento_id, descricao, tags, inicio_evento, fim_evento,
          local, latitude, longitude, publico_estimado, expositores,
          layout_arquivo, layout_nome, layout_tipo, agenda, unidade_negocio_id, orcamento_itens, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::timestamptz, $9::timestamptz, $10, $11, $12, $13, $14::jsonb,
               $15, $16, $17, $18::jsonb, $19::uuid, $20::jsonb, NOW(), NOW(), $21)
       RETURNING id, tenant_id, codigo_externo, nome, tipo_evento_id, unidade_negocio_id, descricao, tags, inicio_evento, fim_evento,
                 local, latitude, longitude, publico_estimado, expositores,
                 layout_arquivo, layout_nome, layout_tipo, agenda, orcamento_itens, created_at, created_by`,
      newId,
      input.tenantId,
      input.codigoExterno ?? null,
      input.nome,
      input.tipoEventoId ?? null,
      input.descricao ?? null,
      tags,
      input.inicioEvento ?? null,
      input.fimEvento ?? null,
      input.local ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.publicoEstimado ?? null,
      expositores,
      input.layoutArquivo ?? null,
      input.layoutNome ?? null,
      input.layoutTipo ?? null,
      agenda,
      input.unidadeNegocioId ?? null,
      JSON.stringify(input.orcamentoItens ?? []),
      input.createdBy ?? null,
    );
    return mapRow(rows[0]);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await ensureTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM gestao_eventos WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
  }
}
