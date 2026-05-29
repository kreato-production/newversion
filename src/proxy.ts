import { NextResponse } from 'next/server';
import { auth } from '@/auth-edge';

const PUBLIC_PREFIXES = ['/login', '/unauthorized', '/api/auth', '/_next', '/favicon.ico'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

// auth() valida a assinatura do JWT no cookie — request.auth é null quando
// o cookie está ausente, expirado ou foi forjado com valor arbitrário.
export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (request.auth?.user?.id) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon\\.png|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif)$).*)',
  ],
};
