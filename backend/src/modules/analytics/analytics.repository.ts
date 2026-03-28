import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type DashboardRecordingRecord = {
  id: string;
  nome: string;
  codigo: string;
  dataPrevista: string | null;
  status: string | null;
};

export type DashboardOverviewRecord = {
  stats: {
    gravacoes: number;
    gravacoesAtivas: number;
    conteudos: number;
    recursosHumanos: number;
    recursosTecnicos: number;
    recursosFisicos: number;
    unidades: number;
    fornecedores: number;
  };
  gravacoesSemana: DashboardRecordingRecord[];
  gravacoes: DashboardRecordingRecord[];
};

export type GravacaoBasicInfoRecord = {
  id: string;
  tenantId: string;
  codigo: string;
  nome: string;
  dataPrevista: string | null;
  descricao: string | null;
  status: string | null;
  unidadeNegocio: string | null;
  unidadeNegocioLogo: string | null;
  unidadeNegocioMoeda: string;
  centroLucro: string | null;
  classificacao: string | null;
  tipoConteudo: string | null;
  conteudo: string | null;
};

export type CenaReportRecord = {
  id: string;
  ordem: number;
  capitulo: string;
  numeroCena: string;
  ambiente: string;
  tipoAmbiente: string;
  periodo: string;
  localGravacao: string;
  personagens: string[];
  figurantes: string[];
  tempoAproximado: string;
  ritmo: string;
  descricao: string;
};

export type RecursoReportRecord = {
  id: string;
  tipo: 'humano' | 'fisico' | 'tecnico';
  nome: string;
  funcao?: string;
  horaInicio?: string;
  horaFim?: string;
  estoqueItem?: string;
};

export type ElencoReportRecord = {
  id: string;
  nome: string;
  nomeTrabalho?: string;
  personagem: string;
};

export type ConvidadoReportRecord = {
  id: string;
  nome: string;
  nomeTrabalho?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
};

export type FigurinoReportRecord = {
  id: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tamanhoPeca?: string;
  observacoes?: string;
};

export type TerceiroReportRecord = {
  id: string;
  fornecedorNome: string;
  servicoNome: string;
  custo: number;
};

export type CustoItemRecord = {
  categoria: string;
  recurso: string;
  descricao: string;
  horas: number;
  custoUnitario: number;
  custoTotal: number;
};

export type GravacaoReportRecord = {
  basicInfo: GravacaoBasicInfoRecord;
  cenas: CenaReportRecord[];
  recursos: RecursoReportRecord[];
  elenco: ElencoReportRecord[];
  convidados: ConvidadoReportRecord[];
  figurinos: FigurinoReportRecord[];
  terceiros: TerceiroReportRecord[];
  custos: CustoItemRecord[];
  totais: {
    horasTotais: number;
    custoTotal: number;
    custoTerceiros: number;
  };
};

type BasicInfoRow = {
  id: string;
  tenantId: string;
  codigo: string;
  nome: string;
  dataPrevista: string | null;
  descricao: string | null;
  status: string | null;
  unidadeNegocio: string | null;
  unidadeNegocioLogo: string | null;
  unidadeNegocioMoeda: string | null;
  centroLucro: string | null;
  classificacao: string | null;
  tipoConteudo: string | null;
  conteudo: string | null;
};

type CenaRow = {
  id: string;
  ordem: number;
  capitulo: string | null;
  numeroCena: string | null;
  ambiente: string | null;
  tipoAmbiente: string | null;
  periodo: string | null;
  localGravacao: string | null;
  personagens: unknown;
  figurantes: unknown;
  tempoAproximado: string | null;
  ritmo: string | null;
  descricao: string | null;
};

type ResourceRow = {
  id: string;
  parentRecursoId: string | null;
  recursoTecnicoId: string | null;
  recursoTecnicoNome: string | null;
  recursoTecnicoFuncao: string | null;
  recursoFisicoId: string | null;
  recursoFisicoNome: string | null;
  recursoFisicoCustoHora: Prisma.Decimal | number | string | null;
  recursoHumanoId: string | null;
  recursoHumanoNome: string | null;
  recursoHumanoSobrenome: string | null;
  recursoHumanoCustoHora: Prisma.Decimal | number | string | null;
  horaInicio: string | null;
  horaFim: string | null;
  estoqueItemNome: string | null;
};

