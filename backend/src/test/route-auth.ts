import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { hashPassword } from '../lib/security/password.js';
import { AuthService } from '../modules/auth/auth.service.js';
import type {
  AuthRepository,
  LoginUserRecord,
  RefreshTokenRecord,
} from '../modules/auth/auth.repository.js';
import type { TenantValidation } from '../modules/auth/auth.types.js';

/** Tenant of the user logged in by {@link createRouteAuthService}. */
export const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111';
export const OTHER_TENANT_ID = '22222222-2222-2222-2222-222222222222';

const TEST_USER = 'ana';
const TEST_PASSWORD = '123456';

/** In-memory auth repository with a single TENANT_ADMIN user, for route tests. */
export class RouteAuthRepository implements AuthRepository {
  user: LoginUserRecord = {
    id: 'user-1',
    tenantId: TEST_TENANT_ID,
    nome: 'Ana Silva',
    email: 'ana@kreato.app',
    usuario: TEST_USER,
    role: 'TENANT_ADMIN' as UserRole,
    status: 'ATIVO' as UserStatus,
    passwordHash: hashPassword(TEST_PASSWORD),
    tenantStatus: 'ATIVO' as TenantStatus,
    tenantNome: null,
  };
  tenantValidation: TenantValidation = { valid: true };
  refreshTokens = new Map<string, RefreshTokenRecord>();

  async findUserForLogin(identifier: string) {
    return this.user.usuario === identifier || this.user.email === identifier ? this.user : null;
  }
  async findUserById(id: string) {
    return this.user.id === id ? this.user : null;
  }
  async validateTenantAccess() {
    return this.tenantValidation;
  }
  async getAuthorizationContext() {
    return {
      perfil: 'Administrador Tenant',
      tipoAcesso: 'Operacional',
      unidadeIds: [],
      enabledModules: ['Dashboard', 'Recursos', 'Produção', 'Financeiro', 'Gestão de Eventos'],
      permissions: [],
    };
  }
  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    this.refreshTokens.set(input.tokenHash, {
      id: input.tokenHash,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      user: { ...this.user, tenantStatus: this.user.tenantStatus },
    });
  }
  async findRefreshToken(tokenHash: string) {
    return this.refreshTokens.get(tokenHash) ?? null;
  }
  async revokeRefreshToken(tokenHash: string, revokedAt: Date) {
    const token = this.refreshTokens.get(tokenHash);
    if (token) token.revokedAt = revokedAt;
  }
  async revokeExpiredRefreshTokens() {}
}

/** Auth service for route tests; `GLOBAL_ADMIN` logs in without a tenant. */
export function createRouteAuthService(role: 'TENANT_ADMIN' | 'GLOBAL_ADMIN' = 'TENANT_ADMIN') {
  const repository = new RouteAuthRepository();
  if (role === 'GLOBAL_ADMIN') {
    repository.user = { ...repository.user, role: 'GLOBAL_ADMIN' as UserRole, tenantId: null };
  }
  return new AuthService(repository, () => new Date('2026-04-08T10:00:00.000Z'));
}

/** Logs in the test user and returns headers for authenticated `app.inject` calls. */
export async function loginHeaders(app: FastifyInstance) {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { usuario: TEST_USER, password: TEST_PASSWORD },
  });
  const accessToken = response.cookies.find((c) => c.name === 'kreato_access_token')?.value ?? '';
  return { authorization: `Bearer ${accessToken}` };
}
