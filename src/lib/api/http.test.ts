import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  apiRequest,
  getBackendBaseUrl,
  isBackendAuthProviderEnabled,
  isBackendDataProviderEnabled,
  refreshBackendSession,
} from './http';

describe('api/http', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env.NEXT_PUBLIC_DATA_PROVIDER = 'backend';
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'backend';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    global.fetch = originalFetch;
    delete process.env.NEXT_PUBLIC_DATA_PROVIDER;
    delete process.env.NEXT_PUBLIC_AUTH_PROVIDER;
  });

  it('usa a url padrao do backend e respeita as flags do ambiente atual', () => {
    expect(getBackendBaseUrl()).toBe('http://localhost:3333');
    expect(isBackendDataProviderEnabled()).toBe(true);
    expect(isBackendAuthProviderEnabled()).toBe(true);
  });

  it('envia requisicao com credentials include (cookie-based)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiRequest('/health');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3333/health',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('nao inclui header Authorization (autenticacao via cookie)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiRequest('/health');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init!.headers as Headers).has('Authorization')).toBe(false);
  });

  it('renova sessao quando recebe 401 e retrya a requisicao', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Token expirado' }), { status: 401 }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const response = await apiRequest<{ ok: boolean }>('/programas');

    expect(response).toEqual({ ok: true });
    expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3333/auth/refresh',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('refreshBackendSession retorna false quando refresh falha', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'falha' }), { status: 401 }),
    );

    const refreshed = await refreshBackendSession();

    expect(refreshed).toBe(false);
  });

  it('refreshBackendSession retorna true quando refresh bem sucedido', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    const refreshed = await refreshBackendSession();

    expect(refreshed).toBe(true);
  });
});
