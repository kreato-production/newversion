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

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

export interface GravacoesRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<GravacaoRecord>>;
  findById(id: string): Promise<GravacaoRecord | null>;
  save(input: SaveGravacaoInput): Promise<GravacaoRecord>;
  remove(id: string): Promise<void>;
}

function mapGravacao(item: {
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
}): GravacaoRecord {
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

export class PrismaGravacoesRepository implements GravacoesRepository {
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
    await prisma.gravacao.delete({ where: { id } });
  }
}
