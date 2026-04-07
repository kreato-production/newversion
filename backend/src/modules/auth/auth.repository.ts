import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import type { AuthenticatedUser, AuthorizationContext, PermissionItem, TenantValidation } from './auth.types.js';

export type LoginUserRecord = AuthenticatedUser & {
  passwordHash: string | null;
  tenantStatus: TenantStatus | null;
  perfil?: string | null;
  tipoAcesso?: string | null;
};

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: AuthenticatedUser & {
    tenantStatus: TenantStatus | null;
    perfil?: string | null;
    tipoAcesso?: string | null;
  };
};

export interface AuthRepository {
  findUserForLogin(identifier: string): Promise<LoginUserRecord | null>;
  findUserById(id: string): Promise<LoginUserRecord | null>;
  getAuthorizationContext(userId: string, tenantId: string | null, role: UserRole): Promise<AuthorizationContext>;
  validateTenantAccess(tenantId: string | null, now: Date): Promise<TenantValidation>;
  createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(tokenHash: string, revokedAt: Date): Promise<void>;
  revokeExpiredRefreshTokens(now: Date): Promise<void>;

  // ── Métodos opcionais — usados apenas quando KEYCLOAK_AUTH_ENABLED=true ──
  // Opcionais para não quebrar os InMemoryAuthRepository dos testes,
  // que não precisam implementá-los (Keycloak está desabilitado em testes).

  /**
   * Busca usuário pelo keycloakId (campo User.keycloakId).
   * Retorna null se não houver usuário vinculado ao subject do Keycloak.
   */
  findUserByKeycloakId?(keycloakId: string): Promise<LoginUserRecord | null>;

  /**
   * Cria ou vincula um usuário a partir dos claims do Keycloak.
   *
   * Estratégia:
   *  1. Busca por keycloakId → já vinculado, retorna
   *  2. Busca por email → existe mas sem vínculo, atualiza keycloakId
   *  3. Não encontrado → cria novo usuário com passwordHash=null
   */
  upsertUserFromKeycloak?(input: {
    keycloakSub: string;
    email: string;
    nome: string;
    username: string;
    tenantId: string | null;
    role: UserRole;
  }): Promise<{ id: string; tenantId: string | null; role: UserRole }>;
}

function defaultEnabledModules(role: UserRole): string[] {
  if (role === 'GLOBAL_ADMIN') {
    return ['Dashboard', 'Produção', 'Recursos', 'Administração', 'Financeiro', 'Global'];
  }

  return ['Dashboard', 'Produção', 'Recursos', 'Administração', 'Financeiro'];
}

function defaultPerfil(role: UserRole): string {
  if (role === 'GLOBAL_ADMIN') return 'Administrador Global';
  if (role === 'TENANT_ADMIN') return 'Administrador Tenant';
  return 'Usuario';
}

