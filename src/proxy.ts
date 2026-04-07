/**
 * Middleware de proteção de rotas — Auth.js v5.
 *
 * Usa auth-edge.ts (sem Prisma) para funcionar no Edge Runtime.
 * Apenas valida a presença e assinatura do JWT — lógica de negócio fica
 * nas pages via requireRole() com a config completa (auth.ts).
 */

import { auth } from '@/auth-edge';
import { NextResponse } from 'next/server';

const PUBLIC_PREFIXES = [
  '/login',
  '/unauthorized',
  '/api/auth',
  '/_next',
  '/favicon.ico',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export default auth(function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    if (pathname.startsWith('/login') && request.auth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Sessão Auth.js válida
  if (request.auth) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = request.auth.user as any;
    const headers = new Headers(request.headers);
    headers.set('x-kreato-user-id', user?.id ?? '');
    headers.set('x-kreato-user-role', user?.role ?? 'USER');
    headers.set('x-kreato-tenant-id', user?.tenantId ?? '');
    return NextResponse.next({ request: { headers } });
  }

  // ── LEGACY FALLBACK (remover após migração completa) ──────────────────────
  const hasLegacyCookie =
    request.cookies.has('kreato_access_token') ||
    request.cookies.has('kreato_session');

  if (hasLegacyCookie) {
    return NextResponse.next();
  }
  // ── FIM DO LEGACY FALLBACK ────────────────────────────────────────────────

  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
