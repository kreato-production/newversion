import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type FornecedorRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  categoria: string | null;
  categoriaId: string | null;
  email: string | null;
  pais: string | null;
  identificacaoFiscal: string | null;
  descricao: string | null;
  createdAt: Date | null;
  createdByNome: string | null;
};

export type SaveFornecedorInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  categoriaId?: string | null;
  email?: string | null;
  pais?: string | null;
  identificacaoFiscal?: string | null;
  descricao?: string | null;
  createdBy?: string | null;
};

export type CategoriaFornecedorOptionRecord = {
  id: string;
  nome: string;
};

export type ServicoOptionRecord = {
  id: string;
  nome: string;
  descricao: string | null;
};

export type FornecedorServicoRecord = {
  id: string;
  servicoId: string | null;
  nome: string;
  descricao: string | null;
  valor: number | null;
};

export type SaveFornecedorServicoInput = {
  fornecedorId: string;
  tenantId: string;
  servicoId: string;
  valor?: number | null;
};

export type FornecedorArquivoRecord = {
  id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  createdAt: Date | null;
};

export type SaveFornecedorArquivoInput = {
  fornecedorId: string;
  tenantId: string;
  nome: string;
  url: string;
  tipo?: string | null;
  tamanho?: number | null;
  createdBy?: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type FornecedorRow = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  categoria: string | null;
  categoriaId: string | null;
  email: string | null;
  pais: string | null;
  identificacaoFiscal: string | null;
  descricao: string | null;
  createdAt: Date | null;
  createdByNome: string | null;
};

type FornecedorServicoRow = {
  id: string;
  servicoId: string | null;
  nome: string;
  descricao: string | null;
  valor: Prisma.Decimal | number | string | null;
};

type FornecedorArquivoRow = {
  id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  createdAt: Date | null;
};

function toNumber(value: Prisma.Decimal | number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return value.toNumber();
}

export interface FornecedoresRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<FornecedorRecord>>;
  findById(id: string): Promise<FornecedorRecord | null>;
  save(input: SaveFornecedorInput): Promise<FornecedorRecord>;
  remove(id: string): Promise<void>;
  listCategorias(tenantId: string): Promise<CategoriaFornecedorOptionRecord[]>;
  listServicos(tenantId: string): Promise<ServicoOptionRecord[]>;
  listFornecedorServicos(tenantId: string, fornecedorId: string): Promise<FornecedorServicoRecord[]>;
  addFornecedorServico(input: SaveFornecedorServicoInput): Promise<FornecedorServicoRecord>;
  updateFornecedorServicoValor(id: string, valor: number | null): Promise<FornecedorServicoRecord | null>;
  removeFornecedorServico(id: string): Promise<void>;
  listArquivos(fornecedorId: string): Promise<FornecedorArquivoRecord[]>;
  addArquivo(input: SaveFornecedorArquivoInput): Promise<FornecedorArquivoRecord>;
  removeArquivo(id: string): Promise<void>;
}

