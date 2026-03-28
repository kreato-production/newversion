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

export type EquipeMemberRecord = {
  id: string;
  recursoHumanoId: string;
  dataAssociacao: Date;
};

export type EquipeUserOptionRecord = {
  id: string;
  nome: string;
  sobrenome: string;
  funcaoNome: string;
};

export interface EquipesRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<EquipeRecord>>;
  findById(id: string): Promise<EquipeRecord | null>;
  save(input: SaveEquipeInput): Promise<EquipeRecord>;
  remove(id: string): Promise<void>;
  listUsuariosAtivos(tenantId: string): Promise<EquipeUserOptionRecord[]>;
  listMembros(equipeId: string): Promise<EquipeMemberRecord[]>;
  addMembro(input: { tenantId: string; equipeId: string; userId: string }): Promise<EquipeMemberRecord>;
  removeMembro(equipeId: string, userId: string): Promise<void>;
}

export class PrismaEquipesRepository implements EquipesRepository {
  private membersReady: Promise<void> | null = null;

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

  async listUsuariosAtivos(tenantId: string): Promise<EquipeUserOptionRecord[]> {
    const items = await prisma.user.findMany({
      where: { tenantId, status: 'ATIVO' },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        perfil: true,
      },
    });

    return items.map((item) => {
      const parts = item.nome.trim().split(/\s+/);
      return {
        id: item.id,
        nome: parts[0] || item.nome,
        sobrenome: parts.slice(1).join(' '),
        funcaoNome: item.perfil || 'Usuario',
      };
    });
  }

  async listMembros(equipeId: string): Promise<EquipeMemberRecord[]> {
    await this.ensureMembersTable();

    const rows = await prisma.$queryRaw<Array<{ recursoHumanoId: string; dataAssociacao: Date }>>`
      SELECT ue.usuario_id AS "recursoHumanoId", ue.created_at AS "dataAssociacao"
      FROM usuario_equipes ue
      WHERE ue.equipe_id = ${equipeId}
      ORDER BY ue.created_at ASC
    `;

    return rows.map((row) => ({
      id: row.recursoHumanoId,
      recursoHumanoId: row.recursoHumanoId,
      dataAssociacao: row.dataAssociacao,
    }));
  }

  async addMembro(input: { tenantId: string; equipeId: string; userId: string }): Promise<EquipeMemberRecord> {
    await this.ensureMembersTable();

    await prisma.$executeRaw`
      INSERT INTO usuario_equipes (tenant_id, usuario_id, equipe_id, created_at)
      VALUES (${input.tenantId}, ${input.userId}, ${input.equipeId}, NOW())
      ON CONFLICT (usuario_id, equipe_id) DO NOTHING
    `;

    const rows = await prisma.$queryRaw<Array<{ recursoHumanoId: string; dataAssociacao: Date }>>`
      SELECT ue.usuario_id AS "recursoHumanoId", ue.created_at AS "dataAssociacao"
      FROM usuario_equipes ue
      WHERE ue.equipe_id = ${input.equipeId} AND ue.usuario_id = ${input.userId}
      LIMIT 1
    `;

    const row = rows[0];
    return {
      id: row.recursoHumanoId,
      recursoHumanoId: row.recursoHumanoId,
      dataAssociacao: row.dataAssociacao,
    };
  }

  async removeMembro(equipeId: string, userId: string): Promise<void> {
    await this.ensureMembersTable();

    await prisma.$executeRaw`
      DELETE FROM usuario_equipes
      WHERE equipe_id = ${equipeId} AND usuario_id = ${userId}
    `;
  }

  private async ensureMembersTable(): Promise<void> {
    if (!this.membersReady) {
      this.membersReady = prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS usuario_equipes (
          usuario_id text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
          equipe_id text NOT NULL REFERENCES "Equipe"(id) ON DELETE CASCADE,
          tenant_id text NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          PRIMARY KEY (usuario_id, equipe_id)
        )
      `).then(() => undefined);
    }

    await this.membersReady;
  }
}
