import { prisma } from '../../lib/prisma.js';

export type ProgramaRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  unidadeNegocioId: string | null;
  unidadeNegocioNome: string | null;
  createdAt: Date;
};

export type SaveProgramaInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
  unidadeNegocioId?: string | null;
  createdById?: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

export interface ProgramasRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<ProgramaRecord>>;
  findById(id: string): Promise<ProgramaRecord | null>;
  save(input: SaveProgramaInput): Promise<ProgramaRecord>;
  remove(id: string): Promise<void>;
}

function mapPrograma(item: {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  unidadeNegocioId: string | null;
  createdAt: Date;
  unidadeNegocio?: { nome: string } | null;
}): ProgramaRecord {
  return {
    id: item.id,
    tenantId: item.tenantId,
    codigoExterno: item.codigoExterno,
    nome: item.nome,
    descricao: item.descricao,
    unidadeNegocioId: item.unidadeNegocioId,
    unidadeNegocioNome: item.unidadeNegocio?.nome ?? null,
    createdAt: item.createdAt,
  };
}

export class PrismaProgramasRepository implements ProgramasRepository {
  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<ProgramaRecord>> {
    const take = Math.min(opts?.limit ?? 50, 200);
    const skip = opts?.offset ?? 0;
    const where = { tenantId };

    const [total, data] = await prisma.$transaction([
      prisma.programa.count({ where }),
      prisma.programa.findMany({
        where,
        include: { unidadeNegocio: { select: { nome: true } } },
        orderBy: { nome: 'asc' },
        take,
        skip,
      }),
    ]);

    return { data: data.map(mapPrograma), total };
  }

  async findById(id: string): Promise<ProgramaRecord | null> {
    const item = await prisma.programa.findUnique({
      where: { id },
      include: { unidadeNegocio: { select: { nome: true } } },
    });

    return item ? mapPrograma(item) : null;
  }

  async save(input: SaveProgramaInput): Promise<ProgramaRecord> {
    const item = input.id
      ? await prisma.programa.upsert({
          where: { id: input.id },
          update: {
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            unidadeNegocioId: input.unidadeNegocioId ?? null,
            createdById: input.createdById ?? null,
          },
          create: {
            id: input.id,
            tenantId: input.tenantId,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            unidadeNegocioId: input.unidadeNegocioId ?? null,
            createdById: input.createdById ?? null,
          },
          include: { unidadeNegocio: { select: { nome: true } } },
        })
      : await prisma.programa.create({
          data: {
            tenantId: input.tenantId,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            descricao: input.descricao ?? null,
            unidadeNegocioId: input.unidadeNegocioId ?? null,
            createdById: input.createdById ?? null,
          },
          include: { unidadeNegocio: { select: { nome: true } } },
        });

    return mapPrograma(item);
  }

  async remove(id: string): Promise<void> {
    await prisma.programa.delete({ where: { id } });
  }
}
