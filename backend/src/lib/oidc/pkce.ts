/**
 * Helpers para Authorization Code Flow com PKCE (RFC 7636).
 *
 * PKCE (Proof Key for Code Exchange) protege o authorization code flow
 * contra interceptação do `code`. Mesmo que alguém capture o code na URL,
 * não consegue trocá-lo por tokens sem o `code_verifier` original.
 *
 * Fluxo:
 *   1. Gera code_verifier  (aleatório, guardado no backend)
 *   2. Calcula code_challenge = BASE64URL(SHA256(verifier))
 *   3. Envia code_challenge para o Keycloak no authorization request
 *   4. No callback, envia code_verifier junto com o code para validar
 */

import { randomBytes, createHash } from 'node:crypto';

/** Gera um code_verifier aleatório (43–128 chars, RFC 7636 §4.1). */
export function generateCodeVerifier(): string {
  // 32 bytes → 43 chars em base64url — dentro do intervalo permitido
  return randomBytes(32).toString('base64url');
}

/** Calcula o code_challenge a partir do code_verifier (método S256). */
export function generateCodeChallenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

/**
 * Gera um `state` aleatório para proteção anti-CSRF no fluxo OAuth.
 * O servidor valida que o state recebido no callback é igual ao enviado.
 */
export function generateState(): string {
  return randomBytes(16).toString('base64url');
}
