import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type FigurinoImagemRecord = {
  id: string;
  url: string;
  isPrincipal: boolean;
};

export type FigurinoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino: string | null;
  tipoFigurinoId: string | null;
  material: string | null;
  materialId: string | null;
  tamanhoPeca: string | null;
  corPredominante: string | null;
  corSecundaria: string | null;
  createdAt: Date | null;
  createdByNome: string | null;
  imagens: FigurinoImagemRecord[];
};

export type SaveFigurinoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  codigoFigurino: string;
  descricao: string;
  tipoFigurinoId?: string | null;
  materialId?: string | null;
  tamanhoPeca?: string | null;
  corPredominante?: string | null;
  corSecundaria?: string | null;
  createdBy?: string | null;
  imagens?: FigurinoImagemRecord[];
};

export type TipoFigurinoOptionRecord = {
  id: string;
  nome: string;
};

export type MaterialOptionRecord = {
  id: string;
  nome: string;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type FigurinoRow = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino: string | null;
  tipoFigurinoId: string | null;
  material: string | null;
  materialId: string | null;
  tamanhoPeca: string | null;
  corPredominante: string | null;
  corSecundaria: string | null;
  createdAt: Date | null;
  createdByNome: string | null;
};

type FigurinoImagemRow = {
  id: string;
  figurinoId: string;
  url: string;
  isPrincipal: boolean | null;
};

export interface FigurinosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<FigurinoRecord>>;
  findById(id: string): Promise<FigurinoRecord | null>;
  save(input: SaveFigurinoInput): Promise<FigurinoRecord>;
  remove(id: string): Promise<void>;
  listTiposFigurino(tenantId: string): Promise<TipoFigurinoOptionRecord[]>;
  listMateriais(tenantId: string): Promise<MaterialOptionRecord[]>;
}

