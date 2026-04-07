/**
 * Cliente HTTP para chamadas server-side do Next.js ao Fastify.
 *
 * NUNCA importe este arquivo em componentes client ('use client').
 * Use apenas em Server Components, Server Actions e Route Handlers.
 *
 * Todas as chamadas são autenticadas via X-Internal-Token.
 * O Fastify valida o token e popula request.user sem depender de cookies.
 */

import { auth } from '@/auth';
import { signInternalToken } from '@/lib/internal-token';

const FASTIFY_URL =
  process.env.INTERNAL_FASTIFY_URL ?? 'http://localhost:3333';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  /** Se false, não injeta o token de autenticação (para endpoints públicos) */
  authenticated?: boolean;
};

// ─── fastifyFetch ─────────────────────────────────────────────────────────────

/**
 * Faz uma chamada autenticada ao Fastify a partir do Next.js (server-side).
 *
 * @param path  Caminho da API (ex: '/unidades')
 * @param options  Opções do fetch (method, body, etc)
 */
export async function fastifyFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { authenticated = true, headers: extraHeaders = {}, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (authenticated) {
    const session = await auth();

    if (!session?.user) {
      throw new Error('fastifyFetch: sessão não encontrada. Use apenas em contexto autenticado.');
    }

    const token = await signInternalToken({
      sub: session.user.id,
      role: session.user.role ?? 'USER',
      tenantId: session.user.tenantId,
    });

    headers['X-Internal-Token'] = token;
  }

  const response = await fetch(`${FASTIFY_URL}${path}`, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Erro na API' }));
    const error = new Error(
      (payload as { message?: string }).message ?? `HTTP ${response.status}`,
    );
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
