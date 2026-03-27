import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import type { TenantValidation } from './auth.types.js';
import { describe, expect, it } from 'vitest';
import { hashPassword } from '../../lib/security/password.js';
import { AuthError, AuthService } from './auth.service.js';
import type { AuthRepository, LoginUserRecord, RefreshTokenRecord } from './auth.repository.js';
import { sha256 } from '../../lib/security/hash.js';

class InMemoryAuthRepository implements AuthRepository {
  user: LoginUserRecord | null = null;
  tenantValidation: TenantValidation = { valid: true };
  refreshTokens = new Map<string, RefreshTokenRecord>();
  revokedTokens: string[] = [];

  async findUserForLogin(identifier: string) {
    if (!this.user) {
      return null;
    }

    return this.user.usuario === identifier || this.user.email === identifier ? this.user : null;
  }

  async findUserById(id: string) {
    return this.user?.id === id ? this.user : null;
  }

  async validateTenantAccess() {
    return this.tenantValidation;
  }

  async getAuthorizationContext() {
    return { perfil: 'Administrador Tenant', tipoAcesso: 'Operacional', unidadeIds: [], enabledModules: ['Dashboard', 'Produção', 'Recursos', 'Administração'], permissions: [] };
  }

  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    if (!this.user) {
      throw new Error('missing user');
    }

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

    if (token) {
      token.revokedAt = revokedAt;
      this.revokedTokens.push(tokenHash);
    }
  }

  async revokeExpiredRefreshTokens(now: Date) {
    for (const token of this.refreshTokens.values()) {
      if (token.expiresAt < now && !token.revokedAt) {
        token.revokedAt = now;
      }
    }
  }
}

describe('AuthService', () => {
  const baseNow = new Date('2026-03-25T10:00:00.000Z');

  function createRepository() {
    const repository = new InMemoryAuthRepository();
    repository.user = {
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
    return repository;
  }

  it('gera sessao valida no login com access e refresh token', async () => {
    const repository = createRepository();
    const service = new AuthService(repository, () => baseNow);

    const result = await service.login('ana', '123456');

    expect(result.user).toMatchObject({
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'TENANT_ADMIN',
    });
    expect(result.accessToken).toContain('.');
    expect(result.refreshToken).toContain('.');
    expect(repository.refreshTokens.has(sha256(result.refreshToken))).toBe(true);
  });

  it('bloqueia login quando a licenca do tenant nao e valida', async () => {
    const repository = createRepository();
    repository.tenantValidation = { valid: false, reason: 'LICENSE_EXPIRED' };
    const service = new AuthService(repository, () => baseNow);

    await expect(service.login('ana', '123456')).rejects.toMatchObject({
      message: 'Licenca expirada',
      statusCode: 403,
    });
  });

  it('faz refresh e revoga o token anterior', async () => {
    const repository = createRepository();
    let tick = 0;
    const service = new AuthService(repository, () => new Date(baseNow.getTime() + tick++ * 1000));
    const login = await service.login('ana', '123456');

    const refreshed = await service.refresh(login.refreshToken);

    expect(refreshed.refreshToken).not.toBe(login.refreshToken);
    expect(repository.revokedTokens).toContain(sha256(login.refreshToken));
  });
});

