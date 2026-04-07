/**
 * Internal Service Token — Next.js → Fastify.
 *
 * Quando o Next.js (server-side) precisa chamar o Fastify,
 * assina um JWT de curta duração com o contexto do usuário autenticado.
 *
 * O Fastify valida este token via backend/src/plugins/internal-auth.ts.
 *
 * Nunca é exposto ao browser — apenas servidor Next.js → servidor Fastify.
 *
 * Payload:
 *  sub      → userId
 *  role     → papel do usuário
 *  tenantId → tenant do usuário (null para GLOBAL_ADMIN)
 *  iss      → "kreato-nextjs" (identifica o emissor)
 *  exp      → 30 segundos (uso único por request)
 */

import { SignJWT, jwtVerify } from 'jose';

const SECRET = process.env.INTERNAL_SERVICE_SECRET;
const ISSUER = 'kreato-nextjs';
const AUDIENCE = 'kreato-fastify';
const TTL_SECONDS = 30;

function getKey(): Uint8Array {
  if (!SECRET || SECRET.length < 32) {
    throw new Error(
      'INTERNAL_SERVICE_SECRET ausente ou muito curto (mínimo 32 chars). ' +
      'Gere com: openssl rand -hex 32',
    );
  }
  return new TextEncoder().encode(SECRET);
}

export type InternalTokenPayload = {
  sub: string;       // userId
  role: string;      // KreatoUserRole
  tenantId: string | null;
};

/**
 * Assina um token de serviço interno para autenticar chamadas ao Fastify.
 * Validade: 30 segundos.
 */
export async function signInternalToken(payload: InternalTokenPayload): Promise<string> {
  return new SignJWT({
    role: payload.role,
    tenantId: payload.tenantId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getKey());
}

/**
 * Verifica e decodifica um internal token (usado no Fastify).
 * Lança erro se inválido ou expirado.
 */
export async function verifyInternalToken(token: string): Promise<InternalTokenPayload & { sub: string }> {
  const { payload } = await jwtVerify(token, getKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  return {
    sub: payload.sub as string,
    role: payload['role'] as string,
    tenantId: (payload['tenantId'] as string | null) ?? null,
  };
}
