/**
 * Route handler do Auth.js v5.
 *
 * Processa todos os requests de autenticação:
 *  GET  /api/auth/session
 *  GET  /api/auth/csrf
 *  GET  /api/auth/providers
 *  GET  /api/auth/callback/:provider
 *  GET  /api/auth/signin/:provider
 *  POST /api/auth/signin/:provider
 *  POST /api/auth/signout
 */

// Garante que a rota seja sempre dinâmica (nunca pré-renderizada pelo Next.js).
// Sem isso, o Next.js 16 pode servir uma resposta HTML em cache no lugar de JSON.
export const dynamic = 'force-dynamic';

import { GET as authGET, POST as authPOST } from '@/auth-handlers';

export async function GET(request: Request) {
  try {
    return await authGET(request);
  } catch (err) {
    console.error('[auth] GET handler error:', err);
    return Response.json({ error: 'auth_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await authPOST(request);
  } catch (err) {
    console.error('[auth] POST handler error:', err);
    return Response.json({ error: 'auth_error' }, { status: 500 });
  }
}
