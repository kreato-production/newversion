import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackendAuthRepository, mapLoginError } from './auth.repository';

describe('BackendAuthRepository helpers', () => {
  it('converte username para email interno', () => {
    const repository = new BackendAuthRepository();

    expect(repository.usernameToEmail('Admin_Global')).toBe('admin_global@kreato.app');
  });

  it('normaliza o resultado de login para sucesso ou erro', () => {
    expect(mapLoginError({})).toEqual({ success: true });
    expect(mapLoginError({ error: 'Falha' })).toEqual({ success: false, error: 'Falha' });
  });
});

describe('BackendAuthRepository', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    global.fetch = originalFetch;
  });

  it('retorna dados do usuario ao autenticar via backend', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      user: {
        id: 'user-1',
        nome: 'Ana',
        email: 'ana@kreato.app',
        usuario: 'ana',
        tenantId: 'tenant-1',
        role: 'TENANT_ADMIN',
        perfil: 'Administrador Tenant',
        tipoAcesso: 'Operacional',
        unidadeIds: [],
        enabledModules: [],
        permissions: [],
      },
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
    }), { status: 200 }));

    const repository = new BackendAuthRepository();
    const result = await repository.signInWithPassword('ana', '123456');

    expect(result.user).toEqual(expect.objectContaining({ id: 'user-1', usuario: 'ana' }));
    expect(result.error).toBeUndefined();
  });

  it('usa o proxy autenticado do Next no login do browser', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      user: { id: 'u', nome: 'U', email: 'u@test.com', usuario: 'u', tenantId: null, role: 'USER', perfil: '', tipoAcesso: 'Operacional', unidadeIds: [], enabledModules: [], permissions: [] },
      accessToken: 'tok',
      refreshToken: 'ref',
    }), { status: 200 }));

    const repository = new BackendAuthRepository();
    await repository.signInWithPassword('u', 'pass');

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/proxy/auth/login',
      expect.objectContaining({ credentials: 'same-origin', method: 'POST' }),
    );
  });
});
