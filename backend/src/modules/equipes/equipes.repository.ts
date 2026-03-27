import { prisma } from '../../lib/prisma.js';

export type EquipeRecord = {
  id: string;
  tenantId: string;
  codigo: string;
  descricao: string;
  createdAt: Date;
};

export type SaveEquipeInput = {
  id?: string;
  tenantId: string;
  codigo: string;
  descricao: string;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

export interface EquipesRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<EquipeRecord>>;
  findById(id: string): Promise<EquipeRecord | null>;
  save(input: SaveEquipeInput): Promise<EquipeRecord>;
  remove(id: string): Promise<void>;
}

export class PrismaEquipesRepository implements EquipesRepository {
  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<EquipeRecord>> {
    const take = Math.min(opts?.limit ?? 50, 200);
    const skip = opts?.offset ?? 0;
    const where = { tenantId };

    const [total, data] = await prisma.$transaction([
      prisma.equipe.count({ where }),
      prisma.equipe.findMany({ where, orderBy: { codigo: 'asc' }, take, skip }),
    ]);

    return {
      data: data.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        codigo: item.codigo,
        descricao: item.descricao,
        createdAt: item.createdAt,
      })),
      total,
    };
  }

  async findById(id: string): Promise<EquipeRecord | null> {
    const item = await prisma.equipe.findUnique({ where: { id } });

    return item
      ? {
          id: item.id,
          tenantId: item.tenantId,
          codigo: item.codigo,
          descricao: item.descricao,
          createdAt: item.createdAt,
        }
      : null;
  }

  async save(input: SaveEquipeInput): Promise<EquipeRecord> {
    const item = input.id
      ? await prisma.equipe.upsert({
          where: { id: input.id },
          update: {
            codigo: input.codigo,
            descricao: input.descricao,
          },
          create: {
            id: input.id,
            tenantId: input.tenantId,
            codigo: input.codigo,
            descricao: input.descricao,
          },
        })
      : await prisma.equipe.create({
          data: {
            tenantId: input.tenantId,
            codigo: input.codigo,
            descricao: input.descricao,
          },
        });

    return {
      id: item.id,
      tenantId: item.tenantId,
      codigo: item.codigo,
      descricao: item.descricao,
      createdAt: item.createdAt,
    };
  }

  async remove(id: string): Promise<void> {
    await prisma.equipe.delete({ where: { id } });
  }
}
