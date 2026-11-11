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
import { PessoasService } from '../pessoas.service.js';
import type {
  ClassificacaoPessoaOptionRecord,
  GravacaoParticipacaoRecord,
  PessoaRecord,
  PessoasRepository,
  SavePessoaInput,
} from '../pessoas.repository.js';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT_ID = '22222222-2222-2222-2222-222222222222';

class RouteAuthRepository implements AuthRepository {
  user: LoginUserRecord = {
    id: 'user-1',
    tenantId: TENANT_ID,
    nome: 'Ana Silva',
    email: 'ana@kreato.app',
    usuario: 'ana',
    role: 'TENANT_ADMIN' as UserRole,
    status: 'ATIVO' as UserStatus,
    passwordHash: hashPassword('123456'),
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

class InMemoryPessoasRepository implements PessoasRepository {
  items = new Map<string, PessoaRecord>();

  async listByTenant(tenantId: string) {
    const data = [...this.items.values()].filter((item) => item.tenantId === tenantId);
    return { data, total: data.length };
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async save(input: SavePessoaInput) {
    const item: PessoaRecord = {
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      codigoExterno: input.codigoExterno ?? null,
      nome: input.nome,
      sobrenome: input.sobrenome,
      nomeTrabalho: input.nomeTrabalho ?? null,
      foto: input.foto ?? null,
      dataNascimento: input.dataNascimento ?? null,
      sexo: input.sexo ?? null,
      telefone: input.telefone ?? null,
      email: input.email ?? null,
      classificacao: null,
      classificacaoId: input.classificacaoId ?? null,
      documento: input.documento ?? null,
      endereco: input.endereco ?? null,
      cidade: input.cidade ?? null,
      estado: input.estado ?? null,
      cep: input.cep ?? null,
      observacoes: input.observacoes ?? null,
      paisNascimento: input.paisNascimento ?? null,
      idiomaNativo: input.idiomaNativo ?? null,
      tags: input.tags ?? [],
      status: input.status ?? 'Ativo',
      createdAt: new Date('2026-11-10T12:00:00.000Z'),
      createdByNome: null,
    };
    this.items.set(item.id, item);
    return item;
  }

  async remove(id: string) {
    this.items.delete(id);
  }

  async listClassificacoes(): Promise<ClassificacaoPessoaOptionRecord[]> {
    return [];
  }

  async listTags(tenantId: string): Promise<string[]> {
    const tags = new Set<string>();
    for (const item of this.items.values()) {
      if (item.tenantId === tenantId) item.tags.forEach((tag) => tags.add(tag));
    }
    return [...tags].sort();
  }

  async listGravacoes(): Promise<GravacaoParticipacaoRecord[]> {
    return [];
  }
}

async function setup() {
  const authService = new AuthService(
    new RouteAuthRepository(),
    () => new Date('2026-04-08T10:00:00.000Z'),
  );
  const repository = new InMemoryPessoasRepository();
  const app = await buildApp({ authService, pessoasService: new PessoasService(repository) });

  const loginResponse = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { usuario: 'ana', password: '123456' },
  });
  const accessToken =
    loginResponse.cookies.find((c) => c.name === 'kreato_access_token')?.value ?? '';

  return { app, repository, headers: { authorization: `Bearer ${accessToken}` } };
}

describe('pessoas routes', () => {
  it('retorna uma pessoa pelo id', async () => {
    const { app, headers } = await setup();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/pessoas',
      headers,
      payload: { nome: 'Maria', sobrenome: 'Souza', email: 'maria@kreato.app' },
    });
    expect(createResponse.statusCode).toBe(200);
    const pessoaId = createResponse.json().id as string;

    const getResponse = await app.inject({ method: 'GET', url: `/pessoas/${pessoaId}`, headers });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toEqual(
      expect.objectContaining({
        id: pessoaId,
        nome: 'Maria',
        sobrenome: 'Souza',
        email: 'maria@kreato.app',
        status: 'Ativo',
      }),
    );

    await app.close();
  });

  it('salva país de nascimento, idioma nativo e tags normalizadas', async () => {
    const { app, headers } = await setup();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/pessoas',
      headers,
      payload: {
        nome: 'Lucía',
        sobrenome: 'Gómez',
        paisNascimento: 'Argentina',
        idiomaNativo: 'Espanhol',
        tags: [' Apresentadora ', 'bilíngue', 'apresentadora', '', 'Bilíngue'],
      },
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json()).toEqual(
      expect.objectContaining({
        paisNascimento: 'Argentina',
        idiomaNativo: 'Espanhol',
        tags: ['Apresentadora', 'bilíngue'],
      }),
    );

    const optionsResponse = await app.inject({ method: 'GET', url: '/pessoas/options', headers });
    expect(optionsResponse.json().tags).toEqual(['Apresentadora', 'bilíngue']);

    await app.close();
  });

  it('retorna campos novos vazios quando não informados', async () => {
    const { app, headers } = await setup();

    const response = await app.inject({
      method: 'POST',
      url: '/pessoas',
      headers,
      payload: { nome: 'Maria', sobrenome: 'Souza' },
    });

    expect(response.json()).toEqual(
      expect.objectContaining({ paisNascimento: '', idiomaNativo: '', tags: [] }),
    );
    await app.close();
  });

  it('rejeita mais tags que o limite', async () => {
    const { app, headers } = await setup();

    const response = await app.inject({
      method: 'POST',
      url: '/pessoas',
      headers,
      payload: {
        nome: 'Maria',
        sobrenome: 'Souza',
        tags: Array.from({ length: 31 }, (_, i) => `tag-${i}`),
      },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('retorna 404 para pessoa inexistente', async () => {
    const { app, headers } = await setup();

    const response = await app.inject({
      method: 'GET',
      url: '/pessoas/33333333-3333-3333-3333-333333333333',
      headers,
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it('bloqueia acesso a pessoa de outro tenant', async () => {
    const { app, repository, headers } = await setup();
    const outra = await repository.save({
      tenantId: OTHER_TENANT_ID,
      nome: 'Joao',
      sobrenome: 'Lima',
    } as SavePessoaInput);

    const response = await app.inject({ method: 'GET', url: `/pessoas/${outra.id}`, headers });

    expect(response.statusCode).toBe(403);
    await app.close();
  });
});
