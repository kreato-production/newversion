import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type GravacaoRecord = {
  id: string;
  tenantId: string;
  codigo: string;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  unidadeNegocioId: string | null;
  unidadeNegocioNome: string | null;
  centroLucro: string | null;
  classificacao: string | null;
  tipoConteudo: string | null;
  status: string | null;
  dataPrevista: Date | null;
  conteudoId: string | null;
  orcamento: number;
  programaId: string | null;
  programaNome: string | null;
  createdAt: Date;
};

export type SaveGravacaoInput = {
  id?: string;
  tenantId: string;
  codigo: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
  unidadeNegocioId?: string | null;
  centroLucro?: string | null;
  classificacao?: string | null;
  tipoConteudo?: string | null;
  status?: string | null;
  dataPrevista?: Date | null;
  conteudoId?: string | null;
  orcamento?: number;
  programaId?: string | null;
  createdById?: string | null;
};

export type GravacaoFigurinoImageRecord = {
  url: string;
  isPrincipal: boolean;
};

export type GravacaoFigurinoOptionRecord = {
  id: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino: string | null;
  tamanhoPeca: string | null;
  imagens: GravacaoFigurinoImageRecord[];
};

export type GravacaoFigurinoRecord = {
  id: string;
  tenantId: string;
  gravacaoId: string;
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino: string | null;
  tamanhoPeca: string | null;
  imagemPrincipal: string | null;
  observacao: string | null;
  pessoaId: string | null;
};

export type SaveGravacaoFigurinoInput = {
  tenantId: string;
  gravacaoId: string;
  figurinoId: string;
  observacao?: string | null;
  pessoaId?: string | null;
};

export type UpdateGravacaoFigurinoInput = {
  id: string;
  observacao?: string | null;
  pessoaId?: string | null;
};

export type GravacaoTerceiroFornecedorOptionRecord = {
  id: string;
  nome: string;
  categoria: string | null;
};

export type GravacaoTerceiroServicoOptionRecord = {
  id: string;
  fornecedorId: string;
  nome: string;
  descricao: string | null;
  valor: number | null;
};

export type GravacaoTerceiroRecord = {
  id: string;
  tenantId: string;
  gravacaoId: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoId: string | null;
  servicoNome: string | null;
  valor: number | null;
  observacao: string | null;
};

export type GravacaoConvidadoPessoaOptionRecord = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  foto: string | null;
  telefone: string | null;
  email: string | null;
  status: string | null;
};

export type GravacaoConvidadoRecord = {
  id: string;
  tenantId: string;
  gravacaoId: string;
  pessoaId: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  foto: string | null;
  telefone: string | null;
  email: string | null;
  observacao: string | null;
};

export type SaveGravacaoConvidadoInput = {
  tenantId: string;
  gravacaoId: string;
  pessoaId: string;
  observacao?: string | null;
};

export type SaveGravacaoTerceiroInput = {
  tenantId: string;
  gravacaoId: string;
  fornecedorId: string;
  servicoId?: string | null;
  valor?: number | null;
  observacao?: string | null;
};

export type GravacaoEspacoRecord = {
  id: string;
  tenantId: string;
  gravacaoId: string;
  espacoId: string | null;
  espacoNome: string;
  descricao: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  data: string | null;
};

export type SaveGravacaoEspacoInput = {
  tenantId: string;
  gravacaoId: string;
  espacoId: string;
  descricao?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  data?: string | null;
  createdBy?: string | null;
};

export type UpdateGravacaoEspacoInput = {
  id: string;
  espacoId: string;
  descricao?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  data?: string | null;
};

export type GravacaoEspacoResourceType = 'fisico' | 'tecnico';

export type GravacaoEspacoResourceRecord = {
  id: string;
  tenantId: string;
  gravacaoEspacoId: string;
  recursoId: string;
  recursoNome: string;
  valorHora: number;
  quantidade: number;
  horaInicio: string | null;
  horaFim: string | null;
  data: string | null;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
};

export type GravacaoEspacoAvailableResourceRecord = {
  recursoId: string;
  recursoNome: string;
  valorHora: number;
};

export type SaveGravacaoEspacoResourceInput = {
  tenantId: string;
  gravacaoEspacoId: string;
  tipo: GravacaoEspacoResourceType;
  recursoId: string;
  valorHora: number;
  quantidade: number;
  horaInicio?: string | null;
  horaFim?: string | null;
  data?: string | null;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
};

export type UpdateGravacaoEspacoResourceInput = {
  id: string;
  quantidade: number;
  horaInicio?: string | null;
  horaFim?: string | null;
  data?: string | null;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
};

export type GravacaoRelationRecord = {
  id: string;
  tenantId: string;
  gravacaoId: string;
};

export type GravacaoDespesaRecord = {
  id: string;
  tenantId: string;
  gravacaoId: string;
  titulo: string;
  numeroDocumento: string | null;
  descricao: string | null;
  status: string | null;
  tipoDocumento: string | null;
  categoria: string | null;
  dataVencimento: string | null;
  valor: number | null;
  fornecedorId: string | null;
  fornecedorNome: string | null;
  formaPagamento: string | null;
  createdAt: Date;
};

export type SaveGravacaoDespesaInput = {
  tenantId: string;
  gravacaoId: string;
  titulo: string;
  numeroDocumento?: string | null;
  descricao?: string | null;
  status?: string | null;
  tipoDocumento?: string | null;
  categoria?: string | null;
  dataVencimento?: string | null;
  valor?: number | null;
  fornecedorId?: string | null;
  formaPagamento?: string | null;
};

export type UpdateGravacaoDespesaInput = {
  id: string;
  titulo: string;
  numeroDocumento?: string | null;
  descricao?: string | null;
  status?: string | null;
  tipoDocumento?: string | null;
  categoria?: string | null;
  dataVencimento?: string | null;
  valor?: number | null;
  fornecedorId?: string | null;
  formaPagamento?: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type GravacaoBase = {
  id: string;
  tenantId: string;
  codigo: string;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  unidadeNegocioId: string | null;
  centroLucro: string | null;
  classificacao: string | null;
  tipoConteudo: string | null;
  status: string | null;
  dataPrevista: Date | null;
  conteudoId: string | null;
  orcamento: { toNumber(): number };
  programaId: string | null;
  createdAt: Date;
  unidadeNegocio?: { nome: string } | null;
  programa?: { nome: string } | null;
};

type BaseFigurinoRow = {
  id: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurinoId: string | null;
  tamanhoPeca: string | null;
};

type FigurinoImagemRow = {
  figurinoId: string;
  url: string;
  isPrincipal: boolean | null;
};

type GravacaoFigurinoRow = {
  id: string;
  tenantId: string;
  gravacaoId: string;
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurinoId: string | null;
  tamanhoPeca: string | null;
  observacao: string | null;
  pessoaId: string | null;
};

type GravacaoTerceiroRow = {
  id: string;
  tenantId: string;
  gravacaoId: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoId: string | null;
  servicoNome: string | null;
  valor: Prisma.Decimal | number | string | null;
  observacao: string | null;
};

function mapGravacao(item: GravacaoBase): GravacaoRecord {
  return {
    id: item.id,
    tenantId: item.tenantId,
    codigo: item.codigo,
    codigoExterno: item.codigoExterno,
    nome: item.nome,
    descricao: item.descricao,
    unidadeNegocioId: item.unidadeNegocioId,
    unidadeNegocioNome: item.unidadeNegocio?.nome ?? null,
    centroLucro: item.centroLucro,
    classificacao: item.classificacao,
    tipoConteudo: item.tipoConteudo,
    status: item.status,
    dataPrevista: item.dataPrevista,
    conteudoId: item.conteudoId,
    orcamento: item.orcamento.toNumber(),
    programaId: item.programaId,
    programaNome: item.programa?.nome ?? null,
    createdAt: item.createdAt,
  };
}

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

export interface GravacoesRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<GravacaoRecord>>;
  findById(id: string): Promise<GravacaoRecord | null>;
  save(input: SaveGravacaoInput): Promise<GravacaoRecord>;
  remove(id: string): Promise<void>;
  listFigurinos(tenantId: string, gravacaoId: string): Promise<{
    figurinos: GravacaoFigurinoOptionRecord[];
    items: GravacaoFigurinoRecord[];
  }>;
  addFigurino(input: SaveGravacaoFigurinoInput): Promise<GravacaoFigurinoRecord>;
  updateFigurino(input: UpdateGravacaoFigurinoInput): Promise<GravacaoFigurinoRecord | null>;
  findFigurinoAllocationById(id: string): Promise<GravacaoRelationRecord | null>;
  removeFigurino(id: string): Promise<void>;
  listTerceiros(tenantId: string, gravacaoId: string): Promise<{
    items: GravacaoTerceiroRecord[];
    fornecedores: GravacaoTerceiroFornecedorOptionRecord[];
    servicos: GravacaoTerceiroServicoOptionRecord[];
    moeda: string;
  }>;
  addTerceiro(input: SaveGravacaoTerceiroInput): Promise<GravacaoTerceiroRecord>;
  findTerceiroById(id: string): Promise<GravacaoRelationRecord | null>;
  removeTerceiro(id: string): Promise<void>;
  listConvidados(tenantId: string, gravacaoId: string): Promise<{
    pessoas: GravacaoConvidadoPessoaOptionRecord[];
    items: GravacaoConvidadoRecord[];
  }>;
  addConvidado(input: SaveGravacaoConvidadoInput): Promise<GravacaoConvidadoRecord>;
  findConvidadoById(id: string): Promise<GravacaoRelationRecord | null>;
  removeConvidado(id: string): Promise<void>;
  listEspacos(tenantId: string, gravacaoId: string): Promise<GravacaoEspacoRecord[]>;
  findEspacoById(id: string): Promise<GravacaoEspacoRecord | null>;
  addEspaco(input: SaveGravacaoEspacoInput): Promise<GravacaoEspacoRecord>;
  updateEspaco(input: UpdateGravacaoEspacoInput): Promise<GravacaoEspacoRecord | null>;
  removeEspaco(id: string): Promise<void>;
  listEspacoResources(
    tenantId: string,
    gravacaoEspacoId: string,
    tipo: GravacaoEspacoResourceType,
  ): Promise<{ items: GravacaoEspacoResourceRecord[]; availableResources: GravacaoEspacoAvailableResourceRecord[] }>;
  addEspacoResource(input: SaveGravacaoEspacoResourceInput): Promise<GravacaoEspacoResourceRecord>;
  updateEspacoResource(input: UpdateGravacaoEspacoResourceInput, tipo: GravacaoEspacoResourceType): Promise<GravacaoEspacoResourceRecord | null>;
  removeEspacoResource(id: string, tipo: GravacaoEspacoResourceType): Promise<void>;
  listStatusCores(tenantId: string): Promise<Array<{ nome: string; cor: string | null }>>;
  getCustos(tenantId: string, gravacaoId: string): Promise<GravacaoCustosResult>;
  listEspacoRecursosSummary(tenantId: string, gravacaoId: string): Promise<EspacoRecursosSummaryResult>;
  listDespesas(tenantId: string, gravacaoId: string): Promise<GravacaoDespesaRecord[]>;
  addDespesa(input: SaveGravacaoDespesaInput): Promise<GravacaoDespesaRecord>;
  updateDespesa(input: UpdateGravacaoDespesaInput): Promise<GravacaoDespesaRecord | null>;
  findDespesaById(id: string): Promise<GravacaoRelationRecord | null>;
  removeDespesa(id: string): Promise<void>;
}

