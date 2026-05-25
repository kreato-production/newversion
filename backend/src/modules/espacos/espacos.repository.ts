import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type FaixaDisponibilidadeRecord = {
  id: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[];
};

export type EspacoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  titulo: string;
  descricao: string | null;
  createdAt: Date | null;
  createdBy: string | null;
  createdByNome: string | null;
  faixasDisponibilidade: FaixaDisponibilidadeRecord[];
};

export type SaveEspacoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  titulo: string;
  descricao?: string | null;
  createdBy?: string | null;
  faixasDisponibilidade?: FaixaDisponibilidadeRecord[];
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type EspacoBaseRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  titulo: string;
  descricao: string | null;
  created_at: Date | null;
  created_by: string | null;
  created_by_nome: string | null;
};

type FaixaRow = {
  id: string;
  espaco_id: string;
  data_inicio: string;
  data_fim: string;
  hora_inicio: string;
  hora_fim: string;
  dias_semana: unknown;
};

function parseDiasSemana(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item))
        : [1, 2, 3, 4, 5];
    } catch {
      return [1, 2, 3, 4, 5];
    }
  }
  return [1, 2, 3, 4, 5];
}

function mapEspaco(row: EspacoBaseRow, faixas: FaixaDisponibilidadeRecord[]): EspacoRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    titulo: row.titulo,
    descricao: row.descricao,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByNome: row.created_by_nome,
    faixasDisponibilidade: faixas,
  };
}

export interface EspacosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<EspacoRecord>>;
  findById(id: string): Promise<EspacoRecord | null>;
  save(input: SaveEspacoInput): Promise<EspacoRecord>;
  remove(id: string): Promise<void>;
}

export class PrismaEspacosRepository implements EspacosRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<EspacoRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await prisma.$queryRawUnsafe<EspacoBaseRow[]>(
      `
        SELECT
          e.id,
          e.tenant_id,
          e.codigo_externo,
          e.titulo,
          e.descricao,
          e.created_at,
          e.created_by,
          u.nome AS created_by_nome
        FROM espacos e
        LEFT JOIN "User" u ON u.id = e.created_by
        WHERE e.tenant_id = $1
        ORDER BY e.titulo ASC
        LIMIT $2 OFFSET $3
      `,
      tenantId,
      take,
      skip,
    );

    const totals = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*)::bigint AS total FROM espacos WHERE tenant_id = $1`,
      tenantId,
    );

    const data = await this.enrichEspacos(rows);

    return {
      data,
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<EspacoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<EspacoBaseRow[]>(
      `
        SELECT
          e.id,
          e.tenant_id,
          e.codigo_externo,
          e.titulo,
          e.descricao,
          e.created_at,
          e.created_by,
          u.nome AS created_by_nome
        FROM espacos e
        LEFT JOIN "User" u ON u.id = e.created_by
        WHERE e.id = $1
        LIMIT 1
      `,
      id,
    );

    if (!rows[0]) return null;

    const data = await this.enrichEspacos(rows);
    return data[0] ?? null;
  }

  async save(input: SaveEspacoInput): Promise<EspacoRecord> {
    await this.ensureTables();

    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `
          UPDATE espacos
          SET codigo_externo = $1, titulo = $2, descricao = $3, updated_at = NOW()
          WHERE id = $4 AND tenant_id = $5
        `,
        input.codigoExterno ?? null,
        input.titulo,
        input.descricao ?? null,
        id,
        input.tenantId,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO espacos (id, tenant_id, codigo_externo, titulo, descricao, created_at, updated_at, created_by)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)
        `,
        id,
        input.tenantId,
        input.codigoExterno ?? null,
        input.titulo,
        input.descricao ?? null,
        input.createdBy ?? null,
      );
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM espaco_faixas_disponibilidade WHERE espaco_id = $1`,
      id,
    );

    for (const faixa of input.faixasDisponibilidade ?? []) {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO espaco_faixas_disponibilidade (
            id, tenant_id, espaco_id, data_inicio, data_fim, hora_inicio, hora_fim, dias_semana, created_at, updated_at
          ) VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, $8::jsonb, NOW(), NOW())
        `,
        faixa.id || randomUUID(),
        input.tenantId,
        id,
        faixa.dataInicio,
        faixa.dataFim,
        faixa.horaInicio,
        faixa.horaFim,
        JSON.stringify(faixa.diasSemana ?? [1, 2, 3, 4, 5]),
      );
    }

    const saved = await this.findById(id);
    if (!saved) throw new Error('Espaço não encontrado após salvar');
    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM espacos WHERE id = $1`, id);
  }

  private async enrichEspacos(rows: EspacoBaseRow[]): Promise<EspacoRecord[]> {
    if (rows.length === 0) return [];

    const ids = rows.map((r) => `'${r.id}'`).join(', ');

    const faixas = await prisma.$queryRawUnsafe<FaixaRow[]>(
      `
        SELECT
          id,
          espaco_id,
          data_inicio::text AS data_inicio,
          data_fim::text AS data_fim,
          hora_inicio,
          hora_fim,
          dias_semana
        FROM espaco_faixas_disponibilidade
        WHERE espaco_id IN (${ids})
        ORDER BY data_inicio ASC, hora_inicio ASC
      `,
    );

    const faixasByEspaco = new Map<string, FaixaDisponibilidadeRecord[]>();
    for (const faixa of faixas) {
      const current = faixasByEspaco.get(faixa.espaco_id) ?? [];
      current.push({
        id: faixa.id,
        dataInicio: faixa.data_inicio,
        dataFim: faixa.data_fim,
        horaInicio: faixa.hora_inicio,
        horaFim: faixa.hora_fim,
        diasSemana: parseDiasSemana(faixa.dias_semana),
      });
      faixasByEspaco.set(faixa.espaco_id, current);
    }

    return rows.map((row) => mapEspaco(row, faixasByEspaco.get(row.id) ?? []));
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS espacos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            titulo text NOT NULL,
            descricao text NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS espaco_faixas_disponibilidade (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            espaco_id text NOT NULL REFERENCES espacos(id) ON DELETE CASCADE,
            data_inicio date NOT NULL,
            data_fim date NOT NULL,
            hora_inicio text NOT NULL,
            hora_fim text NOT NULL,
            dias_semana jsonb NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS espacos_tenant_titulo_idx ON espacos (tenant_id, titulo)
        `);
      })().catch((err) => {
        this.ready = null;
        throw err;
      });
    }

    await this.ready;
  }
}
