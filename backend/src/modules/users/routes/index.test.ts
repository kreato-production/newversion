import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import { hashPassword } from '../../../lib/security/password.js';
import { AuthService } from '../../auth/auth.service.js';
import type { AuthRepository, LoginUserRecord, RefreshTokenRecord } from '../../auth/auth.repository.js';
import type { TenantValidation } from '../../auth/auth.types.js';
import { UsersService } from '../users.service.js';
import type { SaveUserInput, UserRecord, UsersRepository } from '../users.repository.js';

class RouteAuthRepository implements AuthRepository {
  user: LoginUserRecord = {
    id: 'user-1', tenantId: '11111111-1111-1111-1111-111111111111', nome: 'Ana Silva', email: 'ana@kreato.app', usuario: 'ana', role: 'TENANT_ADMIN' as UserRole, status: 'ATIVO' as UserStatus, passwordHash: hashPassword('123456'), tenantStatus: 'ATIVO' as TenantStatus,
  };
  tenantValidation: TenantValidation = { valid: true };
  refreshTokens = new Map<string, RefreshTokenRecord>();
  async findUserForLogin(identifier: string) { return this.user.usuario === identifier || this.user.email === identifier ? this.user : null; }
  async findUserById(id: string) { return this.user.id === id ? this.user : null; }
  async validateTenantAccess() { return this.tenantValidation; }
  async getAuthorizationContext() { return { perfil: 'Administrador Tenant', tipoAcesso: 'Operacional', unidadeIds: [], enabledModules: ['Dashboard', 'Produ��o', 'Recursos', 'Administra��o'], permissions: [] }; }
  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) { this.refreshTokens.set(input.tokenHash, { id: input.tokenHash, userId: input.userId, tokenHash: input.tokenHash, expiresAt: input.expiresAt, revokedAt: null, user: { ...this.user, tenantStatus: this.user.tenantStatus } }); }
  async findRefreshToken(tokenHash: string) { return this.refreshTokens.get(tokenHash) ?? null; }
  async revokeRefreshToken(tokenHash: string, revokedAt: Date) { const token = this.refreshTokens.get(tokenHash); if (token) token.revokedAt = revokedAt; }
  async revokeExpiredRefreshTokens() {}
}

class InMemoryUsersRepository implements UsersRepository {
  items = new Map<string, UserRecord>();
  async listByTenant(tenantId: string | null) { const data = [...this.items.values()].filter((item) => tenantId === null || item.tenantId === tenantId); return { data, total: data.length }; }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async findByEmail(email: string) { return [...this.items.values()].find((item) => item.email === email) ?? null; }
  async findByUsername(usuario: string) { return [...this.items.values()].find((item) => item.usuario === usuario) ?? null; }
  async save(input: SaveUserInput) { const item: UserRecord = { id: input.id ?? crypto.randomUUID(), tenantId: input.tenantId, codigoExterno: input.codigoExterno ?? null, nome: input.nome, email: input.email, usuario: input.usuario, fotoUrl: input.fotoUrl ?? null, perfil: input.perfil ?? null, descricao: input.descricao ?? null, status: input.status, tipoAcesso: input.tipoAcesso ?? 'Operacional', recursoHumanoId: input.recursoHumanoId ?? null, role: input.role ?? 'USER', createdAt: new Date('2026-03-25T12:00:00.000Z') }; this.items.set(item.id, item); return item; }
  async remove(id: string) { this.items.delete(id); }
}

describe('users routes', () => {
  it('cria e lista usuarios via API protegida', async () => {
    const authService = new AuthService(new RouteAuthRepository(), () => new Date('2026-03-25T10:00:00.000Z'));
    const usersService = new UsersService(new InMemoryUsersRepository());
    const app = await buildApp({ authService, usersService });

    const loginResponse = await app.inject({ method: 'POST', url: '/auth/login', payload: { usuario: 'ana', password: '123456' } });
    const { accessToken } = loginResponse.json();

    const createResponse = await app.inject({ method: 'POST', url: '/users', headers: { authorization: `Bearer ${accessToken}` }, payload: { nome: 'Joao', email: 'joao@kreato.app', usuario: 'joao', senha: '123456', status: 'Ativo' } });
    expect(createResponse.statusCode).toBe(200);

    const listResponse = await app.inject({ method: 'GET', url: '/users', headers: { authorization: `Bearer ${accessToken}` } });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data).toEqual([expect.objectContaining({ nome: 'Joao', usuario: 'joao' })]);

    await app.close();
  });
});

