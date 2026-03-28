import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Check for auth cookie (presence only — validation happens at the backend)
  const hasToken = request.cookies.has('kreato_access_token');

  if (!hasToken) {
    const loginUrl = new URL('/login', request.url);
    // Pass the original path so Login can redirect back after auth
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals, static files, and API routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
