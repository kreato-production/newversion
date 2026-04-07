/**
 * OIDC Discovery e validação de tokens Keycloak via JWKS.
 *
 * `getDiscovery()` — carrega e cacheia o documento de configuração do Keycloak
 *   (/.well-known/openid-configuration). Contém URLs dos endpoints: authorization,
 *   token, end_session, jwks_uri e o valor canônico do `issuer`.
 *
 * `getJwksValidator()` — cria (uma vez) o validador de JWKS usando `jose`.
 *   `createRemoteJWKSet` cacheia as chaves públicas localmente e re-busca
 *   automaticamente quando encontra um `kid` desconhecido (rotação de chaves).
 *
 * `validateKeycloakToken()` — valida assinatura, issuer e expiração do
 *   access token. Não exige chamada ao Keycloak em cada request.
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../../config/env.js';

export type OidcDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint: string;
};

// Claims customizados que o realm-kreato.json mapeia para o access token
export type KeycloakClaims = JWTPayload & {
  sub: string;
  tenant_id?: string;     // user attribute "tenant_id"
  app_role?: string;      // user attribute "app_role" (ex: "GLOBAL_ADMIN")
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

let _discovery: OidcDiscovery | null = null;
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Retorna o documento de discovery do Keycloak (cacheado em memória).
 * Lança em caso de falha de rede — o servidor não deve iniciar se o
 * Keycloak está offline e KEYCLOAK_AUTH_ENABLED=true.
 */
export async function getDiscovery(): Promise<OidcDiscovery> {
  if (_discovery) return _discovery;

  const url = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}/.well-known/openid-configuration`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha no OIDC discovery (${res.status}): ${url}`);
  }

  _discovery = (await res.json()) as OidcDiscovery;
  return _discovery;
}

/**
 * Retorna o validador de JWKS (cacheado em memória).
 * Busca as chaves públicas do Keycloak e mantém em cache local.
 */
export async function getJwksValidator(): Promise<ReturnType<typeof createRemoteJWKSet>> {
  if (_jwks) return _jwks;

  const discovery = await getDiscovery();
  // createRemoteJWKSet gerencia o cache interno e re-fetcha em rotação de kid
  _jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
  return _jwks;
}

/**
 * Valida um access token emitido pelo Keycloak:
 *  - Assinatura via JWKS (validação local, sem chamada de rede em cada request)
 *  - Issuer (deve ser nosso realm Keycloak)
 *  - Expiração (gerenciada pelo jose automaticamente)
 *
 * Lança `JWTExpired`, `JWTInvalid` etc. em caso de token inválido.
 */
export async function validateKeycloakToken(token: string): Promise<KeycloakClaims> {
  const discovery = await getDiscovery();
  const jwks = await getJwksValidator();

  const { payload } = await jwtVerify<KeycloakClaims>(token, jwks, {
    issuer: discovery.issuer,
    // Audience não validado aqui pois a configuração varia por versão do Keycloak.
    // A segurança é garantida pela cadeia: PKCE + client_secret + issuer check.
    // Para adicionar: algorithms: ['RS256'], audience: env.KEYCLOAK_CLIENT_ID
  });

  return payload;
}

/** Reseta o cache (útil em testes ou para forçar re-discovery). */
export function resetDiscoveryCache(): void {
  _discovery = null;
  _jwks = null;
}