type ElencoRow = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  personagem: string | null;
};

type ConvidadoRow = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  telefone: string | null;
  email: string | null;
  observacao: string | null;
};

type FigurinoRow = {
  id: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino: string | null;
  tamanhoPeca: string | null;
  observacao: string | null;
};

type TerceiroRow = {
  id: string;
  fornecedorNome: string | null;
  servicoNome: string | null;
  valor: Prisma.Decimal | number | string | null;
};

function toNullableNumber(value: Prisma.Decimal | number | string | null | undefined): number | null {
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

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  return [];
}

function calculateHours(horaInicio: string | null, horaFim: string | null): number {
  if (!horaInicio || !horaFim) {
    return 0;
  }

  const [inicioHora, inicioMinuto] = horaInicio.split(':').map(Number);
  const [fimHora, fimMinuto] = horaFim.split(':').map(Number);

  if (![inicioHora, inicioMinuto, fimHora, fimMinuto].every(Number.isFinite)) {
    return 0;
  }

  const inicio = inicioHora * 60 + inicioMinuto;
  const fim = fimHora * 60 + fimMinuto;
  const diff = fim - inicio;
  return diff > 0 ? diff / 60 : 0;
}

function buildWhere(conditions: Prisma.Sql[]): Prisma.Sql {
  if (conditions.length === 0) {
    return Prisma.empty;
  }

  let combined = conditions[0];
  for (let index = 1; index < conditions.length; index += 1) {
    combined = Prisma.sql`${combined} AND ${conditions[index]}`;
  }

  return Prisma.sql`WHERE ${combined}`;
}

