/**
 * Rotas do fluxo BFF (Backend for Frontend) com Keycloak.
 *
 * GET  /auth/login
 *   Gera PKCE code_verifier + state, armazena em cookie temporário encriptado,
 *   redireciona o browser para o Keycloak (Authorization Endpoint).
 *
 * GET  /auth/callback
 *   Recebe o `code` do Keycloak após autenticação do usuário.
 *   Valida `state` (anti-CSRF), troca o code por tokens (PKCE),
 *   valida o access token (JWKS), faz upsert do usuário, cria sessão no banco,
 *   define o cookie de sessão opaco e redireciona para o frontend.
 *
 * POST /auth/logout/keycloak
 *   Remove a sessão do banco e limpa o cookie. Não expõe tokens ao browser.
 *
 * NUNCA expose o KEYCLOAK_CLIENT_SECRET ou os tokens Keycloak ao frontend.
 */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';
import { env } from '../../../config/env.js';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../../../lib/oidc/pkce.js';
import { getDiscovery, validateKeycloakToken, type KeycloakClaims } from '../../../lib/oidc/discovery.js';
import { exchangeCodeForTokens } from '../../../lib/oidc/token-exchange.js';
import { encryptToken, decryptToken } from '../../../lib/security/session-crypto.js';
import type { SessionRepository } from '../session.repository.js';
import type { AuthRepository } from '../auth.repository.js';

// Cookie transitório que carrega state + code_verifier durante o fluxo OAuth.
// HttpOnly + curto TTL (10 min) — deletado imediatamente após o callback.
const OAUTH_STATE_COOKIE = 'kreato_oauth_state';
const OAUTH_STATE_TTL_SECONDS = 600;

type OAuthStateCookie = {
  state: string;
  codeVerifier: string;
  redirectAfter: string;
};

function parsedRole(claim: string | undefined): UserRole {
  if (claim === 'GLOBAL_ADMIN' || claim === 'TENANT_ADMIN' || claim === 'USER') {
    return claim;
  }
  return 'USER';
}

async function upsertUserFromClaims(
  authRepository: AuthRepository,
  claims: KeycloakClaims,
): Promise<{ id: string; tenantId: string | null; role: UserRole }> {
  if (!authRepository.upsertUserFromKeycloak) {
    throw new Error('Repository não suporta upsertUserFromKeycloak');
  }

  return authRepository.upsertUserFromKeycloak({
    keycloakSub: claims.sub,
    email: claims.email ?? `${claims.sub}@keycloak.local`,
    nome: claims.name ?? claims.preferred_username ?? claims.sub,
    username: claims.preferred_username ?? claims.sub,
    tenantId: claims.tenant_id ?? null,
    role: parsedRole(claims.app_role),
  });
}

