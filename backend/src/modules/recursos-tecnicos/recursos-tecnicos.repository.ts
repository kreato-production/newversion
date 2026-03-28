import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type RecursoTecnicoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  funcaoOperadorId: string | null;
  funcaoOperadorNome: string | null;
  createdAt: Date | null;
  createdBy: string | null;
  createdByNome: string | null;
};

export type SaveRecursoTecnicoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  funcaoOperadorId?: string | null;
  createdBy?: string | null;
};

export type FuncaoOptionRecord = {
  id: string;
  nome: string;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type RecursoTecnicoRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  funcao_operador_id: string | null;
  funcao_operador_nome: string | null;
  created_at: Date | null;
  created_by: string | null;
  created_by_nome: string | null;
};

function mapRecursoTecnico(row: RecursoTecnicoRow): RecursoTecnicoRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    nome: row.nome,
    funcaoOperadorId: row.funcao_operador_id,
    funcaoOperadorNome: row.funcao_operador_nome,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByNome: row.created_by_nome,
  };
}

export interface RecursosTecnicosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<RecursoTecnicoRecord>>;
  findById(id: string): Promise<RecursoTecnicoRecord | null>;
  save(input: SaveRecursoTecnicoInput): Promise<RecursoTecnicoRecord>;
  remove(id: string): Promise<void>;
  listFuncoesOperador(tenantId: string): Promise<FuncaoOptionRecord[]>;
}

export class PrismaRecursosTecnicosRepository implements RecursosTecnicosRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<RecursoTecnicoRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await prisma.$queryRawUnsafe<RecursoTecnicoRow[]>(
      `
        SELECT
          rt.id,
          rt.tenant_id,
          rt.codigo_externo,
          rt.nome,
          rt.funcao_operador_id,
          f.nome AS funcao_operador_nome,
          rt.created_at,
          rt.created_by,
          u.nome AS created_by_nome
        FROM recursos_tecnicos rt
        LEFT JOIN funcoes f ON f.id = rt.funcao_operador_id
        LEFT JOIN "User" u ON u.id = rt.created_by
        WHERE rt.tenant_id = $1
        ORDER BY rt.nome ASC
        LIMIT $2 OFFSET $3
      `,
      tenantId,
      take,
      skip,
    );

    const totals = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `
        SELECT COUNT(*)::bigint AS total
        FROM recursos_tecnicos
        WHERE tenant_id = $1
      `,
      tenantId,
    );

    return {
      data: rows.map(mapRecursoTecnico),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<RecursoTecnicoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<RecursoTecnicoRow[]>(
      `
        SELECT
          rt.id,
          rt.tenant_id,
          rt.codigo_externo,
          rt.nome,
          rt.funcao_operador_id,
          f.nome AS funcao_operador_nome,
          rt.created_at,
          rt.created_by,
          u.nome AS created_by_nome
        FROM recursos_tecnicos rt
        LEFT JOIN funcoes f ON f.id = rt.funcao_operador_id
        LEFT JOIN "User" u ON u.id = rt.created_by
        WHERE rt.id = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ? mapRecursoTecnico(rows[0]) : null;
  }

  async save(input: SaveRecursoTecnicoInput): Promise<RecursoTecnicoRecord> {
    await this.ensureTables();

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<RecursoTecnicoRow[]>(
        `
          UPDATE recursos_tecnicos
          SET
            codigo_externo = $1,
            nome = $2,
            funcao_operador_id = $3,
            updated_at = NOW()
          WHERE id = $4 AND tenant_id = $5
          RETURNING
            id,
            tenant_id,
            codigo_externo,
            nome,
            funcao_operador_id,
            NULL::text AS funcao_operador_nome,
            created_at,
            created_by,
            NULL::text AS created_by_nome
        `,
        input.codigoExterno ?? null,
        input.nome,
        input.funcaoOperadorId ?? null,
        input.id,
        input.tenantId,
      );

      if (rows[0]) {
        const saved = await this.findById(rows[0].id);
        if (saved) {
          return saved;
        }
      }
    }

    const id = input.id ?? randomUUID();
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO recursos_tecnicos (
          id,
          tenant_id,
          codigo_externo,
          nome,
          funcao_operador_id,
          created_at,
          updated_at,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)
      `,
      id,
      input.tenantId,
      input.codigoExterno ?? null,
      input.nome,
      input.funcaoOperadorId ?? null,
      input.createdBy ?? null,
    );

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Recurso tecnico nao encontrado apos salvar');
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM recursos_tecnicos WHERE id = $1`, id);
  }

  async listFuncoesOperador(tenantId: string): Promise<FuncaoOptionRecord[]> {
    await this.ensureTables();

    return prisma.$queryRawUnsafe<FuncaoOptionRecord[]>(
      `
        SELECT id, nome
        FROM funcoes
        WHERE tenant_id = $1
        ORDER BY nome ASC
      `,
      tenantId,
    );
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS recursos_tecnicos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            nome text NOT NULL,
            funcao_operador_id text NULL REFERENCES funcoes(id) ON DELETE SET NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS recursos_tecnicos_tenant_nome_idx
          ON recursos_tecnicos (tenant_id, nome)
        `);
      })();
    }

    await this.ready;
  }
}
