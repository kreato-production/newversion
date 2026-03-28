import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type DepartamentoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  createdAt: Date;
  createdBy: string | null;
};

export type SaveDepartamentoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
  createdBy?: string | null;
};

export type DepartamentoFuncaoRecord = {
  id: string;
  funcaoId: string;
  createdAt: Date;
};

export type FuncaoOptionRecord = {
  id: string;
  nome: string;
  codigoExterno: string | null;
  descricao: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type DepartamentoRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  created_at: Date;
  created_by: string | null;
};

type DepartamentoFuncaoRow = {
  id: string;
  funcao_id: string;
  created_at: Date;
};

export interface DepartamentosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<DepartamentoRecord>>;
  findById(id: string): Promise<DepartamentoRecord | null>;
  save(input: SaveDepartamentoInput): Promise<DepartamentoRecord>;
  remove(id: string): Promise<void>;
  listFuncoes(tenantId: string): Promise<FuncaoOptionRecord[]>;
  listFuncoesAssociadas(departamentoId: string): Promise<DepartamentoFuncaoRecord[]>;
  addFuncao(input: { tenantId: string; departamentoId: string; funcaoId: string }): Promise<DepartamentoFuncaoRecord>;
  removeFuncao(id: string): Promise<void>;
}

function mapDepartamento(row: DepartamentoRow): DepartamentoRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    nome: row.nome,
    descricao: row.descricao,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export class PrismaDepartamentosRepository implements DepartamentosRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<DepartamentoRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await prisma.$queryRawUnsafe<DepartamentoRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
        FROM departamentos
        WHERE tenant_id = $1
        ORDER BY nome ASC
        LIMIT $2 OFFSET $3
      `,
      tenantId,
      take,
      skip,
    );

    const totals = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `
        SELECT COUNT(*)::bigint AS total
        FROM departamentos
        WHERE tenant_id = $1
      `,
      tenantId,
    );

    return {
      data: rows.map(mapDepartamento),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<DepartamentoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<DepartamentoRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
        FROM departamentos
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ? mapDepartamento(rows[0]) : null;
  }

  async save(input: SaveDepartamentoInput): Promise<DepartamentoRecord> {
    await this.ensureTables();

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<DepartamentoRow[]>(
        `
          UPDATE departamentos
          SET
            codigo_externo = $1,
            nome = $2,
            descricao = $3,
            updated_at = NOW()
          WHERE id = $4 AND tenant_id = $5
          RETURNING id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.nome,
        input.descricao ?? null,
        input.id,
        input.tenantId,
      );

      if (rows[0]) {
        return mapDepartamento(rows[0]);
      }
    }

    const id = input.id ?? randomUUID();
    const rows = await prisma.$queryRawUnsafe<DepartamentoRow[]>(
      `
        INSERT INTO departamentos (
          id,
          tenant_id,
          codigo_externo,
          nome,
          descricao,
          created_at,
          updated_at,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)
        RETURNING id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
      `,
      id,
      input.tenantId,
      input.codigoExterno ?? null,
      input.nome,
      input.descricao ?? null,
      input.createdBy ?? null,
    );

    return mapDepartamento(rows[0]);
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM departamentos WHERE id = $1`, id);
  }

  async listFuncoes(tenantId: string): Promise<FuncaoOptionRecord[]> {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; nome: string; codigo_externo: string | null; descricao: string | null }>>(
      `
        SELECT id, nome, codigo_externo, descricao
        FROM funcoes
        WHERE tenant_id = $1
        ORDER BY nome ASC
      `,
      tenantId,
    );

    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      codigoExterno: row.codigo_externo,
      descricao: row.descricao,
    }));
  }

  async listFuncoesAssociadas(departamentoId: string): Promise<DepartamentoFuncaoRecord[]> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<DepartamentoFuncaoRow[]>(
      `
        SELECT id, funcao_id, created_at
        FROM departamento_funcoes
        WHERE departamento_id = $1
        ORDER BY created_at ASC
      `,
      departamentoId,
    );

    return rows.map((row) => ({
      id: row.id,
      funcaoId: row.funcao_id,
      createdAt: row.created_at,
    }));
  }

  async addFuncao(input: { tenantId: string; departamentoId: string; funcaoId: string }): Promise<DepartamentoFuncaoRecord> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<DepartamentoFuncaoRow[]>(
      `
        INSERT INTO departamento_funcoes (
          id,
          tenant_id,
          departamento_id,
          funcao_id,
          created_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (departamento_id, funcao_id) DO UPDATE
        SET tenant_id = EXCLUDED.tenant_id
        RETURNING id, funcao_id, created_at
      `,
      randomUUID(),
      input.tenantId,
      input.departamentoId,
      input.funcaoId,
    );

    return {
      id: rows[0].id,
      funcaoId: rows[0].funcao_id,
      createdAt: rows[0].created_at,
    };
  }

  async removeFuncao(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM departamento_funcoes WHERE id = $1`, id);
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS departamentos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            nome text NOT NULL,
            descricao text NULL,
            cor text NULL,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            updated_at timestamptz NOT NULL DEFAULT NOW(),
            created_by text NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS departamento_funcoes (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            departamento_id text NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
            funcao_id text NOT NULL REFERENCES funcoes(id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS departamento_funcoes_departamento_funcao_key
          ON departamento_funcoes (departamento_id, funcao_id)
        `);
      })();
    }

    await this.ready;
  }
}