function generatePermissionId(modulo: string, subModulo1: string, subModulo2: string, campo: string): string {
  return `${modulo}_${subModulo1}_${subModulo2}_${campo}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function mapUser(user: {
  id: string;
  tenantId: string | null;
  nome: string;
  email: string;
  usuario: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string | null;
  perfil: string | null;
  tipoAcesso: string;
  tenant: { status: TenantStatus } | null;
}): LoginUserRecord {
  return {
    id: user.id,
    tenantId: user.tenantId,
    nome: user.nome,
    email: user.email,
    usuario: user.usuario,
    role: user.role,
    status: user.status,
    passwordHash: user.passwordHash,
    tenantStatus: user.tenant?.status ?? null,
    perfil: user.perfil,
    tipoAcesso: user.tipoAcesso,
  };
}

function mapPermissionRow(row: {
  modulo: string;
  sub_modulo1: string | null;
  sub_modulo2: string | null;
  campo: string | null;
  acao: string;
  somente_leitura: boolean | null;
  incluir: boolean | null;
  alterar: boolean | null;
  excluir: boolean | null;
  tipo: string;
}): PermissionItem {
  const subModulo1 = row.sub_modulo1 || '-';
  const subModulo2 = row.sub_modulo2 || '-';
  const campo = row.campo || '-';

  return {
    id: generatePermissionId(row.modulo, subModulo1, subModulo2, campo),
    modulo: row.modulo,
    subModulo1,
    subModulo2,
    campo,
    acao: row.acao === 'invisible' ? 'invisible' : 'visible',
    somenteLeitura: row.somente_leitura ?? false,
    incluir: row.incluir !== false,
    alterar: row.alterar !== false,
    excluir: row.excluir !== false,
    tipo: (row.tipo as PermissionItem['tipo']) || 'campo',
  };
}

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly logger?: FastifyBaseLogger) {}

  async findUserForLogin(identifier: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { usuario: identifier },
          { email: identifier },
        ],
      },
      include: {
        tenant: {
          select: {
            status: true,
          },
        },
      },
    });

    return user ? mapUser(user) : null;
  }

  async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            status: true,
          },
        },
      },
    });

    return user ? mapUser(user) : null;
  }

  async getAuthorizationContext(userId: string, tenantId: string | null, role: UserRole): Promise<AuthorizationContext> {
    const fallback: AuthorizationContext = {
      perfil: defaultPerfil(role),
      tipoAcesso: 'Operacional',
      unidadeIds: [],
      enabledModules: defaultEnabledModules(role),
      permissions: [],
    };

    try {
      const profileRows = await prisma.$queryRaw<Array<{
        tenant_id: string | null;
        perfil_id: string | null;
        tipo_acesso: string | null;
        perfil_nome: string | null;
      }>>`
        SELECT p.tenant_id, p.perfil_id, p.tipo_acesso, pa.nome AS perfil_nome
        FROM profiles p
        LEFT JOIN perfis_acesso pa ON pa.id = p.perfil_id
        WHERE p.id = ${userId}
        LIMIT 1
      `;

      const profile = profileRows[0];
      const resolvedTenantId = tenantId ?? profile?.tenant_id ?? null;
      const perfilId = profile?.perfil_id ?? null;

      const unidadeRows = await prisma.$queryRaw<Array<{ unidade_id: string }>>`
        SELECT unidade_id
        FROM usuario_unidades
        WHERE usuario_id = ${userId}
      `;

      const moduleRows = resolvedTenantId
        ? await prisma.$queryRaw<Array<{ modulo: string }>>`
            SELECT modulo
            FROM tenant_modulos_backend
            WHERE tenant_id = ${resolvedTenantId}
          `
        : [];

      const permissionRows = perfilId
        ? await prisma.$queryRaw<Array<{
            modulo: string;
            sub_modulo1: string | null;
            sub_modulo2: string | null;
            campo: string | null;
            acao: string;
            somente_leitura: boolean | null;
            incluir: boolean | null;
            alterar: boolean | null;
            excluir: boolean | null;
            tipo: string;
          }>>`
            SELECT modulo, sub_modulo1, sub_modulo2, campo, acao, somente_leitura, incluir, alterar, excluir, tipo
            FROM perfil_permissoes
            WHERE perfil_id = ${perfilId}
          `
        : [];

      return {
        perfil: profile?.perfil_nome || fallback.perfil,
        tipoAcesso: profile?.tipo_acesso || fallback.tipoAcesso,
        unidadeIds: unidadeRows.map((item) => item.unidade_id),
        enabledModules: moduleRows.length > 0 ? moduleRows.map((item) => item.modulo) : fallback.enabledModules,
        permissions: permissionRows.map(mapPermissionRow),
      };
    } catch (error) {
      this.logger?.warn({ err: error }, 'Falling back to default authorization context');
      return fallback;
    }
  }

  async validateTenantAccess(tenantId: string | null, now: Date): Promise<TenantValidation> {
    if (!tenantId) {
      return { valid: true };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        licencas: {
          where: {
            dataInicio: { lte: now },
            dataFim: { gte: now },
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return { valid: false, reason: 'TENANT_NOT_FOUND' };
    }

    if (tenant.status === 'INATIVO') {
      return { valid: false, reason: 'TENANT_INACTIVE' };
    }

    if (tenant.status === 'BLOQUEADO') {
      return { valid: false, reason: 'TENANT_BLOCKED' };
    }

    if (tenant.licencas.length === 0) {
      return { valid: false, reason: 'LICENSE_EXPIRED' };
    }

    return { valid: true };
  }

  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await prisma.refreshToken.create({ data: input });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            tenant: {
              select: { status: true },
            },
          },
        },
      },
    });

    if (!refreshToken) {
      return null;
    }

    return {
      id: refreshToken.id,
      userId: refreshToken.userId,
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      revokedAt: refreshToken.revokedAt,
      user: {
        id: refreshToken.user.id,
        tenantId: refreshToken.user.tenantId,
        nome: refreshToken.user.nome,
        email: refreshToken.user.email,
        usuario: refreshToken.user.usuario,
        role: refreshToken.user.role,
        status: refreshToken.user.status,
        tenantStatus: refreshToken.user.tenant?.status ?? null,
        perfil: refreshToken.user.perfil,
        tipoAcesso: refreshToken.user.tipoAcesso,
      },
    };
  }

  async revokeRefreshToken(tokenHash: string, revokedAt: Date): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });
  }

  async revokeExpiredRefreshTokens(now: Date): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        expiresAt: { lt: now },
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
  }

  async findUserByKeycloakId(keycloakId: string): Promise<LoginUserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { keycloakId },
      include: { tenant: { select: { status: true } } },
    });
    return user ? mapUser(user) : null;
  }

  async upsertUserFromKeycloak(input: {
    keycloakSub: string;
    email: string;
    nome: string;
    username: string;
    tenantId: string | null;
    role: UserRole;
  }): Promise<{ id: string; tenantId: string | null; role: UserRole }> {
    // 1. Já existe vínculo por keycloakId?
    const byKeycloak = await prisma.user.findUnique({
      where: { keycloakId: input.keycloakSub },
      select: { id: true, tenantId: true, role: true },
    });
    if (byKeycloak) return byKeycloak;

    // 2. Existe por email (usuário migrado, ainda sem keycloakId)?
    const byEmail = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, tenantId: true, role: true },
    });
    if (byEmail) {
      await prisma.user.update({
        where: { id: byEmail.id },
        data: { keycloakId: input.keycloakSub },
      });
      return byEmail;
    }

    // 3. Primeiro acesso: cria novo usuário
    // `usuario` usa preferred_username; se colidir, usa o prefixo do email
    let username = input.username;
    const existing = await prisma.user.findUnique({ where: { usuario: username } });
    if (existing) {
      username = input.email.split('@')[0] + '_' + input.keycloakSub.slice(0, 8);
    }

    const created = await prisma.user.create({
      data: {
        keycloakId: input.keycloakSub,
        email: input.email,
        nome: input.nome,
        usuario: username,
        role: input.role,
        tenantId: input.tenantId,
        status: 'ATIVO',
        passwordHash: null,  // autenticação via Keycloak, não senha local
      },
      select: { id: true, tenantId: true, role: true },
    });

    return created;
  }
}
