import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type FeriadoRecord = {
  id: string;
  tenantId: string;
  data: string;
  feriado: string;
  observacoes: string | null;
  createdAt: Date;
  createdBy: string | null;
};

export type SaveFeriadoInput = {
  id?: string;
  tenantId: string;
  data: string;
  feriado: string;
  observacoes?: string | null;
  createdBy?: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type FeriadoRow = {
  id: string;
  tenant_id: string;
  data: string;
  feriado: string;
  observacoes: string | null;
  created_at: Date;
  created_by: string | null;
};

export interface FeriadosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<FeriadoRecord>>;
  findById(id: string): Promise<FeriadoRecord | null>;
  findByDate(tenantId: string, data: string): Promise<FeriadoRecord | null>;
  save(input: SaveFeriadoInput): Promise<FeriadoRecord>;
  remove(id: string): Promise<void>;
}

function mapFeriado(row: FeriadoRow): FeriadoRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    data: row.data,
    feriado: row.feriado,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export class PrismaFeriadosRepository implements FeriadosRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<FeriadoRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await prisma.$queryRawUnsafe<FeriadoRow[]>(
      `
        SELECT
          id,
          tenant_id,
          data::text AS data,
          feriado,
          observacoes,
          created_at,
          created_by
        FROM feriados
        WHERE tenant_id = $1
        ORDER BY data ASC, feriado ASC
        LIMIT $2 OFFSET $3
      `,
      tenantId,
      take,
      skip,
    );

    const totals = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `
        SELECT COUNT(*)::bigint AS total
        FROM feriados
        WHERE tenant_id = $1
      `,
      tenantId,
    );

    return {
      data: rows.map(mapFeriado),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<FeriadoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<FeriadoRow[]>(
      `
        SELECT
          id,
          tenant_id,
          data::text AS data,
          feriado,
          observacoes,
          created_at,
          created_by
        FROM feriados
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ? mapFeriado(rows[0]) : null;
  }

  async findByDate(tenantId: string, data: string): Promise<FeriadoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<FeriadoRow[]>(
      `
        SELECT
          id,
          tenant_id,
          data::text AS data,
          feriado,
          observacoes,
          created_at,
          created_by
        FROM feriados
        WHERE tenant_id = $1 AND data = $2::date
        LIMIT 1
      `,
      tenantId,
      data,
    );

    return rows[0] ? mapFeriado(rows[0]) : null;
  }

  async save(input: SaveFeriadoInput): Promise<FeriadoRecord> {
    await this.ensureTables();

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<FeriadoRow[]>(
        `
          UPDATE feriados
          SET
            data = $1::date,
            feriado = $2,
            observacoes = $3,
            updated_at = NOW()
          WHERE id = $4 AND tenant_id = $5
          RETURNING
            id,
            tenant_id,
            data::text AS data,
            feriado,
            observacoes,
            created_at,
            created_by
        `,
        input.data,
        input.feriado,
        input.observacoes ?? null,
        input.id,
        input.tenantId,
      );

      if (rows[0]) {
        return mapFeriado(rows[0]);
      }
    }

    const id = input.id ?? randomUUID();
    const rows = await prisma.$queryRawUnsafe<FeriadoRow[]>(
      `
        INSERT INTO feriados (
          id,
          tenant_id,
          data,
          feriado,
          observacoes,
          created_at,
          updated_at,
          created_by
        )
        VALUES ($1, $2, $3::date, $4, $5, NOW(), NOW(), $6)
        RETURNING
          id,
          tenant_id,
          data::text AS data,
          feriado,
          observacoes,
          created_at,
          created_by
      `,
      id,
      input.tenantId,
      input.data,
      input.feriado,
      input.observacoes ?? null,
      input.createdBy ?? null,
    );

    return mapFeriado(rows[0]);
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM feriados WHERE id = $1`, id);
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS feriados (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            data date NOT NULL,
            feriado text NOT NULL,
            observacoes text NULL,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            updated_at timestamptz NOT NULL DEFAULT NOW(),
            created_by text NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS feriados_tenant_data_key
          ON feriados (tenant_id, data)
        `);
      })();
    }

    await this.ready;
  }
}
