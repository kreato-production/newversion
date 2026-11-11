import type { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import { hashPassword } from '../../../lib/security/password.js';
import { AuthService } from '../../auth/auth.service.js';
import type { AuthRepository, LoginUserRecord, RefreshTokenRecord } from '../../auth/auth.repository.js';
import type { TenantValidation } from '../../auth/auth.types.js';
import { AdminConfigService } from '../admin-config.service.js';
import type {
  AdminConfigRepository,
  FormularioCampoRecord,
  PerfilRecord,
  PermissionRecord,
} from '../admin-config.repository.js';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const CAMPOS_URL = '/admin-config/formularios/programa/campos';

function makeUser(id: string, usuario: string, tenantId: string | null, role: UserRole): LoginUserRecord {
  return {
    id,
    tenantId,
    nome: usuario,
    email: `${usuario}@kreato.app`,
    usuario,
    role,
    status: 'ATIVO' as UserStatus,
    passwordHash: hashPassword('123456'),
    tenantStatus: 'ATIVO' as TenantStatus,
    tenantNome: null,
  };
}

class RouteAuthRepository implements AuthRepository {
  users: LoginUserRecord[] = [
    makeUser('user-a', 'ana', TENANT_A, 'TENANT_ADMIN' as UserRole),
    makeUser('user-b', 'bia', TENANT_B, 'TENANT_ADMIN' as UserRole),
    makeUser('user-g', 'gil', null, 'GLOBAL_ADMIN' as UserRole),
  ];
  tenantValidation: TenantValidation = { valid: true };
  refreshTokens = new Map<string, RefreshTokenRecord>();

  async findUserForLogin(identifier: string) {
    return this.users.find((u) => u.usuario === identifier || u.email === identifier) ?? null;
  }
  async findUserById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async validateTenantAccess() {
    return this.tenantValidation;
  }
  async getAuthorizationContext() {
    return {
      perfil: 'Administrador',
      tipoAcesso: 'Operacional',
      unidadeIds: [],
      enabledModules: ['Dashboard', 'Administração'],
      permissions: [],
    };
  }
  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    const user = this.users.find((u) => u.id === input.userId)!;
    this.refreshTokens.set(input.tokenHash, {
      id: input.tokenHash,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      user: { ...user, tenantStatus: user.tenantStatus },
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

class InMemoryAdminConfigRepository implements AdminConfigRepository {
  readonly campos = new Map<string, FormularioCampoRecord[]>();
  readonly listas = new Map<string, { zebrado: boolean; corZebra: string | null }>();

  async getFormularioLista(tenantId: string, formularioId: string) {
    return this.listas.get(`${tenantId}:${formularioId}`) ?? null;
  }
  async saveFormularioLista(tenantId: string, formularioId: string, lista: { zebrado: boolean; corZebra: string | null }) {
    this.listas.set(`${tenantId}:${formularioId}`, lista);
  }

  async findPerfilById(): Promise<PerfilRecord | null> {
    return null;
  }
  async listPerfilPermissions(): Promise<PermissionRecord[]> {
    return [];
  }
  async replacePerfilPermissions(): Promise<void> {}
  async listFormularioCampos(tenantId: string, formularioId: string): Promise<FormularioCampoRecord[]> {
    return this.campos.get(`${tenantId}:${formularioId}`) ?? [];
  }
  async replaceFormularioCampos(tenantId: string, formularioId: string, campos: FormularioCampoRecord[]): Promise<void> {
    this.campos.set(
      `${tenantId}:${formularioId}`,
      campos.filter((c) => c.tipoValidacao || c.tamanho != null || c.posicao != null || c.traducoes),
    );
  }
}

async function setup() {
  const authService = new AuthService(new RouteAuthRepository(), () => new Date('2026-04-08T10:00:00.000Z'));
  const repository = new InMemoryAdminConfigRepository();
  const app = await buildApp({ authService, adminConfigService: new AdminConfigService(repository) });

  const login = async (usuario: string) => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { usuario, password: '123456' },
    });
    const token = response.cookies.find((c) => c.name === 'kreato_access_token')?.value ?? '';
    return { authorization: `Bearer ${token}` };
  };

  return {
    app,
    repository,
    adminA: await login('ana'),
    adminB: await login('bia'),
    globalAdmin: await login('gil'),
  };
}

const payload = { campos: [{ campo: 'nome', tipoValidacao: 'obrigatorio' }] };

describe('admin-config routes — formulários por tenant', () => {
  it('a configuração gravada pelo tenant A não aparece para o tenant B', async () => {
    const { app, repository, adminA, adminB } = await setup();

    const put = await app.inject({ method: 'PUT', url: CAMPOS_URL, headers: adminA, payload });
    expect(put.statusCode).toBe(204);
    expect(repository.campos.has(`${TENANT_A}:programa`)).toBe(true);

    const getA = await app.inject({ method: 'GET', url: CAMPOS_URL, headers: adminA });
    expect(getA.statusCode).toBe(200);
    expect(getA.json()).toMatchObject({ tenantId: TENANT_A, campos: [{ campo: 'nome', tipoValidacao: 'obrigatorio' }] });

    const getB = await app.inject({ method: 'GET', url: CAMPOS_URL, headers: adminB });
    expect(getB.statusCode).toBe(200);
    expect(getB.json()).toMatchObject({ tenantId: TENANT_B, campos: [] });
  });

  it('retorna 403 quando um tenant tenta ler ou gravar outro via ?tenantId', async () => {
    const { app, repository, adminB } = await setup();

    const get = await app.inject({ method: 'GET', url: `${CAMPOS_URL}?tenantId=${TENANT_A}`, headers: adminB });
    expect(get.statusCode).toBe(403);

    const put = await app.inject({
      method: 'PUT',
      url: `${CAMPOS_URL}?tenantId=${TENANT_A}`,
      headers: adminB,
      payload,
    });
    expect(put.statusCode).toBe(403);
    expect(repository.campos.has(`${TENANT_A}:programa`)).toBe(false);
  });

  it('GLOBAL_ADMIN grava no tenant informado e não grava sem tenantId', async () => {
    const { app, repository, globalAdmin, adminA, adminB } = await setup();

    const semTenant = await app.inject({ method: 'PUT', url: CAMPOS_URL, headers: globalAdmin, payload });
    expect(semTenant.statusCode).toBe(403);
    expect(repository.campos.size).toBe(0);

    const put = await app.inject({
      method: 'PUT',
      url: `${CAMPOS_URL}?tenantId=${TENANT_A}`,
      headers: globalAdmin,
      payload,
    });
    expect(put.statusCode).toBe(204);

    const getA = await app.inject({ method: 'GET', url: CAMPOS_URL, headers: adminA });
    expect(getA.json().campos).toHaveLength(1);
    const getB = await app.inject({ method: 'GET', url: CAMPOS_URL, headers: adminB });
    expect(getB.json().campos).toHaveLength(0);

    const getGlobal = await app.inject({ method: 'GET', url: CAMPOS_URL, headers: globalAdmin });
    expect(getGlobal.statusCode).toBe(200);
    expect(getGlobal.json()).toEqual({ formulario: 'programa', tenantId: null, campos: [] });
  });

  it('rejeita tenantId que não é UUID com 400', async () => {
    const { app, globalAdmin } = await setup();

    const response = await app.inject({ method: 'GET', url: `${CAMPOS_URL}?tenantId=abc`, headers: globalAdmin });
    expect(response.statusCode).toBe(400);
  });
});
