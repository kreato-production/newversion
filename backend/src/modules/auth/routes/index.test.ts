import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import { hashPassword } from '../../../lib/security/password.js';
import { AuthService } from '../auth.service.js';
import type { AuthRepository, LoginUserRecord, RefreshTokenRecord } from '../auth.repository.js';
import type { TenantValidation } from '../auth.types.js';

class RouteAuthRepository implements AuthRepository {
  user: LoginUserRecord = {
    id: 'user-1',
    tenantId: 'tenant-1',
    nome: 'Ana Silva',
    email: 'ana@kreato.app',
    usuario: 'ana',
    role: 'TENANT_ADMIN' as UserRole,
    status: 'ATIVO' as UserStatus,
    passwordHash: hashPassword('123456'),
    tenantStatus: 'ATIVO' as TenantStatus,
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
    return { perfil: 'Administrador Tenant', tipoAcesso: 'Operacional', unidadeIds: ['unidade-1'], enabledModules: ['Dashboard', 'Produção', 'Recursos', 'Administração'], permissions: [] };
  }

  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    this.refreshTokens.set(input.tokenHash, {
      id: input.tokenHash,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      user: {
        id: this.user.id,
        tenantId: this.user.tenantId,
        nome: this.user.nome,
        email: this.user.email,
        usuario: this.user.usuario,
        role: this.user.role,
        status: this.user.status,
        tenantStatus: this.user.tenantStatus,
      },
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

describe('auth routes', () => {
  it('faz login e permite consultar /auth/me com bearer token', async () => {
    const authService = new AuthService(new RouteAuthRepository(), () => new Date('2026-03-25T10:00:00.000Z'));
    const app = await buildApp({ authService });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { usuario: 'ana', password: '123456' },
    });

    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();

    const meResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        authorization: `Bearer ${loginBody.accessToken}`,
      },
    });

    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json()).toEqual({
      user: expect.objectContaining({
        id: 'user-1',
        tenantId: 'tenant-1',
        role: 'TENANT_ADMIN',
      }),
    });

    await app.close();
  });

  it('nega acesso administrativo para role sem permissao', async () => {
    const repository = new RouteAuthRepository();
    repository.user.role = 'USER' as UserRole;
    const authService = new AuthService(repository, () => new Date('2026-03-25T10:00:00.000Z'));
    const app = await buildApp({ authService });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { usuario: 'ana', password: '123456' },
    });
    const { accessToken } = loginResponse.json();

    const adminResponse = await app.inject({
      method: 'GET',
      url: '/auth/admin-access',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(adminResponse.statusCode).toBe(403);
    expect(adminResponse.json()).toEqual({
      message: 'Permissao insuficiente',
      correlationId: expect.any(String),
    });

    await app.close();
  });
});

