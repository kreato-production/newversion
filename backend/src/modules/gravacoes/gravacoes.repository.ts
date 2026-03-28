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

export type GravacaoRelationRecord = {
  id: string;
  tenantId: string;
  gravacaoId: string;
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

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_convidados (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            pessoa_id text NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
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
