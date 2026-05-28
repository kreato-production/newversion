import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EstadoEventoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  cor: string | null;
  traducoes: Record<string, string> | null;
  createdAt: Date | null;
  createdBy: string | null;
};

export type SateliteRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  transponder: string | null;
  frequenciaUplink: string | null;
  polarizacao: string | null;
  symbolRate: string | null;
  fec: string | null;
  checklist: unknown | null;
  traducoes: Record<string, string> | null;
  createdAt: Date | null;
  createdBy: string | null;
};

// ─── Row types ────────────────────────────────────────────────────────────────

type EstadoEventoRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  cor: string | null;
  traducoes: Record<string, string> | null;
  created_at: Date | null;
  created_by: string | null;
};

type SateliteRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  transponder: string | null;
  frequencia_uplink: string | null;
  polarizacao: string | null;
  symbol_rate: string | null;
  fec: string | null;
  checklist: unknown | null;
  traducoes: Record<string, string> | null;
  created_at: Date | null;
  created_by: string | null;
};

// ─── Input types ──────────────────────────────────────────────────────────────

export type SaveEstadoEventoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  cor?: string | null;
  traducoes?: Record<string, string> | null;
  createdBy?: string | null;
};

export type SaveSateliteInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  transponder?: string | null;
  frequenciaUplink?: string | null;
  polarizacao?: string | null;
  symbolRate?: string | null;
  fec?: string | null;
  checklist?: unknown | null;
  traducoes?: Record<string, string> | null;
  createdBy?: string | null;
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface EstadosEventoRepository {
  listByTenant(tenantId: string): Promise<{ data: EstadoEventoRecord[]; total: number }>;
  findById(id: string, tenantId: string): Promise<EstadoEventoRecord | null>;
  save(input: SaveEstadoEventoInput): Promise<EstadoEventoRecord>;
  remove(id: string, tenantId: string): Promise<void>;
}

export interface SatelitesRepository {
  listByTenant(tenantId: string): Promise<{ data: SateliteRecord[]; total: number }>;
  findById(id: string, tenantId: string): Promise<SateliteRecord | null>;
  save(input: SaveSateliteInput): Promise<SateliteRecord>;
  remove(id: string, tenantId: string): Promise<void>;
}

// ─── Table setup ──────────────────────────────────────────────────────────────

let ensurePromise: Promise<void> | null = null;

async function ensureTables() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS satops_estados_evento (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          nome text NOT NULL,
          cor text NULL DEFAULT '#3b82f6',
          traducoes jsonb NULL,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS satops_satelites (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          nome text NOT NULL,
          transponder text NULL,
          frequencia_uplink text NULL,
          polarizacao text NULL,
          symbol_rate text NULL,
          fec text NULL,
          checklist jsonb NULL,
          traducoes jsonb NULL,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      // Migração: adiciona coluna checklist se a tabela já existia sem ela
      await prisma.$executeRawUnsafe(`
        ALTER TABLE satops_satelites ADD COLUMN IF NOT EXISTS checklist jsonb NULL
      `);
    })();
  }
  return ensurePromise;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function rowToEstadoEvento(row: EstadoEventoRow): EstadoEventoRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    nome: row.nome,
    cor: row.cor,
    traducoes: row.traducoes,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function rowToSatelite(row: SateliteRow): SateliteRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    nome: row.nome,
    transponder: row.transponder,
    frequenciaUplink: row.frequencia_uplink,
    polarizacao: row.polarizacao,
    symbolRate: row.symbol_rate,
    fec: row.fec,
    checklist: row.checklist ?? null,
    traducoes: row.traducoes,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

// ─── EstadosEvento Repository ─────────────────────────────────────────────────

