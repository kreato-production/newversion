const DEFAULT_BACKEND_URL = 'http://localhost:3333';

let refreshPromise: Promise<boolean> | null = null;

export function getBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_BACKEND_API_URL as string | undefined) || DEFAULT_BACKEND_URL;
}

export function isBackendAuthProviderEnabled() {
  return (process.env.NEXT_PUBLIC_AUTH_PROVIDER as string | undefined) === 'backend';
}

export function isKeycloakAuthEnabled() {
  return (process.env.NEXT_PUBLIC_KEYCLOAK_AUTH_ENABLED as string | undefined) === 'true';
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Erro ao comunicar com a API' }));
    throw new Error(payload.message || 'Erro ao comunicar com a API');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function fetchBackend(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${getBackendBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
  });
}

/**
 * No browser (client components), roteia via /api/proxy para que o Next.js
 * injete o X-Internal-Token com a sessão Auth.js antes de chamar o Fastify.
 *
 * No servidor (Server Components / Route Handlers), chama o Fastify direto.
 * Nesses contextos use fastifyFetch() de src/lib/api/fastify.ts que já injeta o token.
 */
function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  if (typeof window !== 'undefined') {
    // Browser: usa o proxy Next.js para autenticar via Auth.js session
    return fetch(`/api/proxy${path}`, {
      ...init,
      credentials: 'same-origin',
    });
  }
  // Servidor: chama Fastify direto (deve usar fastifyFetch com token explícito)
  return fetchBackend(path, init);
}

export async function refreshBackendSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetchBackend('/auth/refresh', { method: 'POST' });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function logoutBackendSession(): Promise<void> {
  await fetchBackend('/auth/logout', { method: 'POST' }).catch((): undefined => undefined);
}

export async function logoutKeycloakSession(): Promise<void> {
  await fetchBackend('/auth/logout/keycloak', { method: 'POST' }).catch((): undefined => undefined);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetchApi(path, { ...init, headers });

  // 401 via proxy significa que a sessão Auth.js expirou (middleware deveria já ter capturado)
  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      // Deixa o middleware/Auth.js lidar com a sessão expirada — não faz redirect manual
      // para evitar loops com o middleware que redireciona de volta ao dashboard
    }
    throw new Error('Sessão expirada');
  }

  return parseApiResponse<T>(response);
}
