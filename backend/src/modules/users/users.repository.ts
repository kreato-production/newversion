import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type UserRecord = {
  id: string;
  tenantId: string | null;
  codigoExterno: string | null;
  nome: string;
  email: string;
  usuario: string;
  fotoUrl: string | null;
  perfil: string | null;
  descricao: string | null;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  tipoAcesso: string;
  recursoHumanoId: string | null;
  role: 'GLOBAL_ADMIN' | 'TENANT_ADMIN' | 'USER';
  createdAt: Date;
};

export type SaveUserInput = {
  id?: string;
  tenantId: string | null;
  codigoExterno?: string | null;
  nome: string;
  email: string;
  usuario: string;
  passwordHash?: string | null;
  fotoUrl?: string | null;
  perfil?: string | null;
  descricao?: string | null;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  tipoAcesso?: string;
  recursoHumanoId?: string | null;
  role?: 'GLOBAL_ADMIN' | 'TENANT_ADMIN' | 'USER';
};

export type ListOptions = { limit?: number; offset?: number; actorUnidadeIds?: string[] };
export type PaginatedResult<T> = { data: T[]; total: number };

export type UserLinkedUnidadeRecord = {
  id: string;
  nome: string;
};

export type UserLinkedProgramaRecord = {
  id: string;
  nome: string;
};

export type UserLinkedEquipeRecord = {
  id: string;
  codigo: string;
  descricao: string;
};

export interface UsersRepository {
  listByTenant(tenantId?: string | null, opts?: ListOptions): Promise<PaginatedResult<UserRecord>>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByUsername(usuario: string): Promise<UserRecord | null>;
  findTenantAdmin(tenantId: string): Promise<UserRecord | null>;
  save(input: SaveUserInput): Promise<UserRecord>;
  remove(id: string): Promise<void>;
  listAvailableUnidades(tenantId: string): Promise<UserLinkedUnidadeRecord[]>;
  listUserUnidades(userId: string): Promise<UserLinkedUnidadeRecord[]>;
  addUserUnidade(userId: string, unidadeId: string): Promise<void>;
  removeUserUnidade(userId: string, unidadeId: string): Promise<void>;
  listAvailableProgramas(tenantId: string): Promise<UserLinkedProgramaRecord[]>;
  listUserProgramas(userId: string): Promise<UserLinkedProgramaRecord[]>;
  addUserPrograma(input: { tenantId: string; userId: string; programaId: string }): Promise<void>;
  removeUserPrograma(userId: string, programaId: string): Promise<void>;
  listAvailableEquipes(tenantId: string): Promise<UserLinkedEquipeRecord[]>;
  listUserEquipes(userId: string): Promise<UserLinkedEquipeRecord[]>;
  addUserEquipe(input: { tenantId: string; userId: string; equipeId: string }): Promise<void>;
  removeUserEquipe(userId: string, equipeId: string): Promise<void>;
}

export class PrismaUsersRepository implements UsersRepository {
  private relationsReady: Promise<void> | null = null;