export function createOidcRoutes(
  sessionRepository: SessionRepository,
  authRepository: AuthRepository,
  sessionKey: Buffer,
): FastifyPluginAsync {
  return async (app) => {
    const redirectUri = `${env.BACKEND_PUBLIC_URL}/auth/callback`;
    const frontendBaseUrl = env.CORS_ORIGIN.split(',')[0].trim();
    const secure = env.NODE_ENV === 'production';
    const cookieBase = { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' };

    // ─── GET /auth/login ──────────────────────────────────────────────────────
    // Rate limit: evita que um atacante gere flood de state cookies
    app.get('/auth/login', {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' },
      },
    }, async (request, reply) => {
      const query = z.object({
        redirect_after: z.string().default('/'),
      }).parse(request.query);

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateState();

      // Persiste state + code_verifier em cookie encriptado (HttpOnly, 10 min)
      const stateCookie: OAuthStateCookie = {
        state,
        codeVerifier,
        redirectAfter: query.redirect_after,
      };
      reply.setCookie(OAUTH_STATE_COOKIE, encryptToken(sessionKey, JSON.stringify(stateCookie)), {
        ...cookieBase,
        maxAge: OAUTH_STATE_TTL_SECONDS,
      });

      const discovery = await getDiscovery();
      const authUrl = new URL(discovery.authorization_endpoint);
      authUrl.searchParams.set('client_id', env.KEYCLOAK_CLIENT_ID);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      return reply.redirect(authUrl.toString());
    });

    // ─── GET /auth/callback ───────────────────────────────────────────────────
    app.get('/auth/callback', {
      config: {
        rateLimit: { max: 20, timeWindow: '5 minutes' },
      },
    }, async (request, reply) => {
      const query = z.object({
        code: z.string().optional(),
        state: z.string().optional(),
        error: z.string().optional(),
        error_description: z.string().optional(),
      }).parse(request.query);

      // Keycloak devolveu erro (usuário cancelou, sessão expirou etc.)
      if (query.error) {
        app.log.warn({ error: query.error, description: query.error_description }, 'oidc_callback_keycloak_error');
        return reply.redirect(
          `${frontendBaseUrl}/login?error=${encodeURIComponent(query.error ?? 'oauth_error')}`,
        );
      }

      if (!query.code || !query.state) {
        return reply.status(400).send({ message: 'Parâmetros OAuth ausentes no callback.' });
      }

      // Recupera e decripta o state cookie (verifica se não expirou/foi adulterado)
      const rawStateCookie = request.cookies?.[OAUTH_STATE_COOKIE];
      if (!rawStateCookie) {
        app.log.warn({ ip: request.ip }, 'oidc_callback_missing_state_cookie');
        return reply.redirect(`${frontendBaseUrl}/login?error=session_expired`);
      }

      let stateCookie: OAuthStateCookie;
      try {
        stateCookie = JSON.parse(decryptToken(sessionKey, rawStateCookie)) as OAuthStateCookie;
      } catch (err) {
        app.log.warn({ err }, 'oidc_callback_invalid_state_cookie');
        return reply.status(400).send({ message: 'Estado OAuth inválido.' });
      }

      // Proteção CSRF: state deve bater com o gerado em /auth/login
      if (query.state !== stateCookie.state) {
        app.log.warn({ ip: request.ip }, 'oidc_callback_state_mismatch');
        return reply.status(400).send({ message: 'State inválido — possível ataque CSRF.' });
      }

      // Deleta o cookie de state imediatamente (uso único)
      reply.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

      // Troca o authorization code por tokens (PKCE)
      const discovery = await getDiscovery();
      let keycloakTokens;
      try {
        keycloakTokens = await exchangeCodeForTokens({
          tokenEndpoint: discovery.token_endpoint,
          code: query.code,
          codeVerifier: stateCookie.codeVerifier,
          redirectUri,
          clientId: env.KEYCLOAK_CLIENT_ID,
          clientSecret: env.KEYCLOAK_CLIENT_SECRET!,
        });
      } catch (err) {
        app.log.error({ err }, 'oidc_token_exchange_failed');
        return reply.redirect(`${frontendBaseUrl}/login?error=token_exchange_failed`);
      }

      // Valida o access token (assinatura + issuer + expiração)
      let claims: KeycloakClaims;
      try {
        claims = await validateKeycloakToken(keycloakTokens.access_token);
      } catch (err) {
        app.log.error({ err }, 'oidc_token_validation_failed');
        return reply.redirect(`${frontendBaseUrl}/login?error=token_invalid`);
      }

      // Upsert do usuário na base da aplicação
      let appUser: { id: string; tenantId: string | null; role: UserRole };
      try {
        appUser = await upsertUserFromClaims(authRepository, claims);
      } catch (err) {
        app.log.error({ err, sub: claims.sub }, 'oidc_user_upsert_failed');
        return reply.redirect(`${frontendBaseUrl}/login?error=user_sync_failed`);
      }

      // Cria a sessão no banco (tokens encriptados)
      const sessionTtlSeconds = keycloakTokens.refresh_expires_in ?? env.SESSION_TTL_SECONDS;
      const expiresAt = new Date(Date.now() + sessionTtlSeconds * 1000);

      const sessionId = await sessionRepository.createSession({
        userId: appUser.id,
        keycloakSub: claims.sub,
        accessToken: keycloakTokens.access_token,
        refreshToken: keycloakTokens.refresh_token,
        idToken: keycloakTokens.id_token,
        expiresAt,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      // Define o cookie de sessão opaco (browser nunca vê os tokens Keycloak)
      reply.setCookie(env.SESSION_COOKIE_NAME, sessionId, {
        ...cookieBase,
        maxAge: sessionTtlSeconds,
      });

      // Remove cookies do auth legado, se presentes (migração)
      reply.clearCookie('kreato_access_token', { path: '/' });
      reply.clearCookie('kreato_refresh_token', { path: '/' });

      app.log.info({ userId: appUser.id, sub: claims.sub }, 'oidc_login_success');

      return reply.redirect(`${frontendBaseUrl}${stateCookie.redirectAfter}`);
    });

    // ─── POST /auth/logout/keycloak ───────────────────────────────────────────
    app.post('/auth/logout/keycloak', async (request, reply) => {
      const sessionId = request.cookies?.[env.SESSION_COOKIE_NAME];

      if (sessionId) {
        await sessionRepository.deleteSession(sessionId);
      }

      reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });

      app.log.info({ sessionId }, 'oidc_logout');
      return reply.status(200).send({ ok: true });
    });
  };
}
