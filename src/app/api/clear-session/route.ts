import { type NextRequest, NextResponse } from 'next/server';

// Emergency route to clear oversized session cookies that cause HTTP 431.
// Visit /api/clear-session to wipe all auth cookies, then log in normally.
export function GET(_req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', _req.url));

  const cookieNames = [
    'authjs.session-token',
    'authjs.csrf-token',
    'authjs.callback-url',
    '__Secure-authjs.session-token',
    '__Secure-authjs.csrf-token',
    '__Host-authjs.csrf-token',
    'kreato_access_token',
    'kreato_refresh_token',
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  }

  return response;
}