export class PrismaEstadosEventoRepository implements EstadosEventoRepository {
  async listByTenant(tenantId: string): Promise<{ data: EstadoEventoRecord[]; total: number }> {
    await ensureTables();
    const [countRows, rows] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: string }]>(
        `SELECT COUNT(*) as count FROM satops_estados_evento WHERE tenant_id = $1`,
        tenantId,
      ),
      prisma.$queryRawUnsafe<EstadoEventoRow[]>(
        `SELECT * FROM satops_estados_evento WHERE tenant_id = $1 ORDER BY nome ASC`,
        tenantId,
      ),
    ]);
    return {
      total: parseInt(countRows[0]?.count ?? '0', 10),
      data: rows.map(rowToEstadoEvento),
    };
  }

  async findById(id: string, tenantId: string): Promise<EstadoEventoRecord | null> {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<EstadoEventoRow[]>(
      `SELECT * FROM satops_estados_evento WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
    return rows[0] ? rowToEstadoEvento(rows[0]) : null;
  }

  async save(input: SaveEstadoEventoInput): Promise<EstadoEventoRecord> {
    await ensureTables();
    const id = input.id ?? randomUUID();
    const traducoes = input.traducoes ? JSON.stringify(input.traducoes) : null;

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE satops_estados_evento
         SET codigo_externo = $1, nome = $2, cor = $3, traducoes = $4::jsonb, updated_at = NOW()
         WHERE id = $5 AND tenant_id = $6`,
        input.codigoExterno ?? null,
        input.nome,
        input.cor ?? '#3b82f6',
        traducoes,
        id,
        input.tenantId,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO satops_estados_evento (id, tenant_id, codigo_externo, nome, cor, traducoes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
        id,
        input.tenantId,
        input.codigoExterno ?? null,
        input.nome,
        input.cor ?? '#3b82f6',
        traducoes,
        input.createdBy ?? null,
      );
    }

    const record = await this.findById(id, input.tenantId);
    if (!record) throw new Error('Não encontrado após salvar');
    return record;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await ensureTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM satops_estados_evento WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
  }
}

// ─── Satelites Repository ─────────────────────────────────────────────────────

export class PrismaSatelitesRepository implements SatelitesRepository {
  async listByTenant(tenantId: string): Promise<{ data: SateliteRecord[]; total: number }> {
    await ensureTables();
    const [countRows, rows] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: string }]>(
        `SELECT COUNT(*) as count FROM satops_satelites WHERE tenant_id = $1`,
        tenantId,
      ),
      prisma.$queryRawUnsafe<SateliteRow[]>(
        `SELECT * FROM satops_satelites WHERE tenant_id = $1 ORDER BY nome ASC`,
        tenantId,
      ),
    ]);
    return {
      total: parseInt(countRows[0]?.count ?? '0', 10),
      data: rows.map(rowToSatelite),
    };
  }

  async findById(id: string, tenantId: string): Promise<SateliteRecord | null> {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<SateliteRow[]>(
      `SELECT * FROM satops_satelites WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
    return rows[0] ? rowToSatelite(rows[0]) : null;
  }

  async save(input: SaveSateliteInput): Promise<SateliteRecord> {
    await ensureTables();
    const id = input.id ?? randomUUID();
    const traducoes = input.traducoes ? JSON.stringify(input.traducoes) : null;

    const checklistJson = input.checklist != null ? JSON.stringify(input.checklist) : null;

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE satops_satelites
         SET codigo_externo = $1, nome = $2, transponder = $3, frequencia_uplink = $4,
             polarizacao = $5, symbol_rate = $6, fec = $7,
             checklist = $8::jsonb, traducoes = $9::jsonb, updated_at = NOW()
         WHERE id = $10 AND tenant_id = $11`,
        input.codigoExterno ?? null,
        input.nome,
        input.transponder ?? null,
        input.frequenciaUplink ?? null,
        input.polarizacao ?? null,
        input.symbolRate ?? null,
        input.fec ?? null,
        checklistJson,
        traducoes,
        id,
        input.tenantId,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO satops_satelites
         (id, tenant_id, codigo_externo, nome, transponder, frequencia_uplink,
          polarizacao, symbol_rate, fec, checklist, traducoes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12)`,
        id,
        input.tenantId,
        input.codigoExterno ?? null,
        input.nome,
        input.transponder ?? null,
        input.frequenciaUplink ?? null,
        input.polarizacao ?? null,
        input.symbolRate ?? null,
        input.fec ?? null,
        checklistJson,
        traducoes,
        input.createdBy ?? null,
      );
    }

    const record = await this.findById(id, input.tenantId);
    if (!record) throw new Error('Não encontrado após salvar');
    return record;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await ensureTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM satops_satelites WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
  }
}