export class PrismaFornecedoresRepository implements FornecedoresRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<FornecedorRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await this.queryFornecedores(
      Prisma.sql`
        WHERE f.tenant_id = ${tenantId}
        ORDER BY f.nome ASC
        LIMIT ${take} OFFSET ${skip}
      `,
    );

    const totals = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM fornecedores
      WHERE tenant_id = ${tenantId}
    `);

    return {
      data: rows.map((row) => this.mapFornecedor(row)),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<FornecedorRecord | null> {
    await this.ensureTables();
    const rows = await this.queryFornecedores(Prisma.sql`WHERE f.id = ${id} LIMIT 1`);
    return rows[0] ? this.mapFornecedor(rows[0]) : null;
  }

  async save(input: SaveFornecedorInput): Promise<FornecedorRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRaw`
        UPDATE fornecedores
        SET
          codigo_externo = ${input.codigoExterno ?? null},
          nome = ${input.nome},
          categoria_id = ${input.categoriaId ?? null},
          email = ${input.email ?? null},
          pais = ${input.pais ?? null},
          identificacao_fiscal = ${input.identificacaoFiscal ?? null},
          descricao = ${input.descricao ?? null},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO fornecedores (
          id,
          tenant_id,
          codigo_externo,
          nome,
          categoria_id,
          email,
          pais,
          identificacao_fiscal,
          descricao,
          created_at,
          updated_at,
          created_by
        ) VALUES (
          ${id},
          ${input.tenantId},
          ${input.codigoExterno ?? null},
          ${input.nome},
          ${input.categoriaId ?? null},
          ${input.email ?? null},
          ${input.pais ?? null},
          ${input.identificacaoFiscal ?? null},
          ${input.descricao ?? null},
          NOW(),
          NOW(),
          ${input.createdBy ?? null}
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Fornecedor nao encontrado apos salvar');
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM fornecedor_arquivos WHERE fornecedor_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM fornecedor_servicos WHERE fornecedor_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM fornecedores WHERE id = ${id}`;
  }

  async listCategorias(tenantId: string): Promise<CategoriaFornecedorOptionRecord[]> {
    if (!(await this.tableExists('categorias_fornecedor'))) {
      return [];
    }

    return prisma.$queryRaw<CategoriaFornecedorOptionRecord[]>(Prisma.sql`
      SELECT id, nome
      FROM categorias_fornecedor
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `);
  }

  async listServicos(tenantId: string): Promise<ServicoOptionRecord[]> {
    if (!(await this.tableExists('servicos'))) {
      return [];
    }

    return prisma.$queryRaw<ServicoOptionRecord[]>(Prisma.sql`
      SELECT id, nome, descricao
      FROM servicos
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `);
  }

  async listFornecedorServicos(tenantId: string, fornecedorId: string): Promise<FornecedorServicoRecord[]> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<FornecedorServicoRow[]>(Prisma.sql`
      SELECT
        id,
        servico_id AS "servicoId",
        nome,
        descricao,
        valor
      FROM fornecedor_servicos
      WHERE tenant_id = ${tenantId}
        AND fornecedor_id = ${fornecedorId}
      ORDER BY nome ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      servicoId: row.servicoId,
      nome: row.nome,
      descricao: row.descricao,
      valor: toNumber(row.valor),
    }));
  }

  async addFornecedorServico(input: SaveFornecedorServicoInput): Promise<FornecedorServicoRecord> {
    await this.ensureTables();

    const servico = await prisma.$queryRaw<ServicoOptionRecord[]>(Prisma.sql`
      SELECT id, nome, descricao
      FROM servicos
      WHERE id = ${input.servicoId}
        AND tenant_id = ${input.tenantId}
      LIMIT 1
    `);

    if (!servico[0]) {
      throw new Error('Servico nao encontrado');
    }

    const rows = await prisma.$queryRaw<FornecedorServicoRow[]>(Prisma.sql`
      INSERT INTO fornecedor_servicos (
        id,
        tenant_id,
        fornecedor_id,
        servico_id,
        nome,
        descricao,
        valor,
        created_at
      ) VALUES (
        ${randomUUID()},
        ${input.tenantId},
        ${input.fornecedorId},
        ${input.servicoId},
        ${servico[0].nome},
        ${servico[0].descricao ?? null},
        ${input.valor ?? null},
        NOW()
      )
      RETURNING id, servico_id AS "servicoId", nome, descricao, valor
    `);

    const saved = rows[0];
    return {
      id: saved.id,
      servicoId: saved.servicoId,
      nome: saved.nome,
      descricao: saved.descricao,
      valor: toNumber(saved.valor),
    };
  }

  async updateFornecedorServicoValor(id: string, valor: number | null): Promise<FornecedorServicoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<FornecedorServicoRow[]>(Prisma.sql`
      UPDATE fornecedor_servicos
      SET valor = ${valor ?? null}
      WHERE id = ${id}
      RETURNING id, servico_id AS "servicoId", nome, descricao, valor
    `);

    if (!rows[0]) {
      return null;
    }

    return {
      id: rows[0].id,
      servicoId: rows[0].servicoId,
      nome: rows[0].nome,
      descricao: rows[0].descricao,
      valor: toNumber(rows[0].valor),
    };
  }

  async removeFornecedorServico(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM fornecedor_servicos WHERE id = ${id}`;
  }

  async listArquivos(fornecedorId: string): Promise<FornecedorArquivoRecord[]> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<FornecedorArquivoRow[]>(Prisma.sql`
      SELECT
        id,
        nome,
        url,
        tipo,
        tamanho,
        created_at AS "createdAt"
      FROM fornecedor_arquivos
      WHERE fornecedor_id = ${fornecedorId}
      ORDER BY created_at DESC
    `);

    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      url: row.url,
      tipo: row.tipo,
      tamanho: row.tamanho,
      createdAt: row.createdAt,
    }));
  }

  async addArquivo(input: SaveFornecedorArquivoInput): Promise<FornecedorArquivoRecord> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<FornecedorArquivoRow[]>(Prisma.sql`
      INSERT INTO fornecedor_arquivos (
        id,
        tenant_id,
        fornecedor_id,
        nome,
        url,
        tipo,
        tamanho,
        created_at,
        created_by
      ) VALUES (
        ${randomUUID()},
        ${input.tenantId},
        ${input.fornecedorId},
        ${input.nome},
        ${input.url},
        ${input.tipo ?? null},
        ${input.tamanho ?? null},
        NOW(),
        ${input.createdBy ?? null}
      )
      RETURNING
        id,
        nome,
        url,
        tipo,
        tamanho,
        created_at AS "createdAt"
    `);

    return {
      id: rows[0].id,
      nome: rows[0].nome,
      url: rows[0].url,
      tipo: rows[0].tipo,
      tamanho: rows[0].tamanho,
      createdAt: rows[0].createdAt,
    };
  }

  async removeArquivo(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM fornecedor_arquivos WHERE id = ${id}`;
  }

  private async queryFornecedores(whereSql: Prisma.Sql): Promise<FornecedorRow[]> {
    const hasCategorias = await this.tableExists('categorias_fornecedor');

    if (hasCategorias) {
      return prisma.$queryRaw<FornecedorRow[]>(Prisma.sql`
        SELECT
          f.id,
          f.tenant_id AS "tenantId",
          f.codigo_externo AS "codigoExterno",
          f.nome,
          c.nome AS categoria,
          f.categoria_id AS "categoriaId",
          f.email,
          f.pais,
          f.identificacao_fiscal AS "identificacaoFiscal",
          f.descricao,
          f.created_at AS "createdAt",
          u.nome AS "createdByNome"
        FROM fornecedores f
        LEFT JOIN categorias_fornecedor c ON c.id = f.categoria_id
        LEFT JOIN "User" u ON u.id = f.created_by
        ${whereSql}
      `);
    }

    return prisma.$queryRaw<FornecedorRow[]>(Prisma.sql`
      SELECT
        f.id,
        f.tenant_id AS "tenantId",
        f.codigo_externo AS "codigoExterno",
        f.nome,
        NULL::text AS categoria,
        f.categoria_id AS "categoriaId",
        f.email,
        f.pais,
        f.identificacao_fiscal AS "identificacaoFiscal",
        f.descricao,
        f.created_at AS "createdAt",
        u.nome AS "createdByNome"
      FROM fornecedores f
      LEFT JOIN "User" u ON u.id = f.created_by
      ${whereSql}
    `);
  }

  private mapFornecedor(row: FornecedorRow): FornecedorRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      codigoExterno: row.codigoExterno,
      nome: row.nome,
      categoria: row.categoria,
      categoriaId: row.categoriaId,
      email: row.email,
      pais: row.pais,
      identificacaoFiscal: row.identificacaoFiscal,
      descricao: row.descricao,
      createdAt: row.createdAt,
      createdByNome: row.createdByNome,
    };
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS fornecedores (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            nome text NOT NULL,
            categoria_id text NULL,
            email text NULL,
            pais text NULL,
            identificacao_fiscal text NULL,
            descricao text NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS fornecedor_servicos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            fornecedor_id text NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
            servico_id text NULL,
            nome text NOT NULL,
            descricao text NULL,
            valor numeric(12, 2) NULL,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS fornecedor_arquivos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            fornecedor_id text NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
            nome text NOT NULL,
            url text NOT NULL,
            tipo text NULL,
            tamanho integer NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS fornecedores_tenant_nome_idx
          ON fornecedores (tenant_id, nome)
        `);
      })();
    }

    await this.ready;
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      select to_regclass(${`public.${tableName}`}) is not null as "exists"
    `;

    return Boolean(rows[0]?.exists);
  }
}
