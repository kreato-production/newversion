import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertaRecord = {
  id: string;
  tenantId: string;
  nome: string;
  tempoParaAlerta: string | null;
  regra: string | null;
  campoReferencia: string | null;
  createdAt: Date | null;
  createdBy: string | null;
};

export type SaveAlertaInput = {
  id?: string;
  tenantId: string;
  nome: string;
  tempoParaAlerta?: string | null;
  regra?: string | null;
  campoReferencia?: string | null;
  createdBy?: string | null;
};

type AlertaRow = {
  id: string;
  tenant_id: string;
  nome: string;
  tempo_para_alerta: string | null;
  regra: string | null;
  campo_referencia: string | null;
  created_at: Date | null;
  created_by: string | null;
};

// ─── Interface ────────────────────────────────────────────────────────────────

export interface AlertasRepository {
  listByTenant(tenantId: string): Promise<{ data: AlertaRecord[]; total: number }>;
  findById(id: string, tenantId: string): Promise<AlertaRecord | null>;
  save(input: SaveAlertaInput): Promise<AlertaRecord>;
  remove(id: string, tenantId: string): Promise<void>;
}

// ─── Table setup ──────────────────────────────────────────────────────────────

let ensurePromise: Promise<void> | null = null;

async function ensureTables() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS satops_alertas (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          nome text NOT NULL,
          tempo_para_alerta text NULL,
          regra text NULL,
          campo_referencia text NULL,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);
    })();
  }
  return ensurePromise;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function rowToAlerta(row: AlertaRow): AlertaRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    nome: row.nome,
    tempoParaAlerta: row.tempo_para_alerta,
    regra: row.regra,
    campoReferencia: row.campo_referencia,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class PrismaAlertasRepository implements AlertasRepository {
  async listByTenant(tenantId: string): Promise<{ data: AlertaRecord[]; total: number }> {
    await ensureTables();
    const [countRows, rows] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: string }]>(
        `SELECT COUNT(*) as count FROM satops_alertas WHERE tenant_id = $1`,
        tenantId,
      ),
      prisma.$queryRawUnsafe<AlertaRow[]>(
        `SELECT * FROM satops_alertas WHERE tenant_id = $1 ORDER BY nome ASC`,
        tenantId,
      ),
    ]);
    return {
      total: parseInt(countRows[0]?.count ?? '0', 10),
      data: rows.map(rowToAlerta),
    };
  }

  async findById(id: string, tenantId: string): Promise<AlertaRecord | null> {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<AlertaRow[]>(
      `SELECT * FROM satops_alertas WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
    return rows[0] ? rowToAlerta(rows[0]) : null;
  }

  async save(input: SaveAlertaInput): Promise<AlertaRecord> {
    await ensureTables();
    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE satops_alertas
         SET nome = $1, tempo_para_alerta = $2, regra = $3, campo_referencia = $4, updated_at = NOW()
         WHERE id = $5 AND tenant_id = $6`,
        input.nome,
        input.tempoParaAlerta ?? null,
        input.regra ?? null,
        input.campoReferencia ?? null,
        id,
        input.tenantId,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO satops_alertas (id, tenant_id, nome, tempo_para_alerta, regra, campo_referencia, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        id,
        input.tenantId,
        input.nome,
        input.tempoParaAlerta ?? null,
        input.regra ?? null,
        input.campoReferencia ?? null,
        input.createdBy ?? null,
      );
    }

    const record = await this.findById(id, input.tenantId);
    if (!record) throw new Error('Alerta não encontrado após salvar');
    return record;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await ensureTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM satops_alertas WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
  }
}
