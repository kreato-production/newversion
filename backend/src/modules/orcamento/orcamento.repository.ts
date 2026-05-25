import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrcamentoRecord = {
  id: string;
  tenantId: string;
  ano: number;
  centroLucroId: string;
  centroLucroNome: string | null;
  descricao: string | null;
  total: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type OrcamentoItemRecord = {
  id: string;
  tenantId: string;
  orcamentoId: string;
  categoria: string; // 'recursos_tecnicos' | 'equipamentos' | 'despesas'
  itemNome: string;
  recursoId: string | null;
  jan: number; fev: number; mar: number; abr: number;
  mai: number; jun: number; jul: number; ago: number;
  set: number; out: number; nov: number; dez: number;
};

export type SaveOrcamentoInput = {
  id?: string;
  tenantId: string;
  ano: number;
  centroLucroId: string;
  descricao?: string | null;
  createdBy?: string | null;
};

export type SaveOrcamentoItemInput = {
  id?: string;
  tenantId: string;
  orcamentoId: string;
  categoria: string;
  itemNome: string;
  recursoId?: string | null;
  jan?: number; fev?: number; mar?: number; abr?: number;
  mai?: number; jun?: number; jul?: number; ago?: number;
  set?: number; out?: number; nov?: number; dez?: number;
};

type OrcamentoRow = {
  id: string;
  tenant_id: string;
  ano: number;
  centro_lucro_id: string;
  centro_lucro_nome: string | null;
  descricao: string | null;
  total: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type OrcamentoItemRow = {
  id: string;
  tenant_id: string;
  orcamento_id: string;
  categoria: string;
  item_nome: string;
  recurso_id: string | null;
  jan: string; fev: string; mar: string; abr: string;
  mai: string; jun: string; jul: string; ago: string;
  set: string; out: string; nov: string; dez: string;
};

// ─── Repository interface ─────────────────────────────────────────────────────

export type OrcamentoTotalPorCentro = {
  centroLucroId: string;
  jan: number; fev: number; mar: number; abr: number;
  mai: number; jun: number; jul: number; ago: number;
  set: number; out: number; nov: number; dez: number;
  total: number;
};

export type OrcamentoItemResumo = {
  centroLucroId: string;
  itemNome: string;
  jan: number; fev: number; mar: number; abr: number;
  mai: number; jun: number; jul: number; ago: number;
  set: number; out: number; nov: number; dez: number;
};

export interface OrcamentoRepository {
  listByTenant(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<{ data: OrcamentoRecord[]; total: number }>;
  findById(id: string, tenantId: string): Promise<OrcamentoRecord | null>;
  findByAnoAndCentro(ano: number, centroLucroId: string, tenantId: string): Promise<OrcamentoRecord | null>;
  save(input: SaveOrcamentoInput): Promise<OrcamentoRecord>;
  remove(id: string, tenantId: string): Promise<void>;
  listItens(orcamentoId: string, tenantId: string): Promise<OrcamentoItemRecord[]>;
  saveItem(input: SaveOrcamentoItemInput): Promise<OrcamentoItemRecord>;
  removeItem(itemId: string, tenantId: string): Promise<void>;
  listByAno(ano: number, tenantId: string): Promise<OrcamentoRecord[]>;
  listTotaisPorAno(ano: number, tenantId: string): Promise<OrcamentoTotalPorCentro[]>;
  listItensPorAno(ano: number, tenantId: string): Promise<OrcamentoItemResumo[]>;
}

// ─── Table init ───────────────────────────────────────────────────────────────

let ready: Promise<void> | null = null;

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS orcamentos (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
      ano integer NOT NULL,
      centro_lucro_id text NOT NULL,
      descricao text NULL,
      created_by text NULL,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW(),
      UNIQUE(tenant_id, ano, centro_lucro_id)
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS orcamento_itens (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
      orcamento_id text NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
      categoria text NOT NULL,
      item_nome text NOT NULL,
      recurso_id text NULL,
      jan numeric(15,2) NOT NULL DEFAULT 0,
      fev numeric(15,2) NOT NULL DEFAULT 0,
      mar numeric(15,2) NOT NULL DEFAULT 0,
      abr numeric(15,2) NOT NULL DEFAULT 0,
      mai numeric(15,2) NOT NULL DEFAULT 0,
      jun numeric(15,2) NOT NULL DEFAULT 0,
      jul numeric(15,2) NOT NULL DEFAULT 0,
      ago numeric(15,2) NOT NULL DEFAULT 0,
      "set" numeric(15,2) NOT NULL DEFAULT 0,
      "out" numeric(15,2) NOT NULL DEFAULT 0,
      nov numeric(15,2) NOT NULL DEFAULT 0,
      dez numeric(15,2) NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT NOW()
    )
  `);

  // Migração: adiciona colunas que podem ter sido criadas em versões anteriores sem elas
  await prisma.$executeRawUnsafe(`
    ALTER TABLE orcamento_itens ADD COLUMN IF NOT EXISTS recurso_id text NULL
  `);
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToOrcamento(row: OrcamentoRow): OrcamentoRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    ano: Number(row.ano),
    centroLucroId: row.centro_lucro_id,
    centroLucroNome: row.centro_lucro_nome,
    descricao: row.descricao,
    total: Number(row.total ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToItem(row: OrcamentoItemRow): OrcamentoItemRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    orcamentoId: row.orcamento_id,
    categoria: row.categoria,
    itemNome: row.item_nome,
    recursoId: row.recurso_id,
    jan: Number(row.jan), fev: Number(row.fev), mar: Number(row.mar), abr: Number(row.abr),
    mai: Number(row.mai), jun: Number(row.jun), jul: Number(row.jul), ago: Number(row.ago),
    set: Number(row.set), out: Number(row.out), nov: Number(row.nov), dez: Number(row.dez),
  };
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class PrismaOrcamentoRepository implements OrcamentoRepository {
  private ready: Promise<void> | null = null;

  private ensureTables() {
    if (!this.ready) {
      this.ready = ensureTables().catch((err) => {
        this.ready = null;
        throw err;
      });
    }
    return this.ready;
  }

  async listByTenant(tenantId: string, opts?: { limit?: number; offset?: number }): Promise<{ data: OrcamentoRecord[]; total: number }> {
    await this.ensureTables();
    const limit = opts?.limit ?? 1000;
    const offset = opts?.offset ?? 0;

    const [countRows, rows] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM orcamentos WHERE tenant_id = ${tenantId}
      `,
      prisma.$queryRaw<OrcamentoRow[]>`
        SELECT o.id, o.tenant_id, o.ano, o.centro_lucro_id,
               cl.nome as centro_lucro_nome,
               o.descricao, o.created_at, o.updated_at,
               COALESCE((
                 SELECT SUM(i.jan+i.fev+i.mar+i.abr+i.mai+i.jun+
                            i.jul+i.ago+i."set"+i."out"+i.nov+i.dez)
                 FROM orcamento_itens i WHERE i.orcamento_id = o.id
               ), 0) as total
        FROM orcamentos o
        LEFT JOIN centros_lucro cl ON cl.id = o.centro_lucro_id
        WHERE o.tenant_id = ${tenantId}
        ORDER BY o.ano DESC, o.centro_lucro_id ASC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    return {
      total: Number(countRows[0]?.count ?? 0),
      data: rows.map(rowToOrcamento),
    };
  }

  async findById(id: string, tenantId: string): Promise<OrcamentoRecord | null> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<OrcamentoRow[]>`
      SELECT o.id, o.tenant_id, o.ano, o.centro_lucro_id,
             cl.nome as centro_lucro_nome,
             o.descricao, o.created_at, o.updated_at,
             COALESCE((
               SELECT SUM(i.jan+i.fev+i.mar+i.abr+i.mai+i.jun+
                          i.jul+i.ago+i."set"+i."out"+i.nov+i.dez)
               FROM orcamento_itens i WHERE i.orcamento_id = o.id
             ), 0) as total
      FROM orcamentos o
      LEFT JOIN centros_lucro cl ON cl.id = o.centro_lucro_id
      WHERE o.id = ${id} AND o.tenant_id = ${tenantId}
    `;
    return rows[0] ? rowToOrcamento(rows[0]) : null;
  }

  async findByAnoAndCentro(ano: number, centroLucroId: string, tenantId: string): Promise<OrcamentoRecord | null> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<OrcamentoRow[]>`
      SELECT o.id, o.tenant_id, o.ano, o.centro_lucro_id,
             cl.nome as centro_lucro_nome,
             o.descricao, o.created_at, o.updated_at,
             COALESCE((
               SELECT SUM(i.jan+i.fev+i.mar+i.abr+i.mai+i.jun+
                          i.jul+i.ago+i."set"+i."out"+i.nov+i.dez)
               FROM orcamento_itens i WHERE i.orcamento_id = o.id
             ), 0) as total
      FROM orcamentos o
      LEFT JOIN centros_lucro cl ON cl.id = o.centro_lucro_id
      WHERE o.ano = ${ano} AND o.centro_lucro_id = ${centroLucroId} AND o.tenant_id = ${tenantId}
    `;
    return rows[0] ? rowToOrcamento(rows[0]) : null;
  }

  async save(input: SaveOrcamentoInput): Promise<OrcamentoRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();
    const now = new Date();

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE orcamentos SET ano=$1, centro_lucro_id=$2, descricao=$3, updated_at=$4 WHERE id=$5 AND tenant_id=$6`,
        input.ano, input.centroLucroId, input.descricao ?? null, now, id, input.tenantId,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO orcamentos (id,tenant_id,ano,centro_lucro_id,descricao,created_by,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (tenant_id,ano,centro_lucro_id) DO UPDATE SET descricao=$5, updated_at=$8`,
        id, input.tenantId, input.ano, input.centroLucroId, input.descricao ?? null,
        input.createdBy ?? null, now, now,
      );
    }

    const result = await this.findById(id, input.tenantId);
    return result!;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM orcamentos WHERE id=$1 AND tenant_id=$2`, id, tenantId);
  }

  async listItens(orcamentoId: string, tenantId: string): Promise<OrcamentoItemRecord[]> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<OrcamentoItemRow[]>`
      SELECT id, tenant_id, orcamento_id, categoria, item_nome, recurso_id,
             jan, fev, mar, abr, mai, jun, jul, ago,
             "set" as set, "out" as out, nov, dez
      FROM orcamento_itens
      WHERE orcamento_id = ${orcamentoId} AND tenant_id = ${tenantId}
      ORDER BY categoria, item_nome
    `;
    return rows.map(rowToItem);
  }

  async saveItem(input: SaveOrcamentoItemInput): Promise<OrcamentoItemRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();
    const n = (v?: number) => v ?? 0;

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE orcamento_itens SET categoria=$1,item_nome=$2,recurso_id=$3,jan=$4,fev=$5,mar=$6,abr=$7,mai=$8,jun=$9,jul=$10,ago=$11,"set"=$12,"out"=$13,nov=$14,dez=$15 WHERE id=$16 AND tenant_id=$17`,
        input.categoria, input.itemNome, input.recursoId ?? null,
        n(input.jan), n(input.fev), n(input.mar), n(input.abr),
        n(input.mai), n(input.jun), n(input.jul), n(input.ago),
        n(input.set), n(input.out), n(input.nov), n(input.dez),
        id, input.tenantId,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO orcamento_itens (id,tenant_id,orcamento_id,categoria,item_nome,recurso_id,jan,fev,mar,abr,mai,jun,jul,ago,"set","out",nov,dez)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        id, input.tenantId, input.orcamentoId, input.categoria, input.itemNome, input.recursoId ?? null,
        n(input.jan), n(input.fev), n(input.mar), n(input.abr),
        n(input.mai), n(input.jun), n(input.jul), n(input.ago),
        n(input.set), n(input.out), n(input.nov), n(input.dez),
      );
    }

    const rows = await prisma.$queryRaw<OrcamentoItemRow[]>`
      SELECT id, tenant_id, orcamento_id, categoria, item_nome, recurso_id,
             jan, fev, mar, abr, mai, jun, jul, ago,
             "set" as set, "out" as out, nov, dez
      FROM orcamento_itens WHERE id=${id} AND tenant_id=${input.tenantId}
    `;
    return rowToItem(rows[0]!);
  }

  async removeItem(itemId: string, tenantId: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM orcamento_itens WHERE id=$1 AND tenant_id=$2`, itemId, tenantId);
  }

  async listByAno(ano: number, tenantId: string): Promise<OrcamentoRecord[]> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<OrcamentoRow[]>`
      SELECT o.id, o.tenant_id, o.ano, o.centro_lucro_id,
             cl.nome as centro_lucro_nome,
             o.descricao, o.created_at, o.updated_at,
             COALESCE((
               SELECT SUM(i.jan+i.fev+i.mar+i.abr+i.mai+i.jun+
                          i.jul+i.ago+i."set"+i."out"+i.nov+i.dez)
               FROM orcamento_itens i WHERE i.orcamento_id = o.id
             ), 0) as total
      FROM orcamentos o
      LEFT JOIN centros_lucro cl ON cl.id = o.centro_lucro_id
      WHERE o.ano = ${ano} AND o.tenant_id = ${tenantId}
    `;
    return rows.map(rowToOrcamento);
  }

  async listItensPorAno(ano: number, tenantId: string): Promise<OrcamentoItemResumo[]> {
    await this.ensureTables();
    type Row = {
      centro_lucro_id: string;
      item_nome: string;
      jan: string; fev: string; mar: string; abr: string;
      mai: string; jun: string; jul: string; ago: string;
      set: string; out: string; nov: string; dez: string;
    };
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT o.centro_lucro_id,
             i.item_nome,
             COALESCE(SUM(i.jan), 0) as jan, COALESCE(SUM(i.fev), 0) as fev,
             COALESCE(SUM(i.mar), 0) as mar, COALESCE(SUM(i.abr), 0) as abr,
             COALESCE(SUM(i.mai), 0) as mai, COALESCE(SUM(i.jun), 0) as jun,
             COALESCE(SUM(i.jul), 0) as jul, COALESCE(SUM(i.ago), 0) as ago,
             COALESCE(SUM(i."set"), 0) as set, COALESCE(SUM(i."out"), 0) as out,
             COALESCE(SUM(i.nov), 0) as nov, COALESCE(SUM(i.dez), 0) as dez
      FROM orcamentos o
      JOIN orcamento_itens i ON i.orcamento_id = o.id AND i.tenant_id = o.tenant_id
      WHERE o.ano = ${ano} AND o.tenant_id = ${tenantId}
      GROUP BY o.centro_lucro_id, i.item_nome
      ORDER BY o.centro_lucro_id, i.item_nome
    `;
    return rows.map((r) => ({
      centroLucroId: r.centro_lucro_id,
      itemNome: r.item_nome,
      jan: Number(r.jan), fev: Number(r.fev), mar: Number(r.mar), abr: Number(r.abr),
      mai: Number(r.mai), jun: Number(r.jun), jul: Number(r.jul), ago: Number(r.ago),
      set: Number(r.set), out: Number(r.out), nov: Number(r.nov), dez: Number(r.dez),
    }));
  }

  async listTotaisPorAno(ano: number, tenantId: string): Promise<OrcamentoTotalPorCentro[]> {
    await this.ensureTables();
    type TotalRow = {
      centro_lucro_id: string;
      jan: string; fev: string; mar: string; abr: string;
      mai: string; jun: string; jul: string; ago: string;
      set: string; out: string; nov: string; dez: string;
      total: string;
    };
    const rows = await prisma.$queryRaw<TotalRow[]>`
      SELECT o.centro_lucro_id,
             COALESCE(SUM(i.jan), 0) as jan, COALESCE(SUM(i.fev), 0) as fev,
             COALESCE(SUM(i.mar), 0) as mar, COALESCE(SUM(i.abr), 0) as abr,
             COALESCE(SUM(i.mai), 0) as mai, COALESCE(SUM(i.jun), 0) as jun,
             COALESCE(SUM(i.jul), 0) as jul, COALESCE(SUM(i.ago), 0) as ago,
             COALESCE(SUM(i."set"), 0) as set, COALESCE(SUM(i."out"), 0) as out,
             COALESCE(SUM(i.nov), 0) as nov, COALESCE(SUM(i.dez), 0) as dez,
             COALESCE(SUM(
               i.jan+i.fev+i.mar+i.abr+i.mai+i.jun+
               i.jul+i.ago+i."set"+i."out"+i.nov+i.dez
             ), 0) as total
      FROM orcamentos o
      LEFT JOIN orcamento_itens i ON i.orcamento_id = o.id AND i.tenant_id = o.tenant_id
      WHERE o.ano = ${ano} AND o.tenant_id = ${tenantId}
      GROUP BY o.centro_lucro_id
    `;
    return rows.map((r) => ({
      centroLucroId: r.centro_lucro_id,
      jan: Number(r.jan), fev: Number(r.fev), mar: Number(r.mar), abr: Number(r.abr),
      mai: Number(r.mai), jun: Number(r.jun), jul: Number(r.jul), ago: Number(r.ago),
      set: Number(r.set), out: Number(r.out), nov: Number(r.nov), dez: Number(r.dez),
      total: Number(r.total),
    }));
  }
}
