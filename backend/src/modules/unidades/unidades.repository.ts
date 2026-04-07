import { prisma } from '../../lib/prisma.js';

export type UnidadeRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  moeda: string;
  createdByName: string | null;
  createdAt: Date;
};

export type SaveUnidadeInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  moeda?: string;
  createdByName?: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

export interface UnidadesRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<UnidadeRecord>>;
  listAll(opts?: ListOptions): Promise<PaginatedResult<UnidadeRecord>>;
  findById(id: string): Promise<UnidadeRecord | null>;
  save(input: SaveUnidadeInput): Promise<UnidadeRecord>;
  remove(id: string): Promise<void>;
}

export class PrismaUnidadesRepository implements UnidadesRepository {
  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<UnidadeRecord>> {
    const take = Math.min(opts?.limit ?? 50, 200);
    const skip = opts?.offset ?? 0;
    const where = { tenantId };

    const [total, data] = await prisma.$transaction([
      prisma.unidadeNegocio.count({ where }),
      prisma.unidadeNegocio.findMany({ where, orderBy: { nome: 'asc' }, take, skip }),
    ]);

    return {
      data: data.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        codigoExterno: item.codigoExterno,
        nome: item.nome,
        descricao: item.descricao,
        imagemUrl: item.imagemUrl,
        moeda: item.moeda,
        createdByName: item.createdByName,
        createdAt: item.createdAt,
      })),
      total,
    };
  }

  async listAll(opts?: ListOptions): Promise<PaginatedResult<UnidadeRecord>> {
    const take = Math.min(opts?.limit ?? 50, 200);
    const skip = opts?.offset ?? 0;

    const [total, data] = await prisma.$transaction([
      prisma.unidadeNegocio.count(),
      prisma.unidadeNegocio.findMany({ orderBy: { nome: 'asc' }, take, skip }),
    ]);

    return {
      data: data.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        codigoExterno: item.codigoExterno,
        nome: item.nome,
        descricao: item.descricao,
        imagemUrl: item.imagemUrl,
        moeda: item.moeda,
        createdByName: item.createdByName,
        createdAt: item.createdAt,
      })),
      total,
    };
  }

  async findById(id: string): Promise<UnidadeRecord | null> {
    const item = await prisma.unidadeNegocio.findUnique({ where: { id } });

    return item
      ? {
          id: item.id,
          tenantId: item.tenantId,
          codigoExterno: item.codigoExterno,
          nome: item.nome,
          descricao: item.descricao,
          imagemUrl: item.imagemUrl,
          moeda: item.moeda,
          createdByName: item.createdByName,
          createdAt: item.createdAt,
        }
      : null;
  }

  async save(input: SaveUnidadeInput): Promise<UnidadeRecord> {
    const item = input.id
      ? await prisma.unidadeNegocio.upsert({
          where: { id: input.id },
          update: {
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            imagemUrl: input.imagemUrl ?? null,
            moeda: input.moeda ?? 'BRL',
            createdByName: input.createdByName ?? null,
          },
          create: {
            id: input.id,
            tenantId: input.tenantId,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            imagemUrl: input.imagemUrl ?? null,
            moeda: input.moeda ?? 'BRL',
            createdByName: input.createdByName ?? null,
          },
        })
      : await prisma.unidadeNegocio.create({
          data: {
            tenantId: input.tenantId,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            imagemUrl: input.imagemUrl ?? null,
            moeda: input.moeda ?? 'BRL',
            createdByName: input.createdByName ?? null,
          },
        });

    return {
      id: item.id,
      tenantId: item.tenantId,
      codigoExterno: item.codigoExterno,
      nome: item.nome,
      descricao: item.descricao,
      imagemUrl: item.imagemUrl,
      moeda: item.moeda,
      createdByName: item.createdByName,
      createdAt: item.createdAt,
    };
  }

  async remove(id: string): Promise<void> {
    await prisma.unidadeNegocio.delete({ where: { id } });
  }
}