export type EspacoRecursoSummaryItem = {
  tipo: 'tecnico' | 'fisico';
  recursoNome: string;
  espacoNome: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  quantidade: number;
  horas: number;
};

export type EspacoRecursosSummaryResult = {
  dataPrevista: string | null;
  items: EspacoRecursoSummaryItem[];
};

export type GravacaoCustoItem = {
  categoria: string;
  recurso: string;
  descricao: string;
  horas: number;
  custoUnitario: number;
  custoTotal: number;
};

export type GravacaoCustosResult = {
  moeda: string;
  itens: GravacaoCustoItem[];
};

function buildGravacaoEspacoResourceTableNames(tipo: GravacaoEspacoResourceType) {
  if (tipo === 'tecnico') {
    return {
      itemTable: Prisma.raw('gravacao_espaco_recursos_tecnicos'),
      idCol: Prisma.raw('recurso_tecnico_id'),
      resourceTable: Prisma.raw('recursos_tecnicos'),
      valorHoraExpr: '0',
    };
  }
  return {
    itemTable: Prisma.raw('gravacao_espaco_recursos_fisicos'),
    idCol: Prisma.raw('recurso_fisico_id'),
    resourceTable: Prisma.raw('recursos_fisicos'),
    valorHoraExpr: 'coalesce(custo_hora, 0)',
  };
}

export class PrismaGravacoesRepository implements GravacoesRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<GravacaoRecord>> {
    const take = Math.min(opts?.limit ?? 50, 200);
    const skip = opts?.offset ?? 0;
    const where = { tenantId };