  async listByTenant(tenantId?: string | null, opts?: ListOptions): Promise<PaginatedResult<UserRecord>> {
    const take = Math.min(opts?.limit ?? 50, 200);
    const skip = opts?.offset ?? 0;
    const actorUnidadeIds = opts?.actorUnidadeIds;

    // tenantId undefined/null em contexto GLOBAL_ADMIN → retorna todos os usuários.
    // tenantId presente → retorna apenas usuários do tenant, excluindo GLOBAL_ADMINs.
    const baseWhere =
      tenantId != null
        ? { tenantId, role: { not: 'GLOBAL_ADMIN' as const } }
        : undefined;

    // Regra 3: se o actor tem unidades restritas, só retorna usuários vinculados a essas unidades
    if (actorUnidadeIds && actorUnidadeIds.length > 0 && tenantId != null) {
      const unidadeList = Prisma.join(actorUnidadeIds.map((id) => Prisma.sql`${id}`));

      const [countRows, data] = await Promise.all([
        prisma.$queryRaw<[{ total: bigint }]>`
          SELECT COUNT(*)::bigint AS total
          FROM "User" u
          WHERE u."tenantId" = ${tenantId}
            AND u.role != 'GLOBAL_ADMIN'
            AND EXISTS (
              SELECT 1 FROM usuario_unidades uu
              WHERE uu.usuario_id = u.id
                AND uu.unidade_id IN (${unidadeList})
            )
        `,
        prisma.$queryRaw<any[]>`
          SELECT u.*
          FROM "User" u
          WHERE u."tenantId" = ${tenantId}
            AND u.role != 'GLOBAL_ADMIN'
            AND EXISTS (
              SELECT 1 FROM usuario_unidades uu
              WHERE uu.usuario_id = u.id
                AND uu.unidade_id IN (${unidadeList})
            )
          ORDER BY u.nome ASC
          LIMIT ${take} OFFSET ${skip}
        `,
      ]);

      return {
        total: Number(countRows[0]?.total ?? 0),
        data: data.map((item) => ({
          id: item.id,
          tenantId: item.tenantId,
          codigoExterno: item.codigoExterno,
          nome: item.nome,
          email: item.email,
          usuario: item.usuario,
          fotoUrl: item.fotoUrl,
          perfil: item.perfil,
          descricao: item.descricao,
          status: item.status,
          tipoAcesso: item.tipoAcesso,
          recursoHumanoId: item.recursoHumanoId,
          role: item.role,
          createdAt: item.createdAt,
        })),
      };
    }

    const [total, data] = await prisma.$transaction([
      prisma.user.count({ where: baseWhere }),
      prisma.user.findMany({ where: baseWhere, orderBy: { nome: 'asc' }, take, skip }),
    ]);

    return {
      data: data.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        codigoExterno: item.codigoExterno,
        nome: item.nome,
        email: item.email,
        usuario: item.usuario,
        fotoUrl: item.fotoUrl,
        perfil: item.perfil,
        descricao: item.descricao,
        status: item.status,
        tipoAcesso: item.tipoAcesso,
        recursoHumanoId: item.recursoHumanoId,
        role: item.role,
        createdAt: item.createdAt,
      })),
      total,
    };
  }

  async findById(id: string): Promise<UserRecord | null> {
    const item = await prisma.user.findUnique({ where: { id } });
    return item ? this.map(item) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const item = await prisma.user.findUnique({ where: { email } });
    return item ? this.map(item) : null;
  }

  async findByUsername(usuario: string): Promise<UserRecord | null> {
    const item = await prisma.user.findUnique({ where: { usuario } });
    return item ? this.map(item) : null;
  }

  async findTenantAdmin(tenantId: string): Promise<UserRecord | null> {
    const item = await prisma.user.findFirst({
      where: { tenantId, role: 'TENANT_ADMIN' },
      orderBy: { createdAt: 'asc' },
    });
    return item ? this.map(item) : null;
  }

  async save(input: SaveUserInput): Promise<UserRecord> {
    const item = input.id
      ? await prisma.user.upsert({
          where: { id: input.id },
          update: {
            tenantId: input.tenantId,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            email: input.email,
            usuario: input.usuario,
            ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
            fotoUrl: input.fotoUrl ?? null,
            perfil: input.perfil ?? null,
            descricao: input.descricao ?? null,
            status: input.status,
            tipoAcesso: input.tipoAcesso ?? 'Operacional',
            recursoHumanoId: input.recursoHumanoId ?? null,
            role: input.role ?? 'USER',
          },
          create: {
            id: input.id,
            tenantId: input.tenantId,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            email: input.email,
            usuario: input.usuario,
            passwordHash: input.passwordHash ?? null,
            fotoUrl: input.fotoUrl ?? null,
            perfil: input.perfil ?? null,
            descricao: input.descricao ?? null,
            status: input.status,
            tipoAcesso: input.tipoAcesso ?? 'Operacional',
            recursoHumanoId: input.recursoHumanoId ?? null,
            role: input.role ?? 'USER',
          },
        })
      : await prisma.user.create({
          data: {
            tenantId: input.tenantId,
            codigoExterno: input.codigoExterno ?? null,
            nome: input.nome,
            email: input.email,
            usuario: input.usuario,
            passwordHash: input.passwordHash ?? null,
            fotoUrl: input.fotoUrl ?? null,
            perfil: input.perfil ?? null,
            descricao: input.descricao ?? null,
            status: input.status,
            tipoAcesso: input.tipoAcesso ?? 'Operacional',
            recursoHumanoId: input.recursoHumanoId ?? null,
            role: input.role ?? 'USER',
          },
        });

    return this.map(item);
  }

  async remove(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async listAvailableUnidades(tenantId: string): Promise<UserLinkedUnidadeRecord[]> {
    const items = await prisma.unidadeNegocio.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });

    return items.map((item) => ({ id: item.id, nome: item.nome }));
  }

  async listUserUnidades(userId: string): Promise<UserLinkedUnidadeRecord[]> {
    const rows = await prisma.$queryRaw<Array<{ id: string; nome: string }>>`
      SELECT u.id, u.nome
      FROM usuario_unidades uu
      INNER JOIN "UnidadeNegocio" u ON u.id = uu.unidade_id
      WHERE uu.usuario_id = ${userId}
      ORDER BY u.nome ASC
    `;

    return rows.map((row) => ({ id: row.id, nome: row.nome }));
  }

  async addUserUnidade(userId: string, unidadeId: string): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO usuario_unidades (usuario_id, unidade_id, created_at)
      VALUES (${userId}, ${unidadeId}, NOW())
      ON CONFLICT (usuario_id, unidade_id) DO NOTHING
    `;
  }

  async removeUserUnidade(userId: string, unidadeId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM usuario_unidades
      WHERE usuario_id = ${userId} AND unidade_id = ${unidadeId}
    `;
  }

  async listAvailableProgramas(tenantId: string): Promise<UserLinkedProgramaRecord[]> {
    const items = await prisma.programa.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });

    return items.map((item) => ({ id: item.id, nome: item.nome }));
  }

  async listUserProgramas(userId: string): Promise<UserLinkedProgramaRecord[]> {
    await this.ensureRelationTables();

    const rows = await prisma.$queryRaw<Array<{ id: string; nome: string }>>`
      SELECT p.id, p.nome
      FROM usuario_programas up
      INNER JOIN "Programa" p ON p.id = up.programa_id
      WHERE up.usuario_id = ${userId}
      ORDER BY p.nome ASC
    `;

    return rows.map((row) => ({ id: row.id, nome: row.nome }));
  }

  async addUserPrograma(input: { tenantId: string; userId: string; programaId: string }): Promise<void> {
    await this.ensureRelationTables();

    await prisma.$executeRaw`
      INSERT INTO usuario_programas (tenant_id, usuario_id, programa_id, created_at)
      VALUES (${input.tenantId}, ${input.userId}, ${input.programaId}, NOW())
      ON CONFLICT (usuario_id, programa_id) DO NOTHING
    `;
  }

  async removeUserPrograma(userId: string, programaId: string): Promise<void> {
    await this.ensureRelationTables();

    await prisma.$executeRaw`
      DELETE FROM usuario_programas
      WHERE usuario_id = ${userId} AND programa_id = ${programaId}
    `;
  }

  async listAvailableEquipes(tenantId: string): Promise<UserLinkedEquipeRecord[]> {
    const items = await prisma.equipe.findMany({
      where: { tenantId },
      orderBy: { descricao: 'asc' },
      select: { id: true, codigo: true, descricao: true },
    });

    return items.map((item) => ({ id: item.id, codigo: item.codigo, descricao: item.descricao }));
  }

  async listUserEquipes(userId: string): Promise<UserLinkedEquipeRecord[]> {
    await this.ensureRelationTables();

    const rows = await prisma.$queryRaw<Array<{ id: string; codigo: string; descricao: string }>>`
      SELECT e.id, e.codigo, e.descricao
      FROM usuario_equipes ue
      INNER JOIN "Equipe" e ON e.id = ue.equipe_id
      WHERE ue.usuario_id = ${userId}
      ORDER BY e.descricao ASC
    `;

    return rows.map((row) => ({ id: row.id, codigo: row.codigo, descricao: row.descricao }));
  }

  async addUserEquipe(input: { tenantId: string; userId: string; equipeId: string }): Promise<void> {
    await this.ensureRelationTables();

    await prisma.$executeRaw`
      INSERT INTO usuario_equipes (tenant_id, usuario_id, equipe_id, created_at)
      VALUES (${input.tenantId}, ${input.userId}, ${input.equipeId}, NOW())
      ON CONFLICT (usuario_id, equipe_id) DO NOTHING
    `;
  }

  async removeUserEquipe(userId: string, equipeId: string): Promise<void> {
    await this.ensureRelationTables();

    await prisma.$executeRaw`
      DELETE FROM usuario_equipes
      WHERE usuario_id = ${userId} AND equipe_id = ${equipeId}
    `;
  }

  private map(item: Awaited<ReturnType<typeof prisma.user.findUnique>> extends infer T ? any : never): UserRecord {
    return {
      id: item.id,
      tenantId: item.tenantId,
      codigoExterno: item.codigoExterno,
      nome: item.nome,
      email: item.email,
      usuario: item.usuario,
      fotoUrl: item.fotoUrl,
      perfil: item.perfil,
      descricao: item.descricao,
      status: item.status,
      tipoAcesso: item.tipoAcesso,
      recursoHumanoId: item.recursoHumanoId,
      role: item.role,
      createdAt: item.createdAt,
    };
  }

  private async ensureRelationTables(): Promise<void> {
    if (!this.relationsReady) {
      this.relationsReady = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS usuario_programas (
            usuario_id text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
            programa_id text NOT NULL REFERENCES "Programa"(id) ON DELETE CASCADE,
            tenant_id text NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            PRIMARY KEY (usuario_id, programa_id)
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS usuario_equipes (
            usuario_id text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
            equipe_id text NOT NULL REFERENCES "Equipe"(id) ON DELETE CASCADE,
            tenant_id text NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            PRIMARY KEY (usuario_id, equipe_id)
          )
        `);
      })();
    }

    await this.relationsReady;
  }
}
