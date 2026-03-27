import type { UserRole } from '@prisma/client';
import { env } from '../../config/env.js';
import { sha256 } from '../../lib/security/hash.js';
import { signJwt, verifyJwt } from '../../lib/security/jwt.js';
import { verifyPassword } from '../../lib/security/password.js';
import type { AuthRepository } from './auth.repository.js';
import type { AuthorizationContext, LoginResult, RefreshSessionResult, SessionUser } from './auth.types.js';

function toSessionUser(user: {
  id: string;
  tenantId: string | null;
  nome: string;
  email: string;
  usuario: string;
  role: UserRole;
}, context: AuthorizationContext): SessionUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
    nome: user.nome,
    email: user.email,
    usuario: user.usuario,
    role: user.role,
    perfil: context.perfil,
    tipoAcesso: context.tipoAcesso,
    unidadeIds: context.unidadeIds,
    enabledModules: context.enabledModules,
    permissions: context.permissions,
  };
}

function mapTenantValidationError(reason?: string): string {
  switch (reason) {
    case 'TENANT_INACTIVE':
      return 'Tenant inativo';
    case 'TENANT_BLOCKED':
      return 'Tenant bloqueado';
    case 'LICENSE_EXPIRED':
      return 'Licenca expirada';
    case 'TENANT_NOT_FOUND':
      return 'Tenant nao encontrado';
    default:
      return 'Acesso ao tenant negado';
  }
}

export class AuthError extends Error {
  constructor(message: string, readonly statusCode = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly nowProvider: () => Date = () => new Date(),
  ) {}

  async login(identifier: string, password: string): Promise<LoginResult> {
    const user = await this.repository.findUserForLogin(identifier);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new AuthError('Usuario ou senha invalidos', 401);
    }

    if (user.status !== 'ATIVO') {
      throw new AuthError('Usuario sem acesso ativo', 403);
    }

    const tenantValidation = await this.repository.validateTenantAccess(user.tenantId, this.nowProvider());

    if (!tenantValidation.valid) {
      throw new AuthError(mapTenantValidationError(tenantValidation.reason), 403);
    }

    const context = await this.repository.getAuthorizationContext(user.id, user.tenantId, user.role);
    const sessionUser = toSessionUser(user, context);
    return this.issueSession(sessionUser);
  }

  async refresh(refreshToken: string): Promise<RefreshSessionResult> {
    const now = this.nowProvider();
    const tokenHash = sha256(refreshToken);
    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= now) {
      throw new AuthError('Refresh token invalido', 401);
    }

    let payload;
    try {
      payload = verifyJwt(refreshToken, env.JWT_REFRESH_SECRET, now);
    } catch {
      throw new AuthError('Refresh token invalido', 401);
    }

    if (payload.type !== 'refresh') {
      throw new AuthError('Refresh token invalido', 401);
    }

    if (payload.sub !== storedToken.user.id) {
      throw new AuthError('Refresh token invalido', 401);
    }

    if (storedToken.user.status !== 'ATIVO') {
      throw new AuthError('Usuario sem acesso ativo', 403);
    }

    const tenantValidation = await this.repository.validateTenantAccess(storedToken.user.tenantId, now);

    if (!tenantValidation.valid) {
      throw new AuthError(mapTenantValidationError(tenantValidation.reason), 403);
    }

    await this.repository.revokeRefreshToken(tokenHash, now);

    const context = await this.repository.getAuthorizationContext(storedToken.user.id, storedToken.user.tenantId, storedToken.user.role);
    return this.issueSession(toSessionUser(storedToken.user, context));
  }

  async authenticateAccessToken(accessToken: string): Promise<SessionUser> {
    let payload;
    try {
      payload = verifyJwt(accessToken, env.JWT_ACCESS_SECRET, this.nowProvider());
    } catch {
      throw new AuthError('Token de acesso invalido', 401);
    }

    if (payload.type !== 'access') {
      throw new AuthError('Token de acesso invalido', 401);
    }

    const user = await this.repository.findUserById(payload.sub);

    if (!user) {
      throw new AuthError('Usuario autenticado nao encontrado', 401);
    }

    if (user.status !== 'ATIVO') {
      throw new AuthError('Usuario sem acesso ativo', 403);
    }

    const tenantValidation = await this.repository.validateTenantAccess(user.tenantId, this.nowProvider());

    if (!tenantValidation.valid) {
      throw new AuthError(mapTenantValidationError(tenantValidation.reason), 403);
    }

    const context = await this.repository.getAuthorizationContext(user.id, user.tenantId, user.role);
    return toSessionUser(user, context);
  }

  private async issueSession(user: SessionUser): Promise<LoginResult> {
    const now = this.nowProvider();
    const accessToken = signJwt(
      { sub: user.id, role: user.role, tenantId: user.tenantId, type: 'access' },
      env.JWT_ACCESS_SECRET,
      env.JWT_ACCESS_TTL_SECONDS,
      now,
    );
    const refreshToken = signJwt(
      { sub: user.id, role: user.role, tenantId: user.tenantId, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_TTL_SECONDS,
      now,
    );

    await this.repository.revokeExpiredRefreshTokens(now);
    await this.repository.createRefreshToken({
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(now.getTime() + env.JWT_REFRESH_TTL_SECONDS * 1000),
    });

    return {
      user,
      accessToken,
      refreshToken,
      accessTokenExpiresIn: env.JWT_ACCESS_TTL_SECONDS,
      refreshTokenExpiresIn: env.JWT_REFRESH_TTL_SECONDS,
    };
  }
}
