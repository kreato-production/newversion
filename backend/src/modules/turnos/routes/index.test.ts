import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import { hashPassword } from '../../../lib/security/password.js';
import { AuthService } from '../../auth/auth.service.js';
import type {
  AuthRepository,
  LoginUserRecord,
  RefreshTokenRecord,
} from '../../auth/auth.repository.js';
import type { TenantValidation } from '../../auth/auth.types.js';
import { TurnosService } from '../turnos.service.js';
import type {
  SaveTurnoInput,
  TurnoRecord,
  TurnosRepository,
} from '../turnos.repository.js';

class RouteAuthRepository implements AuthRepository {
  user: LoginUserRecord = {
    id: 'user-1',
    tenantId: '11111111-1111-1111-1111-111111111111',
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
    return {
      perfil: 'Administrador Tenant',
      tipoAcesso: 'Operacional',
      unidadeIds: [],
      enabledModules: ['Dashboard', 'Recursos'],
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

class InMemoryTurnosRepository implements TurnosRepository {
  items = new Map<string, TurnoRecord>();

  async listByTenant(tenantId: string) {
    const data = [...this.items.values()].filter((item) => item.tenantId === tenantId);
    return { data, total: data.length };
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async findByNome(tenantId: string, nome: string) {
    return [...this.items.values()].find(
      (item) => item.tenantId === tenantId && item.nome.toLowerCase() === nome.toLowerCase(),
    ) ?? null;
  }

  async save(input: SaveTurnoInput) {
    const item: TurnoRecord = {
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      nome: input.nome,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
      diasSemana: input.diasSemana,
      pessoasPorDia: input.pessoasPorDia,
      cor: input.cor,
      sigla: input.sigla ?? null,
      folgasPorSemana: input.folgasPorSemana,
      folgaEspecial: input.folgaEspecial ?? null,
      descricao: input.descricao ?? null,
      diasTrabalhados: input.diasTrabalhados ?? null,
      createdAt: new Date('2026-04-08T12:00:00.000Z'),
      createdBy: input.createdBy ?? null,
    };
    this.items.set(item.id, item);
    return item;
  }

  async remove(id: string) {
    this.items.delete(id);
  }
}

describe('turnos routes', () => {
  it('cria, lista e exclui turnos via API protegida', async () => {
    const authService = new AuthService(
      new RouteAuthRepository(),
      () => new Date('2026-04-08T10:00:00.000Z'),
    );
    const turnosService = new TurnosService(new InMemoryTurnosRepository());
    const app = await buildApp({ authService, turnosService });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { usuario: 'ana', password: '123456' },
    });
    const { accessToken } = loginResponse.json();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/turnos',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        nome: 'Turno Manhã',
        horaInicio: '08:00:00',
        horaFim: '17:00:00',
        diasSemana: { dom: false, seg: true, ter: true, qua: true, qui: true, sex: true, sab: false },
        pessoasPorDia: { dom: 0, seg: 3, ter: 3, qua: 3, qui: 3, sex: 3, sab: 0 },
        cor: '#3B82F6',
        sigla: 'TM',
        folgasPorSemana: 2,
        folgaEspecial: '2_domingos_mes',
        descricao: 'Operacao diurna',
        diasTrabalhados: 5,
      },
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        nome: 'Turno Manhã',
        sigla: 'TM',
      }),
    );

    const turnoId = createResponse.json().id as string;

    const listResponse = await app.inject({
      method: 'GET',
      url: '/turnos',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data).toEqual([
      expect.objectContaining({
        id: turnoId,
        nome: 'Turno Manhã',
      }),
    ]);

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/turnos/${turnoId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(deleteResponse.statusCode).toBe(204);

    const emptyListResponse = await app.inject({
      method: 'GET',
      url: '/turnos',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(emptyListResponse.json().data).toEqual([]);

    await app.close();
  });
});
