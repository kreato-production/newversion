/**
 * Operações de troca e renovação de tokens com o Keycloak via HTTP.
 *
 * Usa fetch nativo (Node 18+) e envia os parâmetros como
 * application/x-www-form-urlencoded, conforme RFC 6749.
 */

export type KeycloakTokenResponse = {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;           // TTL do access token em segundos
  refresh_expires_in: number;   // TTL do refresh token em segundos
  session_state: string;
  scope: string;
};

type TokenError = {
  error: string;
  error_description?: string;
};

async function postToTokenEndpoint(
  tokenEndpoint: string,
  params: Record<string, string>,
): Promise<KeycloakTokenResponse> {
  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as TokenError;
    throw new Error(
      `Keycloak token endpoint error ${res.status}: ${body.error ?? 'unknown'} — ${body.error_description ?? ''}`,
    );
  }

  return res.json() as Promise<KeycloakTokenResponse>;
}

/**
 * Troca o authorization code por tokens (Authorization Code Flow + PKCE).
 * Chamado uma única vez no callback após o redirect do Keycloak.
 */
export async function exchangeCodeForTokens(opts: {
  tokenEndpoint: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<KeycloakTokenResponse> {
  return postToTokenEndpoint(opts.tokenEndpoint, {
    grant_type: 'authorization_code',
    code: opts.code,
    code_verifier: opts.codeVerifier,
    redirect_uri: opts.redirectUri,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
  });
}

/**
 * Renova o access token usando o refresh token armazenado na sessão.
 * Chamado proativamente pelo middleware quando o access token expira.
 */
export async function refreshKeycloakTokens(opts: {
  tokenEndpoint: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<KeycloakTokenResponse> {
  return postToTokenEndpoint(opts.tokenEndpoint, {
    grant_type: 'refresh_token',
    refresh_token: opts.refreshToken,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
  });
}
