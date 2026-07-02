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
  countMembros(equipeIds: string[]): Promise<Record<string, number>>;
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

  async countMembros(equipeIds: string[]): Promise<Record<string, number>> {
    if (equipeIds.length === 0) return {};
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ equipe_id: string; total: bigint }>>(
        `SELECT equipe_id, COUNT(*)::bigint AS total
         FROM usuario_equipes
         WHERE equipe_id = ANY($1::text[])
         GROUP BY equipe_id`,
        equipeIds,
      );
      const result: Record<string, number> = {};
      for (const row of rows) result[row.equipe_id] = Number(row.total);
      return result;
    } catch {
      return {};
    }
  }

  async listUsuariosAtivos(tenantId: string): Promise<EquipeUserOptionRecord[]> {
    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      nome: string;
      sobrenome: string;
      funcaoNome: string | null;
    }>>(
      `SELECT
         rh.id,
         rh.nome,
         COALESCE(rh.sobrenome, '') AS sobrenome,
         COALESCE(f.nome, '') AS "funcaoNome"
       FROM recursos_humanos rh
       LEFT JOIN funcoes f ON f.id = rh.funcao_id
       WHERE rh.tenant_id = $1 AND rh.status = 'Ativo'
       ORDER BY rh.nome ASC, rh.sobrenome ASC`,
      tenantId,
    );
    return rows.map((r) => ({ ...r, funcaoNome: r.funcaoNome ?? '' }));
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
      this.membersReady = (async () => {
        // Create table without FK on usuario_id so it can store recursos_humanos IDs
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS usuario_equipes (
            usuario_id text NOT NULL,
            equipe_id text NOT NULL REFERENCES "Equipe"(id) ON DELETE CASCADE,
            tenant_id text NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            PRIMARY KEY (usuario_id, equipe_id)
          )
        `);
        // Drop the old FK to User if it exists (allows storing RH IDs)
        await prisma.$executeRawUnsafe(`
          ALTER TABLE usuario_equipes
            DROP CONSTRAINT IF EXISTS usuario_equipes_usuario_id_fkey
        `);
      })();
    }

    await this.membersReady;
  }
}