export class PrismaFigurinosRepository implements FigurinosRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<FigurinoRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await this.queryFigurinos(
      Prisma.sql`
        WHERE f.tenant_id = ${tenantId}
        ORDER BY f.codigo_figurino ASC
        LIMIT ${take} OFFSET ${skip}
      `,
    );

    const totals = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM figurinos
      WHERE tenant_id = ${tenantId}
    `);

    return {
      data: await this.enrichFigurinos(rows),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<FigurinoRecord | null> {
    await this.ensureTables();

    const rows = await this.queryFigurinos(Prisma.sql`WHERE f.id = ${id} LIMIT 1`);
    const data = await this.enrichFigurinos(rows);
    return data[0] ?? null;
  }

  async save(input: SaveFigurinoInput): Promise<FigurinoRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRaw`
        UPDATE figurinos
        SET
          codigo_externo = ${input.codigoExterno ?? null},
          codigo_figurino = ${input.codigoFigurino},
          descricao = ${input.descricao},
          tipo_figurino_id = ${input.tipoFigurinoId ?? null},
          material_id = ${input.materialId ?? null},
          tamanho_peca = ${input.tamanhoPeca ?? null},
          cor_predominante = ${input.corPredominante ?? null},
          cor_secundaria = ${input.corSecundaria ?? null},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO figurinos (
          id,
          tenant_id,
          codigo_externo,
          codigo_figurino,
          descricao,
          tipo_figurino_id,
          material_id,
          tamanho_peca,
          cor_predominante,
          cor_secundaria,
          created_at,
          updated_at,
          created_by
        ) VALUES (
          ${id},
          ${input.tenantId},
          ${input.codigoExterno ?? null},
          ${input.codigoFigurino},
          ${input.descricao},
          ${input.tipoFigurinoId ?? null},
          ${input.materialId ?? null},
          ${input.tamanhoPeca ?? null},
          ${input.corPredominante ?? null},
          ${input.corSecundaria ?? null},
          NOW(),
          NOW(),
          ${input.createdBy ?? null}
        )
      `;
    }

    await prisma.$executeRaw`DELETE FROM figurino_imagens WHERE figurino_id = ${id}`;

    for (const imagem of input.imagens ?? []) {
      await prisma.$executeRaw`
        INSERT INTO figurino_imagens (
          id,
          tenant_id,
          figurino_id,
          url,
          is_principal,
          created_at
        ) VALUES (
          ${imagem.id || randomUUID()},
          ${input.tenantId},
          ${id},
          ${imagem.url},
          ${imagem.isPrincipal},
          NOW()
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Figurino nao encontrado apos salvar');
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM figurino_imagens WHERE figurino_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM figurinos WHERE id = ${id}`;
  }

  async listTiposFigurino(tenantId: string): Promise<TipoFigurinoOptionRecord[]> {
    if (!(await this.tableExists('tipos_figurino'))) {
      return [];
    }

    return prisma.$queryRaw<TipoFigurinoOptionRecord[]>(Prisma.sql`
      SELECT id, nome
      FROM tipos_figurino
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `);
  }

  async listMateriais(tenantId: string): Promise<MaterialOptionRecord[]> {
    if (!(await this.tableExists('materiais'))) {
      return [];
    }

    return prisma.$queryRaw<MaterialOptionRecord[]>(Prisma.sql`
      SELECT id, nome
      FROM materiais
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `);
  }

  private async queryFigurinos(whereSql: Prisma.Sql): Promise<FigurinoRow[]> {
    const hasTipos = await this.tableExists('tipos_figurino');
    const hasMateriais = await this.tableExists('materiais');

    if (hasTipos && hasMateriais) {
      return prisma.$queryRaw<FigurinoRow[]>(Prisma.sql`
        SELECT
          f.id,
          f.tenant_id AS "tenantId",
          f.codigo_externo AS "codigoExterno",
          f.codigo_figurino AS "codigoFigurino",
          f.descricao,
          tf.nome AS "tipoFigurino",
          f.tipo_figurino_id AS "tipoFigurinoId",
          m.nome AS material,
          f.material_id AS "materialId",
          f.tamanho_peca AS "tamanhoPeca",
          f.cor_predominante AS "corPredominante",
          f.cor_secundaria AS "corSecundaria",
          f.created_at AS "createdAt",
          u.nome AS "createdByNome"
        FROM figurinos f
        LEFT JOIN tipos_figurino tf ON tf.id = f.tipo_figurino_id
        LEFT JOIN materiais m ON m.id = f.material_id
        LEFT JOIN "User" u ON u.id = f.created_by
        ${whereSql}
      `);
    }

    return prisma.$queryRaw<FigurinoRow[]>(Prisma.sql`
      SELECT
        f.id,
        f.tenant_id AS "tenantId",
        f.codigo_externo AS "codigoExterno",
        f.codigo_figurino AS "codigoFigurino",
        f.descricao,
        NULL::text AS "tipoFigurino",
        f.tipo_figurino_id AS "tipoFigurinoId",
        NULL::text AS material,
        f.material_id AS "materialId",
        f.tamanho_peca AS "tamanhoPeca",
        f.cor_predominante AS "corPredominante",
        f.cor_secundaria AS "corSecundaria",
        f.created_at AS "createdAt",
        u.nome AS "createdByNome"
      FROM figurinos f
      LEFT JOIN "User" u ON u.id = f.created_by
      ${whereSql}
    `);
  }

  private async enrichFigurinos(rows: FigurinoRow[]): Promise<FigurinoRecord[]> {
    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map((row) => row.id);
    const imagens = await prisma.$queryRaw<FigurinoImagemRow[]>(Prisma.sql`
      SELECT
        id,
        figurino_id AS "figurinoId",
        url,
        is_principal AS "isPrincipal"
      FROM figurino_imagens
      WHERE figurino_id IN (${Prisma.join(ids)})
      ORDER BY created_at ASC
    `);

    const imagensByFigurino = new Map<string, FigurinoImagemRecord[]>();
    for (const imagem of imagens) {
      const current = imagensByFigurino.get(imagem.figurinoId) ?? [];
      current.push({
        id: imagem.id,
        url: imagem.url,
        isPrincipal: Boolean(imagem.isPrincipal),
      });
      imagensByFigurino.set(imagem.figurinoId, current);
    }

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      codigoExterno: row.codigoExterno,
      codigoFigurino: row.codigoFigurino,
      descricao: row.descricao,
      tipoFigurino: row.tipoFigurino,
      tipoFigurinoId: row.tipoFigurinoId,
      material: row.material,
      materialId: row.materialId,
      tamanhoPeca: row.tamanhoPeca,
      corPredominante: row.corPredominante,
      corSecundaria: row.corSecundaria,
      createdAt: row.createdAt,
      createdByNome: row.createdByNome,
      imagens: imagensByFigurino.get(row.id) ?? [],
    }));
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS figurinos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            codigo_figurino text NOT NULL,
            descricao text NOT NULL,
            tipo_figurino_id text NULL,
            material_id text NULL,
            tamanho_peca text NULL,
            cor_predominante text NULL,
            cor_secundaria text NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS figurino_imagens (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            figurino_id text NOT NULL REFERENCES figurinos(id) ON DELETE CASCADE,
            url text NOT NULL,
            is_principal boolean NOT NULL DEFAULT false,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS figurinos_tenant_codigo_idx
          ON figurinos (tenant_id, codigo_figurino)
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
