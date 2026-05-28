import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/unauthorized', '/api/auth', '/_next', '/favicon.ico'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const hasAuthSession =
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token');
  const hasLegacyCookie =
    request.cookies.has('kreato_access_token') || request.cookies.has('kreato_session');

  if (hasAuthSession || hasLegacyCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
