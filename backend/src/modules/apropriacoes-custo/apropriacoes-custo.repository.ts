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
  private async tableExists(name: string): Promise<boolean> {
    const rows = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
      `SELECT to_regclass($1) IS NOT NULL AS e`,
      `public.${name}`,
    );
    return Boolean(rows[0]?.e);
  }

  private async columnExists(table: string, column: string): Promise<boolean> {
    const rows = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
       ) AS e`,
      table,
      column,
    );
    return Boolean(rows[0]?.e);
  }

  async aggregateCosts(tenantId: string, opts: ApropriacaoCustoOptions): Promise<CostAggRow[]> {
    const { ano } = opts;
    const safe = (s: string) => s.replace(/'/g, "''");
    const st = safe(tenantId);

    // centroLucro stores the centro's name (not id) — join by nome
    const clWhere = opts.centroLucroId ? `AND cl.id = '${safe(opts.centroLucroId)}'` : '';
    const unWhere = opts.unidadeId ? `AND g."unidadeNegocioId" = '${safe(opts.unidadeId)}'` : '';

    const commonGravJoins = `
      LEFT JOIN centros_lucro cl ON cl.nome = g."centroLucro"
      LEFT JOIN "UnidadeNegocio" un ON un.id = g."unidadeNegocioId"
    `;

    const parts: RawRow[][] = [];

    // 1. Recursos físicos dos espaços (gravacao_espaco_recursos_fisicos)
    if (await this.tableExists('gravacao_espaco_recursos_fisicos')) {
      const rows = await prisma.$queryRawUnsafe<RawRow[]>(`
        SELECT
          EXTRACT(MONTH FROM g."dataPrevista")::int AS mes,
          cl.id AS centro_lucro_id, cl.nome AS centro_lucro_nome,
          un.id::text AS unidade_id, un.nome AS unidade_nome,
          rf.nome AS recurso_nome,
          SUM(COALESCE(gerf.valor_com_desconto, gerf.valor_total, 0)) AS custo
        FROM gravacao_espaco_recursos_fisicos gerf
        JOIN gravacao_espacos ge ON ge.id = gerf.gravacao_espaco_id
        JOIN "Gravacao" g ON g.id = ge.gravacao_id
        JOIN recursos_fisicos rf ON rf.id = gerf.recurso_fisico_id
        ${commonGravJoins}
        WHERE gerf.tenant_id = '${st}'
          AND g."dataPrevista" IS NOT NULL
          AND EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
          ${clWhere} ${unWhere}
        GROUP BY 1, cl.id, cl.nome, un.id, un.nome, rf.nome
      `);
      parts.push(rows);
    }

    // 2. Recursos técnicos dos espaços (gravacao_espaco_recursos_tecnicos)
    if (await this.tableExists('gravacao_espaco_recursos_tecnicos')) {
      const rows = await prisma.$queryRawUnsafe<RawRow[]>(`
        SELECT
          EXTRACT(MONTH FROM g."dataPrevista")::int AS mes,
          cl.id AS centro_lucro_id, cl.nome AS centro_lucro_nome,
          un.id::text AS unidade_id, un.nome AS unidade_nome,
          rt.nome AS recurso_nome,
          SUM(COALESCE(gert.valor_com_desconto, gert.valor_total, 0)) AS custo
        FROM gravacao_espaco_recursos_tecnicos gert
        JOIN gravacao_espacos ge ON ge.id = gert.gravacao_espaco_id
        JOIN "Gravacao" g ON g.id = ge.gravacao_id
        JOIN recursos_tecnicos rt ON rt.id = gert.recurso_tecnico_id
        ${commonGravJoins}
        WHERE gert.tenant_id = '${st}'
          AND g."dataPrevista" IS NOT NULL
          AND EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
          ${clWhere} ${unWhere}
        GROUP BY 1, cl.id, cl.nome, un.id, un.nome, rt.nome
      `);
      parts.push(rows);
    }

    // 3. Recursos humanos e físicos diretos (gravacao_recursos)
    if (await this.tableExists('gravacao_recursos')) {
      const horaCalc = `
        GREATEST(
          (SPLIT_PART(gr.hora_fim, ':', 1)::int * 60 + SPLIT_PART(gr.hora_fim, ':', 2)::int)
          - (SPLIT_PART(gr.hora_inicio, ':', 1)::int * 60 + SPLIT_PART(gr.hora_inicio, ':', 2)::int),
          0
        ) / 60.0
      `;

      const rhRows = await prisma.$queryRawUnsafe<RawRow[]>(`
        SELECT
          EXTRACT(MONTH FROM g."dataPrevista")::int AS mes,
          cl.id AS centro_lucro_id, cl.nome AS centro_lucro_nome,
          un.id::text AS unidade_id, un.nome AS unidade_nome,
          TRIM(rh.nome || ' ' || COALESCE(rh.sobrenome, '')) AS recurso_nome,
          SUM((${horaCalc}) * COALESCE(rh.custo_hora, 0)) AS custo
        FROM gravacao_recursos gr
        JOIN "Gravacao" g ON g.id = gr.gravacao_id
        JOIN recursos_humanos rh ON rh.id = gr.recurso_humano_id
        ${commonGravJoins}
        WHERE gr.tenant_id = '${st}'
          AND gr.recurso_humano_id IS NOT NULL
          AND gr.hora_inicio IS NOT NULL AND gr.hora_fim IS NOT NULL
          AND g."dataPrevista" IS NOT NULL
          AND EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
          ${clWhere} ${unWhere}
        GROUP BY 1, cl.id, cl.nome, un.id, un.nome, rh.nome, rh.sobrenome
      `);
      parts.push(rhRows);

      const rfRows = await prisma.$queryRawUnsafe<RawRow[]>(`
        SELECT
          EXTRACT(MONTH FROM g."dataPrevista")::int AS mes,
          cl.id AS centro_lucro_id, cl.nome AS centro_lucro_nome,
          un.id::text AS unidade_id, un.nome AS unidade_nome,
          rf.nome AS recurso_nome,
          SUM((${horaCalc}) * COALESCE(rf.custo_hora, 0)) AS custo
        FROM gravacao_recursos gr
        JOIN "Gravacao" g ON g.id = gr.gravacao_id
        JOIN recursos_fisicos rf ON rf.id = gr.recurso_fisico_id
        ${commonGravJoins}
        WHERE gr.tenant_id = '${st}'
          AND gr.recurso_fisico_id IS NOT NULL
          AND gr.hora_inicio IS NOT NULL AND gr.hora_fim IS NOT NULL
          AND g."dataPrevista" IS NOT NULL
          AND EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
          ${clWhere} ${unWhere}
        GROUP BY 1, cl.id, cl.nome, un.id, un.nome, rf.nome
      `);
      parts.push(rfRows);
    }

    // 4. Terceiros (gravacao_terceiros)
    if (await this.tableExists('gravacao_terceiros')) {
      const rows = await prisma.$queryRawUnsafe<RawRow[]>(`
        SELECT
          EXTRACT(MONTH FROM g."dataPrevista")::int AS mes,
          cl.id AS centro_lucro_id, cl.nome AS centro_lucro_nome,
          un.id::text AS unidade_id, un.nome AS unidade_nome,
          COALESCE(fs.nome, 'Terceiros') AS recurso_nome,
          SUM(COALESCE(gt.valor::numeric, 0)) AS custo
        FROM gravacao_terceiros gt
        JOIN "Gravacao" g ON g.id = gt.gravacao_id
        LEFT JOIN fornecedor_servicos fs ON fs.id = gt.servico_id
        ${commonGravJoins}
        WHERE gt.tenant_id = '${st}'
          AND g."dataPrevista" IS NOT NULL
          AND EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
          ${clWhere} ${unWhere}
        GROUP BY 1, cl.id, cl.nome, un.id, un.nome, fs.nome
      `);
      parts.push(rows);
    }

    // 5. Despesas vinculadas às gravações (gravacao_despesas) — uma linha por centro/mês
    if (await this.tableExists('gravacao_despesas')) {
      const rows = await prisma.$queryRawUnsafe<RawRow[]>(`
        SELECT
          EXTRACT(MONTH FROM g."dataPrevista")::int AS mes,
          cl.id AS centro_lucro_id, cl.nome AS centro_lucro_nome,
          un.id::text AS unidade_id, un.nome AS unidade_nome,
          'Despesas' AS recurso_nome,
          SUM(COALESCE(gd.valor, 0)) AS custo
        FROM gravacao_despesas gd
        JOIN "Gravacao" g ON g.id = gd.gravacao_id
        ${commonGravJoins}
        WHERE gd.tenant_id = '${st}'
          AND g."dataPrevista" IS NOT NULL
          AND EXTRACT(YEAR FROM g."dataPrevista") = ${ano}
          ${clWhere} ${unWhere}
        GROUP BY 1, cl.id, cl.nome, un.id, un.nome
      `);
      parts.push(rows);
    }

    // 6. Orçamento de eventos (gestao_eventos.orcamento_itens)
    if (
      await this.tableExists('gestao_eventos') &&
      await this.columnExists('gestao_eventos', 'orcamento_itens') &&
      await this.columnExists('gestao_eventos', 'unidade_negocio_id')
    ) {
      const geUnWhere = opts.unidadeId ? `AND ge.unidade_negocio_id::text = '${safe(opts.unidadeId)}'` : '';
      const rows = await prisma.$queryRawUnsafe<RawRow[]>(`
        SELECT
          EXTRACT(MONTH FROM (item->>'dataPagamento')::date)::int AS mes,
          cl.id AS centro_lucro_id,
          cl.nome AS centro_lucro_nome,
          un.id::text AS unidade_id,
          un.nome AS unidade_nome,
          COALESCE(item->>'fornecedorNome', 'Fornecedor') AS recurso_nome,
          SUM(COALESCE((item->>'valor')::numeric, 0)) AS custo
        FROM gestao_eventos ge
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ge.orcamento_itens, '[]'::jsonb)) AS item
        LEFT JOIN centros_lucro cl ON cl.id::text = (item->>'centroLucroId')
        LEFT JOIN "UnidadeNegocio" un ON un.id::text = ge.unidade_negocio_id::text
        WHERE ge.tenant_id = '${st}'
          AND (item->>'dataPagamento') IS NOT NULL
          AND (item->>'dataPagamento') != ''
          AND EXTRACT(YEAR FROM (item->>'dataPagamento')::date) = ${ano}
          ${clWhere} ${geUnWhere}
        GROUP BY mes, cl.id, cl.nome, un.id, un.nome, item->>'fornecedorNome'
      `);
      parts.push(rows);
    }

    return parts.flat().map(mapRow);
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