    const [total, data] = await prisma.$transaction([
      prisma.gravacao.count({ where }),
      prisma.gravacao.findMany({
        where,
        include: {
          unidadeNegocio: { select: { nome: true } },
          programa: { select: { nome: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ]);

    return { data: data.map(mapGravacao), total };
  }

  async findById(id: string): Promise<GravacaoRecord | null> {
    const item = await prisma.gravacao.findUnique({
      where: { id },
      include: {
        unidadeNegocio: { select: { nome: true } },
        programa: { select: { nome: true } },
      },
    });

    return item ? mapGravacao(item) : null;
  }

  async save(input: SaveGravacaoInput): Promise<GravacaoRecord> {
    const item = input.id
      ? await prisma.gravacao.upsert({
          where: { id: input.id },
          update: {
            codigo: input.codigo,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            unidadeNegocioId: input.unidadeNegocioId ?? null,
            centroLucro: input.centroLucro ?? null,
            classificacao: input.classificacao ?? null,
            tipoConteudo: input.tipoConteudo ?? null,
            status: input.status ?? null,
            dataPrevista: input.dataPrevista ?? null,
            conteudoId: input.conteudoId ?? null,
            orcamento: input.orcamento ?? 0,
            programaId: input.programaId ?? null,
            createdById: input.createdById ?? null,
          },
          create: {
            id: input.id,
            tenantId: input.tenantId,
            codigo: input.codigo,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            unidadeNegocioId: input.unidadeNegocioId ?? null,
            centroLucro: input.centroLucro ?? null,
            classificacao: input.classificacao ?? null,
            tipoConteudo: input.tipoConteudo ?? null,
            status: input.status ?? null,
            dataPrevista: input.dataPrevista ?? null,
            conteudoId: input.conteudoId ?? null,
            orcamento: input.orcamento ?? 0,
            programaId: input.programaId ?? null,
            createdById: input.createdById ?? null,
          },
          include: {
            unidadeNegocio: { select: { nome: true } },
            programa: { select: { nome: true } },
          },
        })
      : await prisma.gravacao.create({
          data: {
            tenantId: input.tenantId,
            codigo: input.codigo,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            unidadeNegocioId: input.unidadeNegocioId ?? null,
            centroLucro: input.centroLucro ?? null,
            classificacao: input.classificacao ?? null,
            tipoConteudo: input.tipoConteudo ?? null,
            status: input.status ?? null,
            dataPrevista: input.dataPrevista ?? null,
            conteudoId: input.conteudoId ?? null,
            orcamento: input.orcamento ?? 0,
            programaId: input.programaId ?? null,
            createdById: input.createdById ?? null,
          },
          include: {
            unidadeNegocio: { select: { nome: true } },
            programa: { select: { nome: true } },
          },
        });

    return mapGravacao(item);
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM gravacao_figurinos WHERE gravacao_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM gravacao_terceiros WHERE gravacao_id = ${id}`;
    await prisma.gravacao.delete({ where: { id } });
  }

  async listFigurinos(tenantId: string, gravacaoId: string) {
    await this.ensureTables();

    const figurinoRows = await prisma.$queryRaw<BaseFigurinoRow[]>(Prisma.sql`
      SELECT
        id,
        codigo_figurino AS "codigoFigurino",
        descricao,
        tipo_figurino_id AS "tipoFigurinoId",
        tamanho_peca AS "tamanhoPeca"
      FROM figurinos
      WHERE tenant_id = ${tenantId}
      ORDER BY codigo_figurino ASC
    `);

    const allocatedRows = await prisma.$queryRaw<GravacaoFigurinoRow[]>(Prisma.sql`
      SELECT
        gf.id,
        gf.tenant_id AS "tenantId",
        gf.gravacao_id AS "gravacaoId",
        gf.figurino_id AS "figurinoId",
        f.codigo_figurino AS "codigoFigurino",
        f.descricao,
        f.tipo_figurino_id AS "tipoFigurinoId",
        f.tamanho_peca AS "tamanhoPeca",
        gf.observacao,
        gf.pessoa_id AS "pessoaId"
      FROM gravacao_figurinos gf
      INNER JOIN figurinos f ON f.id = gf.figurino_id
      WHERE gf.tenant_id = ${tenantId}
        AND gf.gravacao_id = ${gravacaoId}
      ORDER BY f.codigo_figurino ASC
    `);

    const figurinoIds = Array.from(new Set([...figurinoRows.map((row) => row.id), ...allocatedRows.map((row) => row.figurinoId)]));
    const tipoIds = Array.from(
      new Set(
        [...figurinoRows.map((row) => row.tipoFigurinoId), ...allocatedRows.map((row) => row.tipoFigurinoId)].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    );

    const [imagensByFigurino, tiposById] = await Promise.all([
      this.loadFigurinoImages(figurinoIds),
      this.loadTipoFigurinoNames(tipoIds),
    ]);

    return {
      figurinos: figurinoRows.map((row) => ({
        id: row.id,
        codigoFigurino: row.codigoFigurino,
        descricao: row.descricao,
        tipoFigurino: row.tipoFigurinoId ? (tiposById.get(row.tipoFigurinoId) ?? null) : null,
        tamanhoPeca: row.tamanhoPeca,
        imagens: imagensByFigurino.get(row.id) ?? [],
      })),
      items: allocatedRows.map((row) => {
        const imagens = imagensByFigurino.get(row.figurinoId) ?? [];
        const principal = imagens.find((imagem) => imagem.isPrincipal) ?? imagens[0];

        return {
          id: row.id,
          tenantId: row.tenantId,
          gravacaoId: row.gravacaoId,
          figurinoId: row.figurinoId,
          codigoFigurino: row.codigoFigurino,
          descricao: row.descricao,
          tipoFigurino: row.tipoFigurinoId ? (tiposById.get(row.tipoFigurinoId) ?? null) : null,
          tamanhoPeca: row.tamanhoPeca,
          imagemPrincipal: principal?.url ?? null,
          observacao: row.observacao,
          pessoaId: row.pessoaId,
        };
      }),
    };
  }

  async addFigurino(input: SaveGravacaoFigurinoInput): Promise<GravacaoFigurinoRecord> {
    await this.ensureTables();

    const figurino = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM figurinos
      WHERE id = ${input.figurinoId}
        AND tenant_id = ${input.tenantId}
      LIMIT 1
    `);

    if (!figurino[0]) {
      throw new Error('Figurino nao encontrado');
    }

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO gravacao_figurinos (
        id,
        tenant_id,
        gravacao_id,
        figurino_id,
        observacao,
        pessoa_id,
        created_at
      ) VALUES (
        ${randomUUID()},
        ${input.tenantId},
        ${input.gravacaoId},
        ${input.figurinoId},
        ${input.observacao ?? null},
        ${input.pessoaId ?? null},
        NOW()
      )
      ON CONFLICT (gravacao_id, figurino_id)
      DO UPDATE SET
        observacao = EXCLUDED.observacao,
        pessoa_id = EXCLUDED.pessoa_id
      RETURNING id
    `);

    const saved = await this.findCompleteFigurinoAllocationById(rows[0].id);
    if (!saved) {
      throw new Error('Figurino da gravacao nao encontrado apos salvar');
    }

    return saved;
  }

  async updateFigurino(input: UpdateGravacaoFigurinoInput): Promise<GravacaoFigurinoRecord | null> {
    await this.ensureTables();

    await prisma.$executeRaw`
      UPDATE gravacao_figurinos
      SET
        observacao = ${input.observacao ?? null},
        pessoa_id = ${input.pessoaId ?? null}
      WHERE id = ${input.id}
    `;

    return this.findCompleteFigurinoAllocationById(input.id);
  }

  async findFigurinoAllocationById(id: string): Promise<GravacaoRelationRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<GravacaoRelationRecord[]>(Prisma.sql`
      SELECT
        id,
        tenant_id AS "tenantId",
        gravacao_id AS "gravacaoId"
      FROM gravacao_figurinos
      WHERE id = ${id}
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async removeFigurino(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM gravacao_figurinos WHERE id = ${id}`;
  }

  async listTerceiros(tenantId: string, gravacaoId: string) {
    await this.ensureTables();

    const gravacao = await prisma.gravacao.findUnique({
      where: { id: gravacaoId },
      select: {
        unidadeNegocio: {
          select: {
            moeda: true,
          },
        },
      },
    });

    const [items, fornecedores, servicos] = await Promise.all([
      prisma.$queryRaw<GravacaoTerceiroRow[]>(Prisma.sql`
        SELECT
          gt.id,
          gt.tenant_id AS "tenantId",
          gt.gravacao_id AS "gravacaoId",
          gt.fornecedor_id AS "fornecedorId",
          f.nome AS "fornecedorNome",
          gt.servico_id AS "servicoId",
          fs.nome AS "servicoNome",
          gt.valor,
          gt.observacao
        FROM gravacao_terceiros gt
        INNER JOIN fornecedores f ON f.id = gt.fornecedor_id
        LEFT JOIN fornecedor_servicos fs ON fs.id = gt.servico_id
        WHERE gt.tenant_id = ${tenantId}
          AND gt.gravacao_id = ${gravacaoId}
        ORDER BY f.nome ASC, fs.nome ASC NULLS LAST
      `),
      prisma.$queryRaw<GravacaoTerceiroFornecedorOptionRecord[]>(Prisma.sql`
        SELECT
          id,
          nome,
          categoria_id AS categoria
        FROM fornecedores
        WHERE tenant_id = ${tenantId}
        ORDER BY nome ASC
      `),
      prisma.$queryRaw<Array<{
        id: string;
        fornecedorId: string;
        nome: string;
        descricao: string | null;
        valor: Prisma.Decimal | number | string | null;
      }>>(Prisma.sql`
        SELECT
          id,
          fornecedor_id AS "fornecedorId",
          nome,
          descricao,
          valor
        FROM fornecedor_servicos
        WHERE tenant_id = ${tenantId}
        ORDER BY nome ASC
      `),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        gravacaoId: item.gravacaoId,
        fornecedorId: item.fornecedorId,
        fornecedorNome: item.fornecedorNome,
        servicoId: item.servicoId,
        servicoNome: item.servicoNome,
        valor: toNumber(item.valor),
        observacao: item.observacao,
      })),
      fornecedores,
      servicos: servicos.map((servico) => ({
        id: servico.id,
        fornecedorId: servico.fornecedorId,
        nome: servico.nome,
        descricao: servico.descricao,
        valor: toNumber(servico.valor),
      })),
      moeda: gravacao?.unidadeNegocio?.moeda ?? 'BRL',
    };
  }

  async addTerceiro(input: SaveGravacaoTerceiroInput): Promise<GravacaoTerceiroRecord> {
    await this.ensureTables();

    const fornecedor = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM fornecedores
      WHERE id = ${input.fornecedorId}
        AND tenant_id = ${input.tenantId}
      LIMIT 1
    `);

    if (!fornecedor[0]) {
      throw new Error('Fornecedor nao encontrado');
    }

    if (input.servicoId) {
      const servico = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id
        FROM fornecedor_servicos
        WHERE id = ${input.servicoId}
          AND fornecedor_id = ${input.fornecedorId}
          AND tenant_id = ${input.tenantId}
        LIMIT 1
      `);

      if (!servico[0]) {
        throw new Error('Servico do fornecedor nao encontrado');
      }
    }

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO gravacao_terceiros (
        id,
        tenant_id,
        gravacao_id,
        fornecedor_id,
        servico_id,
        valor,
        observacao,
        created_at
      ) VALUES (
        ${randomUUID()},
        ${input.tenantId},
        ${input.gravacaoId},
        ${input.fornecedorId},
        ${input.servicoId ?? null},
        ${input.valor ?? null},
        ${input.observacao ?? null},
        NOW()
      )
      RETURNING id
    `);

    const saved = await this.findCompleteTerceiroById(rows[0].id);
    if (!saved) {
      throw new Error('Terceiro da gravacao nao encontrado apos salvar');
    }

    return saved;
  }

  async findTerceiroById(id: string): Promise<GravacaoRelationRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<GravacaoRelationRecord[]>(Prisma.sql`
      SELECT
        id,
        tenant_id AS "tenantId",
        gravacao_id AS "gravacaoId"
      FROM gravacao_terceiros
      WHERE id = ${id}
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async removeTerceiro(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM gravacao_terceiros WHERE id = ${id}`;
  }

  async listConvidados(tenantId: string, gravacaoId: string) {
    await this.ensureTables();

    const [pessoas, items] = await Promise.all([
      prisma.$queryRaw<GravacaoConvidadoPessoaOptionRecord[]>(Prisma.sql`
        SELECT
          id,
          nome,
          sobrenome,
          nome_trabalho AS "nomeTrabalho",
          foto_url AS foto,
          telefone,
          email,
          status
        FROM pessoas
        WHERE tenant_id = ${tenantId}
          AND COALESCE(status, 'Ativo') = 'Ativo'
        ORDER BY nome ASC, sobrenome ASC
      `),
      prisma.$queryRaw<Array<{
        id: string;
        tenantId: string;
        gravacaoId: string;
        pessoaId: string;
        nome: string;
        sobrenome: string;
        nomeTrabalho: string | null;
        foto: string | null;
        telefone: string | null;
        email: string | null;
        observacao: string | null;
      }>>(Prisma.sql`
        SELECT
          gc.id,
          gc.tenant_id AS "tenantId",
          gc.gravacao_id AS "gravacaoId",
          gc.pessoa_id AS "pessoaId",
          p.nome,
          p.sobrenome,
          p.nome_trabalho AS "nomeTrabalho",
          p.foto_url AS foto,
          p.telefone,
          p.email,
          gc.observacao
        FROM gravacao_convidados gc
        INNER JOIN pessoas p ON p.id = gc.pessoa_id
        WHERE gc.tenant_id = ${tenantId}
          AND gc.gravacao_id = ${gravacaoId}
        ORDER BY p.nome ASC, p.sobrenome ASC
      `),
    ]);

    return {
      pessoas,
      items,
    };
  }

  async addConvidado(input: SaveGravacaoConvidadoInput): Promise<GravacaoConvidadoRecord> {
    await this.ensureTables();

    const pessoa = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM pessoas
      WHERE id = ${input.pessoaId}
        AND tenant_id = ${input.tenantId}
      LIMIT 1
    `);

    if (!pessoa[0]) {
      throw new Error('Pessoa nao encontrada');
    }

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO gravacao_convidados (
        id,
        tenant_id,
        gravacao_id,
        pessoa_id,
        observacao,
        created_at
      ) VALUES (
        ${randomUUID()},
        ${input.tenantId},
        ${input.gravacaoId},
        ${input.pessoaId},
        ${input.observacao ?? null},
        NOW()
      )
      ON CONFLICT (gravacao_id, pessoa_id)
      DO UPDATE SET observacao = EXCLUDED.observacao
      RETURNING id
    `);

    const saved = await this.findCompleteConvidadoById(rows[0].id);
    if (!saved) {
      throw new Error('Convidado da gravacao nao encontrado apos salvar');
    }

    return saved;
  }

  async findConvidadoById(id: string): Promise<GravacaoRelationRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<GravacaoRelationRecord[]>(Prisma.sql`
      SELECT
        id,
        tenant_id AS "tenantId",
        gravacao_id AS "gravacaoId"
      FROM gravacao_convidados
      WHERE id = ${id}
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async removeConvidado(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM gravacao_convidados WHERE id = ${id}`;
  }

  private async findCompleteFigurinoAllocationById(id: string): Promise<GravacaoFigurinoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<GravacaoFigurinoRow[]>(Prisma.sql`
      SELECT
        gf.id,
        gf.tenant_id AS "tenantId",
        gf.gravacao_id AS "gravacaoId",
        gf.figurino_id AS "figurinoId",
        f.codigo_figurino AS "codigoFigurino",
        f.descricao,
        f.tipo_figurino_id AS "tipoFigurinoId",
        f.tamanho_peca AS "tamanhoPeca",
        gf.observacao,
        gf.pessoa_id AS "pessoaId"
      FROM gravacao_figurinos gf
      INNER JOIN figurinos f ON f.id = gf.figurino_id
      WHERE gf.id = ${id}
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const [imagensByFigurino, tiposById] = await Promise.all([
      this.loadFigurinoImages([row.figurinoId]),
      this.loadTipoFigurinoNames(row.tipoFigurinoId ? [row.tipoFigurinoId] : []),
    ]);
    const imagens = imagensByFigurino.get(row.figurinoId) ?? [];
    const principal = imagens.find((imagem) => imagem.isPrincipal) ?? imagens[0];

    return {
      id: row.id,
      tenantId: row.tenantId,
      gravacaoId: row.gravacaoId,
      figurinoId: row.figurinoId,
      codigoFigurino: row.codigoFigurino,
      descricao: row.descricao,
      tipoFigurino: row.tipoFigurinoId ? (tiposById.get(row.tipoFigurinoId) ?? null) : null,
      tamanhoPeca: row.tamanhoPeca,
      imagemPrincipal: principal?.url ?? null,
      observacao: row.observacao,
      pessoaId: row.pessoaId,
    };
  }

  private async findCompleteTerceiroById(id: string): Promise<GravacaoTerceiroRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<GravacaoTerceiroRow[]>(Prisma.sql`
      SELECT
        gt.id,
        gt.tenant_id AS "tenantId",
        gt.gravacao_id AS "gravacaoId",
        gt.fornecedor_id AS "fornecedorId",
        f.nome AS "fornecedorNome",
        gt.servico_id AS "servicoId",
        fs.nome AS "servicoNome",
        gt.valor,
        gt.observacao
      FROM gravacao_terceiros gt
      INNER JOIN fornecedores f ON f.id = gt.fornecedor_id
      LEFT JOIN fornecedor_servicos fs ON fs.id = gt.servico_id
      WHERE gt.id = ${id}
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      tenantId: row.tenantId,
      gravacaoId: row.gravacaoId,
      fornecedorId: row.fornecedorId,
      fornecedorNome: row.fornecedorNome,
      servicoId: row.servicoId,
      servicoNome: row.servicoNome,
      valor: toNumber(row.valor),
      observacao: row.observacao,
    };
  }

  private async findCompleteConvidadoById(id: string): Promise<GravacaoConvidadoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<GravacaoConvidadoRecord[]>(Prisma.sql`
      SELECT
        gc.id,
        gc.tenant_id AS "tenantId",
        gc.gravacao_id AS "gravacaoId",
        gc.pessoa_id AS "pessoaId",
        p.nome,
        p.sobrenome,
        p.nome_trabalho AS "nomeTrabalho",
        p.foto_url AS foto,
        p.telefone,
        p.email,
        gc.observacao
      FROM gravacao_convidados gc
      INNER JOIN pessoas p ON p.id = gc.pessoa_id
      WHERE gc.id = ${id}
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  private async loadFigurinoImages(figurinoIds: string[]): Promise<Map<string, GravacaoFigurinoImageRecord[]>> {
    if (figurinoIds.length === 0 || !(await this.tableExists('figurino_imagens'))) {
      return new Map();
    }

    const rows = await prisma.$queryRaw<FigurinoImagemRow[]>(Prisma.sql`
      SELECT
        figurino_id AS "figurinoId",
        url,
        is_principal AS "isPrincipal"
      FROM figurino_imagens
      WHERE figurino_id IN (${Prisma.join(figurinoIds)})
      ORDER BY created_at ASC
    `);

    const map = new Map<string, GravacaoFigurinoImageRecord[]>();
    for (const row of rows) {
      const current = map.get(row.figurinoId) ?? [];
      current.push({
        url: row.url,
        isPrincipal: Boolean(row.isPrincipal),
      });
      map.set(row.figurinoId, current);
    }

    return map;
  }

  private async loadTipoFigurinoNames(tipoIds: string[]): Promise<Map<string, string>> {
    if (tipoIds.length === 0 || !(await this.tableExists('tipos_figurino'))) {
      return new Map();
    }

    const rows = await prisma.$queryRaw<Array<{ id: string; nome: string }>>(Prisma.sql`
      SELECT id, nome
      FROM tipos_figurino
      WHERE id IN (${Prisma.join(tipoIds)})
    `);

    return new Map(rows.map((row) => [row.id, row.nome]));
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
          CREATE TABLE IF NOT EXISTS gravacao_figurinos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            figurino_id text NOT NULL REFERENCES figurinos(id) ON DELETE CASCADE,
            pessoa_id text NULL,
            observacao text NULL,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        // pessoa_id has no FK to pessoas to avoid initialization-order failures.
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_convidados (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            pessoa_id text NOT NULL,
            observacao text NULL,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_terceiros (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            fornecedor_id text NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
            servico_id text NULL REFERENCES fornecedor_servicos(id) ON DELETE SET NULL,
            valor numeric(12, 2) NULL,
            observacao text NULL,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS gravacao_convidados_unique_idx
          ON gravacao_convidados (gravacao_id, pessoa_id)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS gravacao_figurinos_unique_idx
          ON gravacao_figurinos (gravacao_id, figurino_id)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS gravacao_terceiros_gravacao_idx
          ON gravacao_terceiros (gravacao_id, fornecedor_id)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_espacos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            espaco_id text NULL,
            descricao text NULL,
            hora_inicio text NULL,
            hora_fim text NULL,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`ALTER TABLE gravacao_espacos ADD COLUMN IF NOT EXISTS hora_inicio text NULL`);
        await prisma.$executeRawUnsafe(`ALTER TABLE gravacao_espacos ADD COLUMN IF NOT EXISTS hora_fim text NULL`);
        await prisma.$executeRawUnsafe(`ALTER TABLE gravacao_espacos ADD COLUMN IF NOT EXISTS data text NULL`);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS gravacao_espacos_gravacao_idx
          ON gravacao_espacos (gravacao_id)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_espaco_recursos_fisicos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_espaco_id text NOT NULL REFERENCES gravacao_espacos(id) ON DELETE CASCADE,
            recurso_fisico_id text NOT NULL,
            valor_hora numeric(12,2) NULL DEFAULT 0,
            quantidade integer NULL DEFAULT 1,
            hora_inicio text NULL,
            hora_fim text NULL,
            valor_total numeric(12,2) NULL DEFAULT 0,
            desconto_percentual numeric(5,2) NULL DEFAULT 0,
            valor_com_desconto numeric(12,2) NULL DEFAULT 0,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_espaco_recursos_tecnicos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_espaco_id text NOT NULL REFERENCES gravacao_espacos(id) ON DELETE CASCADE,
            recurso_tecnico_id text NOT NULL,
            valor_hora numeric(12,2) NULL DEFAULT 0,
            quantidade integer NULL DEFAULT 1,
            hora_inicio text NULL,
            hora_fim text NULL,
            valor_total numeric(12,2) NULL DEFAULT 0,
            desconto_percentual numeric(5,2) NULL DEFAULT 0,
            valor_com_desconto numeric(12,2) NULL DEFAULT 0,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS gerf_espaco_idx ON gravacao_espaco_recursos_fisicos (gravacao_espaco_id)`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS gert_espaco_idx ON gravacao_espaco_recursos_tecnicos (gravacao_espaco_id)`);
        await prisma.$executeRawUnsafe(`ALTER TABLE gravacao_espaco_recursos_fisicos ADD COLUMN IF NOT EXISTS data text NULL`);
        await prisma.$executeRawUnsafe(`ALTER TABLE gravacao_espaco_recursos_tecnicos ADD COLUMN IF NOT EXISTS data text NULL`);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_despesas (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            titulo text NOT NULL,
            numero_documento text NULL,
            descricao text NULL,
            status text NULL,
            tipo_documento text NULL,
            categoria text NULL,
            data_vencimento date NULL,
            valor numeric(12,2) NULL,
            fornecedor_id text NULL REFERENCES fornecedores(id) ON DELETE SET NULL,
            forma_pagamento text NULL,
            created_at timestamptz NOT NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS gravacao_despesas_gravacao_idx ON gravacao_despesas (gravacao_id)`);
      })().catch((err) => {
        this.ready = null;
        throw err;
      });
    }

    await this.ready;
  }

  async listEspacos(tenantId: string, gravacaoId: string): Promise<GravacaoEspacoRecord[]> {
    await this.ensureTables();

    const gravacao = await prisma.gravacao.findUnique({
      where: { id: gravacaoId },
      select: { conteudoId: true },
    });

    // Load conteudo espacos to use as source of truth for hora/descricao
    const conteudoEspacosMap = new Map<string, { id: string; descricao: string | null; horaInicio: string | null; horaFim: string | null }>();
    if (gravacao?.conteudoId) {
      const rows = await prisma.$queryRaw<Array<{
        id: string;
        espacoId: string | null;
        descricao: string | null;
        horaInicio: string | null;
        horaFim: string | null;
      }>>`
        select id, espaco_id as "espacoId", descricao, hora_inicio as "horaInicio", hora_fim as "horaFim"
        from public.conteudo_espacos
        where conteudo_id = ${gravacao.conteudoId}
          and tenant_id = ${tenantId}
      `;
      for (const r of rows) {
        if (r.espacoId) conteudoEspacosMap.set(r.espacoId, r);
      }
    }

    const existing = await prisma.$queryRaw<GravacaoEspacoRecord[]>`
      select
        ge.id,
        ge.tenant_id as "tenantId",
        ge.gravacao_id as "gravacaoId",
        ge.espaco_id as "espacoId",
        coalesce(e.titulo, '') as "espacoNome",
        ge.descricao,
        ge.hora_inicio as "horaInicio",
        ge.hora_fim as "horaFim",
        ge.data
      from gravacao_espacos ge
      left join public.espacos e on e.id = ge.espaco_id
      where ge.tenant_id = ${tenantId}
        and ge.gravacao_id = ${gravacaoId}
      order by ge.created_at asc
    `;

    if (existing.length > 0) {
      // Seed resources for any espaco that has none yet
      for (const ge of existing) {
        if (!ge.espacoId) continue;
        const ce = conteudoEspacosMap.get(ge.espacoId);
        if (!ce) continue;
        const existingResources = await prisma.$queryRaw<Array<{ count: bigint }>>`
          select count(*)::bigint as count from gravacao_espaco_recursos_fisicos where gravacao_espaco_id = ${ge.id}
          union all
          select count(*)::bigint as count from gravacao_espaco_recursos_tecnicos where gravacao_espaco_id = ${ge.id}
        `;
        const totalResources = existingResources.reduce((sum, r) => sum + Number(r.count), 0);
        if (totalResources === 0) {
          await this.seedEspacoResources(tenantId, ge.id, ce.id);
        }
      }

      // Merge hora/descricao: gravacao values take precedence, conteudo is fallback
      return existing.map((ge) => {
        if (!ge.espacoId) return ge;
        const ce = conteudoEspacosMap.get(ge.espacoId);
        if (!ce) return ge;
        return {
          ...ge,
          horaInicio: ge.horaInicio ?? ce.horaInicio,
          horaFim: ge.horaFim ?? ce.horaFim,
          descricao: ge.descricao ?? ce.descricao,
        };
      });
    }

    // No gravacao espacos yet — seed from conteudo
    if (conteudoEspacosMap.size === 0) return [];

    for (const [espacoId, ce] of conteudoEspacosMap) {
      const gravacaoEspacoId = randomUUID();
      await prisma.$executeRaw`
        insert into gravacao_espacos (id, tenant_id, gravacao_id, espaco_id, descricao, hora_inicio, hora_fim)
        values (${gravacaoEspacoId}, ${tenantId}, ${gravacaoId}, ${espacoId}, ${ce.descricao ?? null}, ${ce.horaInicio ?? null}, ${ce.horaFim ?? null})
      `;
      await this.seedEspacoResources(tenantId, gravacaoEspacoId, ce.id);
    }

    return prisma.$queryRaw<GravacaoEspacoRecord[]>`
      select
        ge.id,
        ge.tenant_id as "tenantId",
        ge.gravacao_id as "gravacaoId",
        ge.espaco_id as "espacoId",
        coalesce(e.titulo, '') as "espacoNome",
        ge.descricao,
        ge.hora_inicio as "horaInicio",
        ge.hora_fim as "horaFim"
      from gravacao_espacos ge
      left join public.espacos e on e.id = ge.espaco_id
      where ge.tenant_id = ${tenantId}
        and ge.gravacao_id = ${gravacaoId}
      order by ge.created_at asc
    `;
  }

  private async seedEspacoResources(tenantId: string, gravacaoEspacoId: string, conteudoEspacoId: string): Promise<void> {
    const fisicos = await prisma.$queryRaw<Array<{
      recursoFisicoId: string;
      valorHora: string | null;
      quantidade: number | null;
      horaInicio: string | null;
      horaFim: string | null;
      valorTotal: string | null;
      descontoPercentual: string | null;
      valorComDesconto: string | null;
    }>>`
      select recurso_fisico_id as "recursoFisicoId", valor_hora as "valorHora", quantidade,
             hora_inicio as "horaInicio", hora_fim as "horaFim", valor_total as "valorTotal",
             desconto_percentual as "descontoPercentual", valor_com_desconto as "valorComDesconto"
      from public.conteudo_espaco_recursos_fisicos
      where conteudo_espaco_id = ${conteudoEspacoId}
    `;

    for (const r of fisicos) {
      await prisma.$executeRaw`
        insert into gravacao_espaco_recursos_fisicos
          (id, tenant_id, gravacao_espaco_id, recurso_fisico_id, valor_hora, quantidade, hora_inicio, hora_fim, valor_total, desconto_percentual, valor_com_desconto)
        values
          (${randomUUID()}, ${tenantId}, ${gravacaoEspacoId}, ${r.recursoFisicoId}, ${r.valorHora ?? null}, ${r.quantidade ?? 1}, ${r.horaInicio ?? null}, ${r.horaFim ?? null}, ${r.valorTotal ?? null}, ${r.descontoPercentual ?? null}, ${r.valorComDesconto ?? null})
      `;
    }

    const tecnicos = await prisma.$queryRaw<Array<{
      recursoTecnicoId: string;
      valorHora: string | null;
      quantidade: number | null;
      horaInicio: string | null;
      horaFim: string | null;
      valorTotal: string | null;
      descontoPercentual: string | null;
      valorComDesconto: string | null;
    }>>`
      select recurso_tecnico_id as "recursoTecnicoId", valor_hora as "valorHora", quantidade,
             hora_inicio as "horaInicio", hora_fim as "horaFim", valor_total as "valorTotal",
             desconto_percentual as "descontoPercentual", valor_com_desconto as "valorComDesconto"
      from public.conteudo_espaco_recursos_tecnicos
      where conteudo_espaco_id = ${conteudoEspacoId}
    `;

    for (const r of tecnicos) {
      await prisma.$executeRaw`
        insert into gravacao_espaco_recursos_tecnicos
          (id, tenant_id, gravacao_espaco_id, recurso_tecnico_id, valor_hora, quantidade, hora_inicio, hora_fim, valor_total, desconto_percentual, valor_com_desconto)
        values
          (${randomUUID()}, ${tenantId}, ${gravacaoEspacoId}, ${r.recursoTecnicoId}, ${r.valorHora ?? null}, ${r.quantidade ?? 1}, ${r.horaInicio ?? null}, ${r.horaFim ?? null}, ${r.valorTotal ?? null}, ${r.descontoPercentual ?? null}, ${r.valorComDesconto ?? null})
      `;
    }
  }

  async findEspacoById(id: string): Promise<GravacaoEspacoRecord | null> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<GravacaoEspacoRecord[]>`
      select
        ge.id,
        ge.tenant_id as "tenantId",
        ge.gravacao_id as "gravacaoId",
        ge.espaco_id as "espacoId",
        coalesce(e.titulo, '') as "espacoNome",
        ge.descricao,
        ge.hora_inicio as "horaInicio",
        ge.hora_fim as "horaFim",
        ge.data
      from gravacao_espacos ge
      left join public.espacos e on e.id = ge.espaco_id
      where ge.id = ${id}
      limit 1
    `;
    return rows[0] ?? null;
  }

  async addEspaco(input: SaveGravacaoEspacoInput): Promise<GravacaoEspacoRecord> {
    await this.ensureTables();
    const id = randomUUID();
    await prisma.$executeRaw`
      insert into gravacao_espacos (id, tenant_id, gravacao_id, espaco_id, descricao, hora_inicio, hora_fim, data)
      values (${id}, ${input.tenantId}, ${input.gravacaoId}, ${input.espacoId}, ${input.descricao ?? null}, ${input.horaInicio ?? null}, ${input.horaFim ?? null}, ${input.data ?? null})
    `;
    const saved = await this.findEspacoById(id);
    if (!saved) throw new Error('Espaco da gravacao nao encontrado apos salvar');
    return saved;
  }

  async updateEspaco(input: UpdateGravacaoEspacoInput): Promise<GravacaoEspacoRecord | null> {
    await this.ensureTables();
    await prisma.$executeRaw`
      update gravacao_espacos
      set espaco_id = ${input.espacoId}, descricao = ${input.descricao ?? null},
          hora_inicio = ${input.horaInicio ?? null}, hora_fim = ${input.horaFim ?? null},
          data = ${input.data ?? null}
      where id = ${input.id}
    `;
    return this.findEspacoById(input.id);
  }

  async removeEspaco(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`delete from gravacao_espacos where id = ${id}`;
  }

  async listEspacoResources(
    tenantId: string,
    gravacaoEspacoId: string,
    tipo: GravacaoEspacoResourceType,
  ): Promise<{ items: GravacaoEspacoResourceRecord[]; availableResources: GravacaoEspacoAvailableResourceRecord[] }> {
    await this.ensureTables();
    const { itemTable, idCol, resourceTable, valorHoraExpr } = buildGravacaoEspacoResourceTableNames(tipo);

    const items = await prisma.$queryRaw<GravacaoEspacoResourceRecord[]>(Prisma.sql`
      select
        r.id,
        r.tenant_id as "tenantId",
        r.gravacao_espaco_id as "gravacaoEspacoId",
        r.${idCol} as "recursoId",
        res.nome as "recursoNome",
        coalesce(r.valor_hora, 0)::float as "valorHora",
        coalesce(r.quantidade, 1) as "quantidade",
        r.hora_inicio as "horaInicio",
        r.hora_fim as "horaFim",
        r.data,
        coalesce(r.valor_total, 0)::float as "valorTotal",
        coalesce(r.desconto_percentual, 0)::float as "descontoPercentual",
        coalesce(r.valor_com_desconto, 0)::float as "valorComDesconto"
      from ${itemTable} r
      join public.${resourceTable} res on res.id = r.${idCol}
      where r.tenant_id = ${tenantId}
        and r.gravacao_espaco_id = ${gravacaoEspacoId}
      order by res.nome asc
    `);

    const usedIds = items.map((i) => i.recursoId);

    const availableResources = await prisma.$queryRaw<GravacaoEspacoAvailableResourceRecord[]>(Prisma.sql`
      select
        id as "recursoId",
        nome as "recursoNome",
        ${Prisma.raw(valorHoraExpr)}::float as "valorHora"
      from public.${resourceTable}
      where tenant_id = ${tenantId}
        ${usedIds.length > 0 ? Prisma.sql`and id not in (${Prisma.join(usedIds)})` : Prisma.empty}
      order by nome asc
    `);

    return { items, availableResources };
  }

  async addEspacoResource(input: SaveGravacaoEspacoResourceInput): Promise<GravacaoEspacoResourceRecord> {
    await this.ensureTables();
    const { itemTable, idCol, resourceTable, valorHoraExpr } = buildGravacaoEspacoResourceTableNames(input.tipo);
    const id = randomUUID();

    await prisma.$executeRaw(Prisma.sql`
      insert into ${itemTable} (
        id, tenant_id, gravacao_espaco_id, ${idCol},
        valor_hora, quantidade, hora_inicio, hora_fim, data,
        valor_total, desconto_percentual, valor_com_desconto
      ) values (
        ${id}, ${input.tenantId}, ${input.gravacaoEspacoId}, ${input.recursoId},
        ${input.valorHora}, ${input.quantidade}, ${input.horaInicio ?? null}, ${input.horaFim ?? null}, ${input.data ?? null},
        ${input.valorTotal}, ${input.descontoPercentual}, ${input.valorComDesconto}
      )
    `);

    const rows = await prisma.$queryRaw<GravacaoEspacoResourceRecord[]>(Prisma.sql`
      select
        r.id, r.tenant_id as "tenantId", r.gravacao_espaco_id as "gravacaoEspacoId",
        r.${idCol} as "recursoId", res.nome as "recursoNome",
        coalesce(r.valor_hora, 0)::float as "valorHora",
        coalesce(r.quantidade, 1) as "quantidade",
        r.hora_inicio as "horaInicio", r.hora_fim as "horaFim", r.data,
        coalesce(r.valor_total, 0)::float as "valorTotal",
        coalesce(r.desconto_percentual, 0)::float as "descontoPercentual",
        coalesce(r.valor_com_desconto, 0)::float as "valorComDesconto"
      from ${itemTable} r
      join public.${resourceTable} res on res.id = r.${idCol}
      where r.id = ${id}
      limit 1
    `);

    if (!rows[0]) throw new Error('Recurso do espaco nao encontrado apos salvar');
    return rows[0];
  }

  async updateEspacoResource(input: UpdateGravacaoEspacoResourceInput, tipo: GravacaoEspacoResourceType): Promise<GravacaoEspacoResourceRecord | null> {
    await this.ensureTables();
    const { itemTable, idCol, resourceTable } = buildGravacaoEspacoResourceTableNames(tipo);

    await prisma.$executeRaw(Prisma.sql`
      update ${itemTable}
      set quantidade = ${input.quantidade}, hora_inicio = ${input.horaInicio ?? null},
          hora_fim = ${input.horaFim ?? null}, data = ${input.data ?? null}, valor_total = ${input.valorTotal},
          desconto_percentual = ${input.descontoPercentual}, valor_com_desconto = ${input.valorComDesconto}
      where id = ${input.id}
    `);

    const rows = await prisma.$queryRaw<GravacaoEspacoResourceRecord[]>(Prisma.sql`
      select
        r.id, r.tenant_id as "tenantId", r.gravacao_espaco_id as "gravacaoEspacoId",
        r.${idCol} as "recursoId", res.nome as "recursoNome",
        coalesce(r.valor_hora, 0)::float as "valorHora",
        coalesce(r.quantidade, 1) as "quantidade",
        r.hora_inicio as "horaInicio", r.hora_fim as "horaFim", r.data,
        coalesce(r.valor_total, 0)::float as "valorTotal",
        coalesce(r.desconto_percentual, 0)::float as "descontoPercentual",
        coalesce(r.valor_com_desconto, 0)::float as "valorComDesconto"
      from ${itemTable} r
      join public.${resourceTable} res on res.id = r.${idCol}
      where r.id = ${input.id}
      limit 1
    `);

    return rows[0] ?? null;
  }

  async removeEspacoResource(id: string, tipo: GravacaoEspacoResourceType): Promise<void> {
    await this.ensureTables();
    const { itemTable } = buildGravacaoEspacoResourceTableNames(tipo);
    await prisma.$executeRaw(Prisma.sql`delete from ${itemTable} where id = ${id}`);
  }

  async getCustos(tenantId: string, gravacaoId: string): Promise<GravacaoCustosResult> {
    await this.ensureTables();

    const gravacao = await prisma.gravacao.findUnique({
      where: { id: gravacaoId },
      select: { unidadeNegocioId: true },
    });

    const moedaRows = gravacao?.unidadeNegocioId
      ? await prisma.$queryRaw<Array<{ moeda: string | null }>>`
          select moeda from public."UnidadeNegocio" where id = ${gravacao.unidadeNegocioId} limit 1
        `
      : [];
    const moeda = moedaRows[0]?.moeda ?? 'BRL';

    type ResourceRow = {
      id: string;
      parentRecursoId: string | null;
      recursoTecnicoNome: string | null;
      recursoHumanoId: string | null;
      recursoHumanoNome: string | null;
      recursoHumanoSobrenome: string | null;
      recursoHumanoCustoHora: string | null;
      recursoFisicoId: string | null;
      recursoFisicoNome: string | null;
      recursoFisicoCustoHora: string | null;
      horaInicio: string | null;
      horaFim: string | null;
    };

    const tableExists = await this.tableExists('gravacao_recursos');
    const rows = tableExists
      ? await prisma.$queryRaw<ResourceRow[]>(Prisma.sql`
          select
            gr.id,
            gr.parent_recurso_id as "parentRecursoId",
            rt.nome as "recursoTecnicoNome",
            gr.recurso_humano_id as "recursoHumanoId",
            rh.nome as "recursoHumanoNome",
            rh.sobrenome as "recursoHumanoSobrenome",
            rh.custo_hora as "recursoHumanoCustoHora",
            gr.recurso_fisico_id as "recursoFisicoId",
            rf.nome as "recursoFisicoNome",
            rf.custo_hora as "recursoFisicoCustoHora",
            gr.hora_inicio as "horaInicio",
            gr.hora_fim as "horaFim"
          from gravacao_recursos gr
          left join recursos_tecnicos rt on rt.id = gr.recurso_tecnico_id
          left join recursos_humanos rh on rh.id = gr.recurso_humano_id
          left join recursos_fisicos rf on rf.id = gr.recurso_fisico_id
          where gr.tenant_id = ${tenantId}
            and gr.gravacao_id = ${gravacaoId}
          order by gr.created_at asc, gr.id asc
        `)
      : [];

    const calcHoras = (inicio: string | null, fim: string | null): number => {
      if (!inicio || !fim) return 0;
      const [hI, mI] = inicio.split(':').map(Number);
      const [hF, mF] = fim.split(':').map(Number);
      const mins = hF * 60 + mF - (hI * 60 + mI);
      return mins > 0 ? mins / 60 : 0;
    };

    const itens: GravacaoCustoItem[] = [];
    const humanosProcessados = new Set<string>();

    for (const row of rows) {
      const horas = calcHoras(row.horaInicio, row.horaFim);

      if (row.recursoHumanoId && row.recursoHumanoNome) {
        if (!humanosProcessados.has(row.recursoHumanoId) && horas > 0) {
          const nome = `${row.recursoHumanoNome} ${row.recursoHumanoSobrenome ?? ''}`.trim();
          const custoUnitario = row.recursoHumanoCustoHora ? Number(row.recursoHumanoCustoHora) : 0;
          const descricao = row.recursoTecnicoNome
            ? `${horas.toFixed(1)}h operando ${row.recursoTecnicoNome}`
            : `${horas.toFixed(1)}h de trabalho`;
          itens.push({ categoria: 'Recursos Humanos', recurso: nome, descricao, horas, custoUnitario, custoTotal: horas * custoUnitario });
          humanosProcessados.add(row.recursoHumanoId);
        }
        continue;
      }

      if (row.recursoFisicoId && row.recursoFisicoNome && horas > 0) {
        const custoUnitario = row.recursoFisicoCustoHora ? Number(row.recursoFisicoCustoHora) : 0;
        itens.push({ categoria: 'Recursos Físicos', recurso: row.recursoFisicoNome, descricao: `${horas.toFixed(1)}h de ocupação`, horas, custoUnitario, custoTotal: horas * custoUnitario });
      }
    }

    // Resources from Espaços tab (gravacao_espaco_recursos_fisicos / _tecnicos)
    type EspacoResourceRow = {
      recursoNome: string;
      espacoNome: string | null;
      valorHora: string | null;
      quantidade: number | null;
      horaInicio: string | null;
      horaFim: string | null;
      valorComDesconto: string | null;
    };

    const espacosFisicosExist = await this.tableExists('gravacao_espaco_recursos_fisicos');
    if (espacosFisicosExist) {
      const fisicoRows = await prisma.$queryRaw<EspacoResourceRow[]>(Prisma.sql`
        select
          rf.nome as "recursoNome",
          e.titulo as "espacoNome",
          gerf.valor_hora::text as "valorHora",
          gerf.quantidade as "quantidade",
          gerf.hora_inicio as "horaInicio",
          gerf.hora_fim as "horaFim",
          gerf.valor_com_desconto::text as "valorComDesconto"
        from gravacao_espaco_recursos_fisicos gerf
        join gravacao_espacos ge on ge.id = gerf.gravacao_espaco_id
        join recursos_fisicos rf on rf.id = gerf.recurso_fisico_id
        left join public.espacos e on e.id = ge.espaco_id
        where ge.gravacao_id = ${gravacaoId}
          and gerf.tenant_id = ${tenantId}
        order by rf.nome asc
      `);
      for (const r of fisicoRows) {
        const horas = calcHoras(r.horaInicio, r.horaFim) * (r.quantidade ?? 1);
        const custoUnitario = r.valorHora ? Number(r.valorHora) : 0;
        const custoTotal = r.valorComDesconto ? Number(r.valorComDesconto) : horas * custoUnitario;
        const descricao = r.espacoNome ? `${horas.toFixed(1)}h no espaço ${r.espacoNome}` : `${horas.toFixed(1)}h de ocupação`;
        itens.push({ categoria: 'Recursos Físicos', recurso: r.recursoNome, descricao, horas, custoUnitario, custoTotal });
      }
    }

    const espacosTecnicosExist = await this.tableExists('gravacao_espaco_recursos_tecnicos');
    if (espacosTecnicosExist) {
      const tecnicoRows = await prisma.$queryRaw<EspacoResourceRow[]>(Prisma.sql`
        select
          rt.nome as "recursoNome",
          e.titulo as "espacoNome",
          gert.valor_hora::text as "valorHora",
          gert.quantidade as "quantidade",
          gert.hora_inicio as "horaInicio",
          gert.hora_fim as "horaFim",
          gert.valor_com_desconto::text as "valorComDesconto"
        from gravacao_espaco_recursos_tecnicos gert
        join gravacao_espacos ge on ge.id = gert.gravacao_espaco_id
        join recursos_tecnicos rt on rt.id = gert.recurso_tecnico_id
        left join public.espacos e on e.id = ge.espaco_id
        where ge.gravacao_id = ${gravacaoId}
          and gert.tenant_id = ${tenantId}
        order by rt.nome asc
      `);
      for (const r of tecnicoRows) {
        const horas = calcHoras(r.horaInicio, r.horaFim) * (r.quantidade ?? 1);
        const custoUnitario = r.valorHora ? Number(r.valorHora) : 0;
        const custoTotal = r.valorComDesconto ? Number(r.valorComDesconto) : horas * custoUnitario;
        const descricao = r.espacoNome ? `${horas.toFixed(1)}h no espaço ${r.espacoNome}` : `${horas.toFixed(1)}h de uso`;
        itens.push({ categoria: 'Equipamentos Técnicos', recurso: r.recursoNome, descricao, horas, custoUnitario, custoTotal });
      }
    }

    const terceirosExist = await this.tableExists('gravacao_terceiros');
    if (terceirosExist) {
      const terceiros = await prisma.$queryRaw<Array<{
        fornecedorNome: string;
        servicoNome: string | null;
        observacao: string | null;
        valor: string | null;
      }>>`
        select f.nome as "fornecedorNome", fs.nome as "servicoNome", gt.observacao, gt.valor
        from gravacao_terceiros gt
        inner join fornecedores f on f.id = gt.fornecedor_id
        left join fornecedor_servicos fs on fs.id = gt.servico_id
        where gt.tenant_id = ${tenantId} and gt.gravacao_id = ${gravacaoId}
      `;
      for (const t of terceiros) {
        const valor = t.valor ? Number(t.valor) : 0;
        itens.push({ categoria: 'Terceiros', recurso: t.fornecedorNome, descricao: t.servicoNome ?? t.observacao ?? 'Serviço', horas: 0, custoUnitario: valor, custoTotal: valor });
      }
    }

    return { moeda, itens };
  }

  async listStatusCores(tenantId: string): Promise<Array<{ nome: string; cor: string | null }>> {
    const exists = await this.tableExists('status_gravacao');
    if (!exists) return [];
    return prisma.$queryRaw<Array<{ nome: string; cor: string | null }>>`
      select nome, cor
      from public.status_gravacao
      where tenant_id = ${tenantId}
    `;
  }

  async listDespesas(tenantId: string, gravacaoId: string): Promise<GravacaoDespesaRecord[]> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<Array<{
      id: string; tenantId: string; gravacaoId: string; titulo: string;
      numeroDocumento: string | null; descricao: string | null; status: string | null;
      tipoDocumento: string | null; categoria: string | null; dataVencimento: string | null;
      valor: Prisma.Decimal | null; fornecedorId: string | null; fornecedorNome: string | null;
      formaPagamento: string | null; createdAt: Date;
    }>>(Prisma.sql`
      SELECT gd.id, gd.tenant_id AS "tenantId", gd.gravacao_id AS "gravacaoId",
        gd.titulo, gd.numero_documento AS "numeroDocumento", gd.descricao, gd.status,
        gd.tipo_documento AS "tipoDocumento", gd.categoria,
        gd.data_vencimento::text AS "dataVencimento", gd.valor,
        gd.fornecedor_id AS "fornecedorId", f.nome AS "fornecedorNome",
        gd.forma_pagamento AS "formaPagamento", gd.created_at AS "createdAt"
      FROM gravacao_despesas gd
      LEFT JOIN fornecedores f ON f.id = gd.fornecedor_id
      WHERE gd.tenant_id = ${tenantId} AND gd.gravacao_id = ${gravacaoId}
      ORDER BY gd.created_at DESC
    `);
    return rows.map((r) => ({ ...r, valor: r.valor != null ? Number(r.valor) : null }));
  }

  async addDespesa(input: SaveGravacaoDespesaInput): Promise<GravacaoDespesaRecord> {
    await this.ensureTables();
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO gravacao_despesas (
        id, tenant_id, gravacao_id, titulo, numero_documento, descricao, status,
        tipo_documento, categoria, data_vencimento, valor, fornecedor_id, forma_pagamento, created_at
      ) VALUES (
        ${id}, ${input.tenantId}, ${input.gravacaoId}, ${input.titulo},
        ${input.numeroDocumento ?? null}, ${input.descricao ?? null}, ${input.status ?? null},
        ${input.tipoDocumento ?? null}, ${input.categoria ?? null},
        ${input.dataVencimento ? Prisma.raw(`'${input.dataVencimento}'::date`) : Prisma.raw('NULL')},
        ${input.valor ?? null}, ${input.fornecedorId ?? null}, ${input.formaPagamento ?? null},
        NOW()
      )
    `;
    const rows = await prisma.$queryRaw<Array<{
      id: string; tenantId: string; gravacaoId: string; titulo: string;
      numeroDocumento: string | null; descricao: string | null; status: string | null;
      tipoDocumento: string | null; categoria: string | null; dataVencimento: string | null;
      valor: Prisma.Decimal | null; fornecedorId: string | null; fornecedorNome: string | null;
      formaPagamento: string | null; createdAt: Date;
    }>>(Prisma.sql`
      SELECT gd.id, gd.tenant_id AS "tenantId", gd.gravacao_id AS "gravacaoId",
        gd.titulo, gd.numero_documento AS "numeroDocumento", gd.descricao, gd.status,
        gd.tipo_documento AS "tipoDocumento", gd.categoria,
        gd.data_vencimento::text AS "dataVencimento", gd.valor,
        gd.fornecedor_id AS "fornecedorId", f.nome AS "fornecedorNome",
        gd.forma_pagamento AS "formaPagamento", gd.created_at AS "createdAt"
      FROM gravacao_despesas gd
      LEFT JOIN fornecedores f ON f.id = gd.fornecedor_id
      WHERE gd.id = ${id} LIMIT 1
    `);
    const saved = rows[0];
    if (!saved) throw new Error('Despesa da gravacao nao encontrada apos salvar');
    return { ...saved, valor: saved.valor != null ? Number(saved.valor) : null };
  }

  async updateDespesa(input: UpdateGravacaoDespesaInput): Promise<GravacaoDespesaRecord | null> {
    await this.ensureTables();
    await prisma.$executeRaw`
      UPDATE gravacao_despesas SET
        titulo = ${input.titulo},
        numero_documento = ${input.numeroDocumento ?? null},
        descricao = ${input.descricao ?? null},
        status = ${input.status ?? null},
        tipo_documento = ${input.tipoDocumento ?? null},
        categoria = ${input.categoria ?? null},
        data_vencimento = ${input.dataVencimento ? Prisma.raw(`'${input.dataVencimento}'::date`) : Prisma.raw('NULL')},
        valor = ${input.valor ?? null},
        fornecedor_id = ${input.fornecedorId ?? null},
        forma_pagamento = ${input.formaPagamento ?? null}
      WHERE id = ${input.id}
    `;
    const rows = await prisma.$queryRaw<Array<{
      id: string; tenantId: string; gravacaoId: string; titulo: string;
      numeroDocumento: string | null; descricao: string | null; status: string | null;
      tipoDocumento: string | null; categoria: string | null; dataVencimento: string | null;
      valor: Prisma.Decimal | null; fornecedorId: string | null; fornecedorNome: string | null;
      formaPagamento: string | null; createdAt: Date;
    }>>(Prisma.sql`
      SELECT gd.id, gd.tenant_id AS "tenantId", gd.gravacao_id AS "gravacaoId",
        gd.titulo, gd.numero_documento AS "numeroDocumento", gd.descricao, gd.status,
        gd.tipo_documento AS "tipoDocumento", gd.categoria,
        gd.data_vencimento::text AS "dataVencimento", gd.valor,
        gd.fornecedor_id AS "fornecedorId", f.nome AS "fornecedorNome",
        gd.forma_pagamento AS "formaPagamento", gd.created_at AS "createdAt"
      FROM gravacao_despesas gd
      LEFT JOIN fornecedores f ON f.id = gd.fornecedor_id
      WHERE gd.id = ${input.id} LIMIT 1
    `);
    const saved = rows[0];
    if (!saved) return null;
    return { ...saved, valor: saved.valor != null ? Number(saved.valor) : null };
  }

  async findDespesaById(id: string): Promise<GravacaoRelationRecord | null> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<GravacaoRelationRecord[]>(Prisma.sql`
      SELECT id, tenant_id AS "tenantId", gravacao_id AS "gravacaoId"
      FROM gravacao_despesas WHERE id = ${id} LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async removeDespesa(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM gravacao_despesas WHERE id = ${id}`;
  }

  async listEspacoRecursosSummary(tenantId: string, gravacaoId: string): Promise<EspacoRecursosSummaryResult> {
    await this.ensureTables();

    const gravacao = await prisma.gravacao.findUnique({
      where: { id: gravacaoId },
      select: { dataPrevista: true },
    });

    const dataPrevista = gravacao?.dataPrevista
      ? gravacao.dataPrevista.toISOString().slice(0, 10)
      : null;

    const calcHoras = (inicio: string | null, fim: string | null): number => {
      if (!inicio || !fim) return 0;
      const [hI, mI] = inicio.split(':').map(Number);
      const [hF, mF] = fim.split(':').map(Number);
      const mins = hF * 60 + mF - (hI * 60 + mI);
      return mins > 0 ? mins / 60 : 0;
    };

    const items: EspacoRecursoSummaryItem[] = [];

    if (await this.tableExists('gravacao_espaco_recursos_fisicos')) {
      const rows = await prisma.$queryRaw<Array<{
        recursoNome: string;
        espacoNome: string | null;
        horaInicio: string | null;
        horaFim: string | null;
        quantidade: number;
      }>>(Prisma.sql`
        SELECT
          rf.nome AS "recursoNome",
          e.titulo AS "espacoNome",
          gerf.hora_inicio AS "horaInicio",
          gerf.hora_fim AS "horaFim",
          COALESCE(gerf.quantidade, 1)::int AS "quantidade"
        FROM gravacao_espaco_recursos_fisicos gerf
        JOIN gravacao_espacos ge ON ge.id = gerf.gravacao_espaco_id
        JOIN recursos_fisicos rf ON rf.id = gerf.recurso_fisico_id
        LEFT JOIN public.espacos e ON e.id = ge.espaco_id
        WHERE ge.gravacao_id = ${gravacaoId}
          AND gerf.tenant_id = ${tenantId}
        ORDER BY e.titulo, rf.nome
      `);
      for (const r of rows) {
        items.push({
          tipo: 'fisico',
          recursoNome: r.recursoNome,
          espacoNome: r.espacoNome,
          horaInicio: r.horaInicio,
          horaFim: r.horaFim,
          quantidade: r.quantidade,
          horas: calcHoras(r.horaInicio, r.horaFim),
        });
      }
    }

    if (await this.tableExists('gravacao_espaco_recursos_tecnicos')) {
      const rows = await prisma.$queryRaw<Array<{
        recursoNome: string;
        espacoNome: string | null;
        horaInicio: string | null;
        horaFim: string | null;
        quantidade: number;
      }>>(Prisma.sql`
        SELECT
          rt.nome AS "recursoNome",
          e.titulo AS "espacoNome",
          gert.hora_inicio AS "horaInicio",
          gert.hora_fim AS "horaFim",
          COALESCE(gert.quantidade, 1)::int AS "quantidade"
        FROM gravacao_espaco_recursos_tecnicos gert
        JOIN gravacao_espacos ge ON ge.id = gert.gravacao_espaco_id
        JOIN recursos_tecnicos rt ON rt.id = gert.recurso_tecnico_id
        LEFT JOIN public.espacos e ON e.id = ge.espaco_id
        WHERE ge.gravacao_id = ${gravacaoId}
          AND gert.tenant_id = ${tenantId}
        ORDER BY e.titulo, rt.nome
      `);
      for (const r of rows) {
        items.push({
          tipo: 'tecnico',
          recursoNome: r.recursoNome,
          espacoNome: r.espacoNome,
          horaInicio: r.horaInicio,
          horaFim: r.horaFim,
          quantidade: r.quantidade,
          horas: calcHoras(r.horaInicio, r.horaFim),
        });
      }
    }

    return { dataPrevista, items };
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      select to_regclass(${`public.${tableName}`}) is not null as "exists"
    `;

    return Boolean(rows[0]?.exists);
  }
}
