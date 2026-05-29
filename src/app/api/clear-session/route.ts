import { type NextRequest, NextResponse } from 'next/server';

// Emergency route to clear oversized session cookies that cause HTTP 431.
// Navigate directly to /api/clear-session in the browser address bar to reset cookies.
//
// CSRF protection: o header Sec-Fetch-Site (enviado por browsers modernos) identifica
// requests cross-site (ex: <img src> ou <a href> de outro domínio). Bloqueamos
// esses casos para impedir que um atacante force logout via link/imagem externa.
// Navegação direta (barra de endereços) e links same-site enviam 'none' ou 'same-origin'.

const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  'authjs.csrf-token',
  'authjs.callback-url',
  '__Secure-authjs.session-token',
  '__Secure-authjs.csrf-token',
  '__Host-authjs.csrf-token',
  'kreato_access_token',
  'kreato_refresh_token',
];

export function GET(req: NextRequest) {
  const fetchSite = req.headers.get('sec-fetch-site');

  if (fetchSite === 'cross-site') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL('/login', req.url));

  for (const name of SESSION_COOKIE_NAMES) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  }

  return response;
}
