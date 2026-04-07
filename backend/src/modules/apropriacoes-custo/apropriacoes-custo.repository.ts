import { prisma } from '../../lib/prisma.js';

export type CostAggRow = {
  mes: number;
  centroLucroId: string | null;
  centroLucroNome: string | null;
  unidadeId: string | null;
  unidadeNome: string | null;
  recursoNome: string;
  custo: number;
};

export type ApropriacaoCustoOptions = {
  ano: number;
  centroLucroId?: string | null;
  unidadeId?: string | null;
};

type RawRow = {
  mes: string | number;
  centro_lucro_id: string | null;
  centro_lucro_nome: string | null;
  unidade_id: string | null;
  unidade_nome: string | null;
  recurso_nome: string | null;
  custo: string | number | null;
};

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapRow(row: RawRow): CostAggRow {
  return {
    mes: Number(row.mes),
    centroLucroId: row.centro_lucro_id,
    centroLucroNome: row.centro_lucro_nome,
    unidadeId: row.unidade_id,
    unidadeNome: row.unidade_nome,
    recursoNome: row.recurso_nome || 'Sem Classificação',
    custo: toNum(row.custo),
  };
}

export interface ApropriacoesCustoRepository {
  aggregateCosts(tenantId: string, opts: ApropriacaoCustoOptions): Promise<CostAggRow[]>;
  listCentrosLucro(tenantId: string): Promise<Array<{ id: string; nome: string }>>;
  listUnidades(tenantId: string): Promise<Array<{ id: string; nome: string }>>;
}

export class PrismaApropriacoesCustoRepository implements ApropriacoesCustoRepository {
  async aggregateCosts(tenantId: string, opts: ApropriacaoCustoOptions): Promise<CostAggRow[]> {
    const { ano } = opts;

    // Build optional filter predicates
    const clFilter = opts.centroLucroId
      ? `AND c.centro_lucro_id = '${opts.centroLucroId.replace(/'/g, "''")}'`
      : '';
    const unFilter = opts.unidadeId
      ? `AND c.unidade_negocio_id::text = '${opts.unidadeId.replace(/'/g, "''")}'`
      : '';

    const sql = `
      -- Recursos Técnicos
      SELECT
        EXTRACT(MONTH FROM g."dataPrevista")::int  AS mes,
        cl.id                                       AS centro_lucro_id,
        cl.nome                                     AS centro_lucro_nome,
        un.id::text                                 AS unidade_id,
        un.nome                                     AS unidade_nome,
        rt.nome                                     AS recurso_nome,
        SUM(COALESCE(cr.valor_com_desconto, cr.valor_total, 0)) AS custo
      FROM   public.conteudo_recursos_tecnicos cr
      JOIN   public.conteudos  c  ON c.id   = cr.conteudo_id
      JOIN   "Gravacao"        g  ON g."conteudoId" = c.id
      JOIN   recursos_tecnicos rt ON rt.id  = cr.recurso_tecnico_id
      LEFT JOIN centros_lucro  cl ON cl.id  = c.centro_lucro_id
      LEFT JOIN "UnidadeNegocio" un ON un.id = c.unidade_negocio_id::text
      WHERE  cr.tenant_id = '${tenantId}'
        AND  g."dataPrevista" IS NOT NULL
        AND  EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
        ${clFilter} ${unFilter}
      GROUP  BY 1, cl.id, cl.nome, un.id, un.nome, rt.nome

      UNION ALL

      -- Recursos Físicos
      SELECT
        EXTRACT(MONTH FROM g."dataPrevista")::int  AS mes,
        cl.id                                       AS centro_lucro_id,
        cl.nome                                     AS centro_lucro_nome,
        un.id::text                                 AS unidade_id,
        un.nome                                     AS unidade_nome,
        rf.nome                                     AS recurso_nome,
        SUM(COALESCE(cr.valor_com_desconto, cr.valor_total, 0)) AS custo
      FROM   public.conteudo_recursos_fisicos cr
      JOIN   public.conteudos  c  ON c.id   = cr.conteudo_id
      JOIN   "Gravacao"        g  ON g."conteudoId" = c.id
      JOIN   recursos_fisicos  rf ON rf.id  = cr.recurso_fisico_id
      LEFT JOIN centros_lucro  cl ON cl.id  = c.centro_lucro_id
      LEFT JOIN "UnidadeNegocio" un ON un.id = c.unidade_negocio_id::text
      WHERE  cr.tenant_id = '${tenantId}'
        AND  g."dataPrevista" IS NOT NULL
        AND  EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
        ${clFilter} ${unFilter}
      GROUP  BY 1, cl.id, cl.nome, un.id, un.nome, rf.nome

      UNION ALL

      -- Terceiros (serviços)
      SELECT
        EXTRACT(MONTH FROM g."dataPrevista")::int  AS mes,
        cl.id                                       AS centro_lucro_id,
        cl.nome                                     AS centro_lucro_nome,
        un.id::text                                 AS unidade_id,
        un.nome                                     AS unidade_nome,
        COALESCE(s.nome, 'Terceiros')               AS recurso_nome,
        SUM(COALESCE(ct.valor_previsto, 0))         AS custo
      FROM   public.conteudo_terceiros ct
      JOIN   public.conteudos  c  ON c.id   = ct.conteudo_id
      JOIN   "Gravacao"        g  ON g."conteudoId" = c.id
      LEFT JOIN servicos       s  ON s.id   = ct.servico_id
      LEFT JOIN centros_lucro  cl ON cl.id  = c.centro_lucro_id
      LEFT JOIN "UnidadeNegocio" un ON un.id = c.unidade_negocio_id::text
      WHERE  ct.tenant_id = '${tenantId}'
        AND  g."dataPrevista" IS NOT NULL
        AND  EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
        ${clFilter} ${unFilter}
      GROUP  BY 1, cl.id, cl.nome, un.id, un.nome, s.nome

      ORDER  BY centro_lucro_nome NULLS LAST, recurso_nome, mes
    `;

    const rows = await prisma.$queryRawUnsafe<RawRow[]>(sql);
    return rows.map(mapRow);
  }

  async listCentrosLucro(tenantId: string): Promise<Array<{ id: string; nome: string }>> {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; nome: string }>>(
      `SELECT id, nome FROM centros_lucro WHERE tenant_id = $1 ORDER BY nome`,
      tenantId,
    );
    return rows;
  }

  async listUnidades(tenantId: string): Promise<Array<{ id: string; nome: string }>> {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; nome: string }>>(
      `SELECT id::text as id, nome FROM "UnidadeNegocio" WHERE "tenantId" = $1 ORDER BY nome`,
      tenantId,
    );
    return rows;
  }
}