export interface AnalyticsRepository {
  getDashboardOverview(tenantId: string | null, unidadeIds: string[]): Promise<DashboardOverviewRecord>;
  getGravacaoReport(gravacaoId: string): Promise<GravacaoReportRecord | null>;
}

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  private tableExistsCache = new Map<string, Promise<boolean>>();

  async getDashboardOverview(tenantId: string | null, unidadeIds: string[]): Promise<DashboardOverviewRecord> {
    const gravacaoWhere: Record<string, unknown> = {};
    if (tenantId) {
      gravacaoWhere.tenantId = tenantId;
    }
    if (unidadeIds.length > 0) {
      gravacaoWhere.unidadeNegocioId = { in: unidadeIds };
    }

    const gravacoes = await prisma.gravacao.findMany({
      where: gravacaoWhere,
      select: {
        id: true,
        nome: true,
        codigo: true,
        dataPrevista: true,
        status: true,
      },
      orderBy: [{ dataPrevista: 'asc' }, { createdAt: 'asc' }],
    });

    const gravacoesData: DashboardRecordingRecord[] = gravacoes.map((item) => ({
      id: item.id,
      nome: item.nome,
      codigo: item.codigo,
      dataPrevista: item.dataPrevista ? item.dataPrevista.toISOString().slice(0, 10) : null,
      status: item.status ?? null,
    }));

    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setHours(0, 0, 0, 0);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    const gravacoesAtivas = gravacoesData.filter((item) => {
      if (!item.dataPrevista) {
        return true;
      }

      const dataPrevista = new Date(`${item.dataPrevista}T00:00:00.000Z`);
      return dataPrevista >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);
    });

    const gravacoesSemana = gravacoesData.filter((item) => {
      if (!item.dataPrevista) {
        return false;
      }

      const dataPrevista = new Date(`${item.dataPrevista}T00:00:00.000Z`);
      return dataPrevista >= inicioSemana && dataPrevista <= fimSemana;
    });

    const [conteudos, recursosHumanos, recursosTecnicos, recursosFisicos, unidades, fornecedores] = await Promise.all([
      this.countConteudos(tenantId, unidadeIds),
      this.countByTenantTable('recursos_humanos', tenantId),
      this.countByTenantTable('recursos_tecnicos', tenantId),
      this.countByTenantTable('recursos_fisicos', tenantId),
      this.countByTenantTable('unidades_negocio', tenantId),
      this.countByTenantTable('fornecedores', tenantId),
    ]);

    return {
      stats: {
        gravacoes: gravacoesData.length,
        gravacoesAtivas: gravacoesAtivas.length,
        conteudos,
        recursosHumanos,
        recursosTecnicos,
        recursosFisicos,
        unidades,
        fornecedores,
      },
      gravacoesSemana,
      gravacoes: gravacoesData,
    };
  }

  async getGravacaoReport(gravacaoId: string): Promise<GravacaoReportRecord | null> {
    const basicInfo = await this.loadBasicInfo(gravacaoId);
    if (!basicInfo) {
      return null;
    }

    const [cenas, recursosPayload, elenco, convidados, figurinos, terceiros] = await Promise.all([
      this.loadCenas(basicInfo.tenantId, gravacaoId),
      this.loadRecursosAndCustos(basicInfo.tenantId, gravacaoId),
      this.loadElenco(basicInfo.tenantId, gravacaoId),
      this.loadConvidados(basicInfo.tenantId, gravacaoId),
      this.loadFigurinos(basicInfo.tenantId, gravacaoId),
      this.loadTerceiros(basicInfo.tenantId, gravacaoId),
    ]);

    const custos = [...recursosPayload.custos, ...terceiros.custos];
    const horasTotais = custos.reduce((total, item) => total + item.horas, 0);
    const custoTotal = custos.reduce((total, item) => total + item.custoTotal, 0);
    const custoTerceiros = terceiros.items.reduce((total, item) => total + item.custo, 0);

    return {
      basicInfo,
      cenas,
      recursos: recursosPayload.recursos,
      elenco,
      convidados,
      figurinos,
      terceiros: terceiros.items,
      custos,
      totais: {
        horasTotais,
        custoTotal,
        custoTerceiros,
      },
    };
  }

  private async loadBasicInfo(gravacaoId: string): Promise<GravacaoBasicInfoRecord | null> {
    const gravacao = await prisma.gravacao.findUnique({
      where: { id: gravacaoId },
      include: {
        unidadeNegocio: {
          select: {
            nome: true,
            imagemUrl: true,
            moeda: true,
          },
        },
      },
    });

    if (!gravacao) {
      return null;
    }

    let conteudo: string | null = null;
    if (gravacao.conteudoId && (await this.tableExists('conteudos'))) {
      const conteudoRows = await prisma.$queryRaw<Array<{ descricao: string | null }>>(Prisma.sql`
        SELECT descricao
        FROM conteudos
        WHERE id::text = ${gravacao.conteudoId}
        LIMIT 1
      `);
      conteudo = conteudoRows[0]?.descricao ?? null;
    }

    return {
      id: gravacao.id,
      tenantId: gravacao.tenantId,
      codigo: gravacao.codigo,
      nome: gravacao.nome,
      dataPrevista: gravacao.dataPrevista ? gravacao.dataPrevista.toISOString().slice(0, 10) : null,
      descricao: gravacao.descricao,
      status: gravacao.status,
      unidadeNegocio: gravacao.unidadeNegocio?.nome ?? null,
      unidadeNegocioLogo: gravacao.unidadeNegocio?.imagemUrl ?? null,
      unidadeNegocioMoeda: gravacao.unidadeNegocio?.moeda ?? 'BRL',
      centroLucro: gravacao.centroLucro,
      classificacao: gravacao.classificacao,
      tipoConteudo: gravacao.tipoConteudo,
      conteudo,
    };
  }

  private async loadCenas(tenantId: string, gravacaoId: string): Promise<CenaReportRecord[]> {
    if (!(await this.tableExists('gravacao_cenas'))) {
      return [];
    }

    const rows = await prisma.$queryRaw<CenaRow[]>(Prisma.sql`
      SELECT
        id,
        ordem,
        capitulo,
        numero_cena AS "numeroCena",
        ambiente,
        tipo_ambiente AS "tipoAmbiente",
        periodo,
        local_gravacao AS "localGravacao",
        personagens,
        figurantes,
        tempo_aproximado AS "tempoAproximado",
        ritmo,
        descricao
      FROM gravacao_cenas
      WHERE tenant_id::text = ${tenantId}
        AND gravacao_id::text = ${gravacaoId}
      ORDER BY ordem ASC, created_at ASC
    `);

    return rows.map((item) => ({
      id: item.id,
      ordem: Number(item.ordem),
      capitulo: item.capitulo || '',
      numeroCena: item.numeroCena || '',
      ambiente: item.ambiente || '',
      tipoAmbiente: item.tipoAmbiente || '',
      periodo: item.periodo || '',
      localGravacao: item.localGravacao || '',
      personagens: parseStringArray(item.personagens),
      figurantes: parseStringArray(item.figurantes),
      tempoAproximado: item.tempoAproximado || '',
      ritmo: item.ritmo || '',
      descricao: item.descricao || '',
    }));
  }

  private async loadRecursosAndCustos(tenantId: string, gravacaoId: string): Promise<{
    recursos: RecursoReportRecord[];
    custos: CustoItemRecord[];
  }> {
    if (!(await this.tableExists('gravacao_recursos'))) {
      return { recursos: [], custos: [] };
    }

    const rows = await prisma.$queryRaw<ResourceRow[]>(Prisma.sql`
      SELECT
        gr.id,
        gr.parent_recurso_id AS "parentRecursoId",
        gr.recurso_tecnico_id AS "recursoTecnicoId",
        rt.nome AS "recursoTecnicoNome",
        fop.nome AS "recursoTecnicoFuncao",
        gr.recurso_fisico_id AS "recursoFisicoId",
        rf.nome AS "recursoFisicoNome",
        rf.custo_hora AS "recursoFisicoCustoHora",
        gr.recurso_humano_id AS "recursoHumanoId",
        rh.nome AS "recursoHumanoNome",
        rh.sobrenome AS "recursoHumanoSobrenome",
        rh.custo_hora AS "recursoHumanoCustoHora",
        gr.hora_inicio AS "horaInicio",
        gr.hora_fim AS "horaFim",
        ei.nome AS "estoqueItemNome"
      FROM gravacao_recursos gr
      LEFT JOIN recursos_tecnicos rt ON rt.id = gr.recurso_tecnico_id
      LEFT JOIN funcoes fop ON fop.id = rt.funcao_operador_id
      LEFT JOIN recursos_fisicos rf ON rf.id = gr.recurso_fisico_id
      LEFT JOIN recursos_humanos rh ON rh.id = gr.recurso_humano_id
      LEFT JOIN rf_estoque_itens ei ON ei.id = gr.estoque_item_id
      WHERE gr.tenant_id::text = ${tenantId}
        AND gr.gravacao_id::text = ${gravacaoId}
      ORDER BY gr.created_at ASC, gr.id ASC
    `);

    const recursos: RecursoReportRecord[] = [];
    const custos: CustoItemRecord[] = [];
    const tecnicosAdicionados = new Set<string>();
    const humanosProcessados = new Set<string>();

    for (const row of rows) {
      const horas = calculateHours(row.horaInicio, row.horaFim);

      if (row.recursoTecnicoId && row.recursoHumanoId && row.recursoTecnicoNome && row.recursoHumanoNome) {
        if (!tecnicosAdicionados.has(row.recursoTecnicoId)) {
          recursos.push({
            id: row.id,
            tipo: 'tecnico',
            nome: row.recursoTecnicoNome,
            funcao: row.recursoTecnicoFuncao || undefined,
            horaInicio: row.horaInicio || undefined,
            horaFim: row.horaFim || undefined,
            estoqueItem: row.estoqueItemNome || undefined,
          });
          tecnicosAdicionados.add(row.recursoTecnicoId);
        }

        if (horas > 0 && !humanosProcessados.has(row.recursoHumanoId)) {
          const nome = `${row.recursoHumanoNome} ${row.recursoHumanoSobrenome || ''}`.trim();
          const custoUnitario = toNullableNumber(row.recursoHumanoCustoHora) ?? 0;
          custos.push({
            categoria: 'Recursos Humanos',
            recurso: nome,
            descricao: `${horas.toFixed(1)}h operando ${row.recursoTecnicoNome}`,
            horas,
            custoUnitario,
            custoTotal: horas * custoUnitario,
          });
          humanosProcessados.add(row.recursoHumanoId);
        }
        continue;
      }

      if (row.recursoTecnicoId && row.recursoTecnicoNome) {
        if (!tecnicosAdicionados.has(row.recursoTecnicoId)) {
          recursos.push({
            id: row.id,
            tipo: 'tecnico',
            nome: row.recursoTecnicoNome,
            funcao: row.recursoTecnicoFuncao || undefined,
            horaInicio: row.horaInicio || undefined,
            horaFim: row.horaFim || undefined,
            estoqueItem: row.estoqueItemNome || undefined,
          });
          tecnicosAdicionados.add(row.recursoTecnicoId);
        }
        continue;
      }

      if (row.recursoHumanoId && row.recursoHumanoNome) {
        const nome = `${row.recursoHumanoNome} ${row.recursoHumanoSobrenome || ''}`.trim();
        recursos.push({
          id: row.id,
          tipo: 'humano',
          nome,
          horaInicio: row.horaInicio || undefined,
          horaFim: row.horaFim || undefined,
        });

        if (horas > 0 && !humanosProcessados.has(row.recursoHumanoId)) {
          const custoUnitario = toNullableNumber(row.recursoHumanoCustoHora) ?? 0;
          custos.push({
            categoria: 'Recursos Humanos',
            recurso: nome,
            descricao: `${horas.toFixed(1)}h de trabalho`,
            horas,
            custoUnitario,
            custoTotal: horas * custoUnitario,
          });
          humanosProcessados.add(row.recursoHumanoId);
        }
        continue;
      }

      if (row.recursoFisicoId && row.recursoFisicoNome) {
        recursos.push({
          id: row.id,
          tipo: 'fisico',
          nome: row.recursoFisicoNome,
          horaInicio: row.horaInicio || undefined,
          horaFim: row.horaFim || undefined,
          estoqueItem: row.estoqueItemNome || undefined,
        });

        if (horas > 0) {
          const custoUnitario = toNullableNumber(row.recursoFisicoCustoHora) ?? 0;
          custos.push({
            categoria: 'Recursos Físicos',
            recurso: row.recursoFisicoNome,
            descricao: `${horas.toFixed(1)}h de ocupação`,
            horas,
            custoUnitario,
            custoTotal: horas * custoUnitario,
          });
        }
      }
    }

    return { recursos, custos };
  }

  private async loadElenco(tenantId: string, gravacaoId: string): Promise<ElencoReportRecord[]> {
    if (!(await this.tableExists('gravacao_elenco'))) {
      return [];
    }

    const rows = await prisma.$queryRaw<ElencoRow[]>(Prisma.sql`
      SELECT
        ge.id,
        p.nome,
        p.sobrenome,
        p.nome_trabalho AS "nomeTrabalho",
        ge.personagem
      FROM gravacao_elenco ge
      INNER JOIN pessoas p ON p.id = ge.pessoa_id
      WHERE ge.tenant_id::text = ${tenantId}
        AND ge.gravacao_id::text = ${gravacaoId}
      ORDER BY p.nome ASC, p.sobrenome ASC
    `);

    return rows.map((item) => ({
      id: item.id,
      nome: `${item.nome} ${item.sobrenome}`.trim(),
      nomeTrabalho: item.nomeTrabalho || undefined,
      personagem: item.personagem || '',
    }));
  }

  private async loadConvidados(tenantId: string, gravacaoId: string): Promise<ConvidadoReportRecord[]> {
    if (!(await this.tableExists('gravacao_convidados'))) {
      return [];
    }

    const rows = await prisma.$queryRaw<ConvidadoRow[]>(Prisma.sql`
      SELECT
        gc.id,
        p.nome,
        p.sobrenome,
        p.nome_trabalho AS "nomeTrabalho",
        p.telefone,
        p.email,
        gc.observacao
      FROM gravacao_convidados gc
      INNER JOIN pessoas p ON p.id = gc.pessoa_id
      WHERE gc.tenant_id::text = ${tenantId}
        AND gc.gravacao_id::text = ${gravacaoId}
      ORDER BY p.nome ASC, p.sobrenome ASC
    `);

    return rows.map((item) => ({
      id: item.id,
      nome: `${item.nome} ${item.sobrenome}`.trim(),
      nomeTrabalho: item.nomeTrabalho || undefined,
      telefone: item.telefone || undefined,
      email: item.email || undefined,
      observacoes: item.observacao || undefined,
    }));
  }

  private async loadFigurinos(tenantId: string, gravacaoId: string): Promise<FigurinoReportRecord[]> {
    if (!(await this.tableExists('gravacao_figurinos'))) {
      return [];
    }

    const rows = await prisma.$queryRaw<FigurinoRow[]>(Prisma.sql`
      SELECT
        gf.id,
        f.codigo_figurino AS "codigoFigurino",
        f.descricao,
        tf.nome AS "tipoFigurino",
        f.tamanho_peca AS "tamanhoPeca",
        gf.observacao
      FROM gravacao_figurinos gf
      INNER JOIN figurinos f ON f.id = gf.figurino_id
      LEFT JOIN tipos_figurino tf ON tf.id = f.tipo_figurino_id
      WHERE gf.tenant_id::text = ${tenantId}
        AND gf.gravacao_id::text = ${gravacaoId}
      ORDER BY f.codigo_figurino ASC
    `);

    return rows.map((item) => ({
      id: item.id,
      codigoFigurino: item.codigoFigurino,
      descricao: item.descricao,
      tipoFigurino: item.tipoFigurino || undefined,
      tamanhoPeca: item.tamanhoPeca || undefined,
      observacoes: item.observacao || undefined,
    }));
  }

  private async loadTerceiros(tenantId: string, gravacaoId: string): Promise<{
    items: TerceiroReportRecord[];
    custos: CustoItemRecord[];
  }> {
    if (!(await this.tableExists('gravacao_terceiros'))) {
      return { items: [], custos: [] };
    }

    const rows = await prisma.$queryRaw<TerceiroRow[]>(Prisma.sql`
      SELECT
        gt.id,
        f.nome AS "fornecedorNome",
        fs.nome AS "servicoNome",
        gt.valor
      FROM gravacao_terceiros gt
      INNER JOIN fornecedores f ON f.id = gt.fornecedor_id
      LEFT JOIN fornecedor_servicos fs ON fs.id = gt.servico_id
      WHERE gt.tenant_id::text = ${tenantId}
        AND gt.gravacao_id::text = ${gravacaoId}
      ORDER BY f.nome ASC
    `);

    const items: TerceiroReportRecord[] = [];
    const custos: CustoItemRecord[] = [];

    for (const row of rows) {
      const custo = toNullableNumber(row.valor) ?? 0;
      items.push({
        id: row.id,
        fornecedorNome: row.fornecedorNome || '',
        servicoNome: row.servicoNome || '',
        custo,
      });
      custos.push({
        categoria: 'Terceiros',
        recurso: row.fornecedorNome || 'Fornecedor',
        descricao: row.servicoNome || 'Serviço',
        horas: 0,
        custoUnitario: custo,
        custoTotal: custo,
      });
    }

    return { items, custos };
  }

  private async countConteudos(tenantId: string | null, unidadeIds: string[]): Promise<number> {
    if (!(await this.tableExists('conteudos'))) {
      return 0;
    }

    const conditions: Prisma.Sql[] = [];
    if (tenantId) {
      conditions.push(Prisma.sql`tenant_id::text = ${tenantId}`);
    }
    if (unidadeIds.length > 0) {
      conditions.push(
        Prisma.sql`unidade_negocio_id::text IN (${Prisma.join(unidadeIds.map((id) => Prisma.sql`${id}`))})`,
      );
    }

    const rows = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM conteudos
      ${buildWhere(conditions)}
    `);

    return Number(rows[0]?.total ?? 0);
  }

  private async countByTenantTable(tableName: string, tenantId: string | null): Promise<number> {
    if (!(await this.tableExists(tableName))) {
      return 0;
    }

    const where = tenantId ? Prisma.sql`WHERE tenant_id::text = ${tenantId}` : Prisma.empty;
    const rows = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM ${Prisma.raw(tableName)}
      ${where}
    `);

    return Number(rows[0]?.total ?? 0);
  }

  private async tableExists(tableName: string): Promise<boolean> {
    let promise = this.tableExistsCache.get(tableName);

    if (!promise) {
      promise = prisma
        .$queryRaw<Array<{ exists: boolean }>>(Prisma.sql`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ${tableName}
          ) AS exists
        `)
        .then((rows) => rows[0]?.exists ?? false);
      this.tableExistsCache.set(tableName, promise);
    }

    return promise;
  }
}
