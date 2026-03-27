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

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

export interface UsersRepository {
  listByTenant(tenantId: string | null, opts?: ListOptions): Promise<PaginatedResult<UserRecord>>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByUsername(usuario: string): Promise<UserRecord | null>;
  save(input: SaveUserInput): Promise<UserRecord>;
  remove(id: string): Promise<void>;
}

export class PrismaUsersRepository implements UsersRepository {
  async listByTenant(tenantId: string | null, opts?: ListOptions): Promise<PaginatedResult<UserRecord>> {
    const take = Math.min(opts?.limit ?? 50, 200);
    const skip = opts?.offset ?? 0;
    const where = tenantId ? { tenantId } : undefined;

    const [total, data] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, orderBy: { nome: 'asc' }, take, skip }),
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
}
