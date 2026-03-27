const DEFAULT_BACKEND_URL = 'http://localhost:3333';

let refreshPromise: Promise<boolean> | null = null;

export function getBackendBaseUrl() {
  return (import.meta.env.VITE_BACKEND_API_URL as string | undefined) || DEFAULT_BACKEND_URL;
}

export function isBackendDataProviderEnabled() {
  return (import.meta.env.VITE_DATA_PROVIDER as string | undefined) === 'backend';
}

export function isBackendAuthProviderEnabled() {
  return (import.meta.env.VITE_AUTH_PROVIDER as string | undefined) === 'backend' || isBackendDataProviderEnabled();
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
  await fetchBackend('/auth/logout', { method: 'POST' }).catch(() => undefined);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetchBackend(path, { ...init, headers });

  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    const refreshed = await refreshBackendSession();

    if (refreshed) {
      const retryHeaders = new Headers(init?.headers);
      if (!retryHeaders.has('Content-Type') && init?.body) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      response = await fetchBackend(path, { ...init, headers: retryHeaders });
    }
  }

  return parseApiResponse<T>(response);
}
