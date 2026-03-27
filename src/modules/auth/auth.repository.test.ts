import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackendAuthRepository, mapLoginError, SupabaseAuthRepository } from './auth.repository';

describe('SupabaseAuthRepository', () => {
  it('converte username para email interno', () => {
    const repository = new SupabaseAuthRepository({} as never);

    expect(repository.usernameToEmail('Admin_Global')).toBe('admin_global@kreato.app');
  });

  it('traduz erro padrao de login invalido', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    });

    const repository = new SupabaseAuthRepository({
      auth: {
        signInWithPassword,
      },
    } as never);

    const result = await repository.signInWithPassword('admin', '123456');

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@kreato.app',
      password: '123456',
    });
    expect(result).toEqual({
      session: null,
      user: null,
      error: 'Usuario ou senha invalidos',
    });
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

    const repository = new BackendAuthRepository({} as never);
    const result = await repository.signInWithPassword('ana', '123456');

    expect(result.user).toEqual(expect.objectContaining({ id: 'user-1', usuario: 'ana' }));
    expect(result.error).toBeUndefined();
  });

  it('usa credentials include na requisicao de login (cookie-based)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      user: { id: 'u', nome: 'U', email: 'u@test.com', usuario: 'u', tenantId: null, role: 'USER', perfil: '', tipoAcesso: 'Operacional', unidadeIds: [], enabledModules: [], permissions: [] },
      accessToken: 'tok',
      refreshToken: 'ref',
    }), { status: 200 }));

    const repository = new BackendAuthRepository({} as never);
    await repository.signInWithPassword('u', 'pass');

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
