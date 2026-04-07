/**
 * Validação do Internal Service Token — Next.js → Fastify.
 *
 * Quando o Next.js chama o Fastify server-side, envia um JWT de curta
 * duração no header `X-Internal-Token`. Este plugin valida o token
 * e popula `request.user` sem precisar de cookies ou banco de dados.
 *
 * Isso substitui a autenticação via cookie para chamadas originadas do
 * servidor Next.js, mantendo o mesmo contrato que o createAuthenticate existente.
 *
 * Fluxo:
 *  1. `createAuthenticate` (plugins/auth.ts) verifica se `request.user` já está preenchido
 *  2. Se não, verifica header `X-Internal-Token`
 *  3. Se válido, popula `request.user` com os dados do token
 *  4. Se inválido/ausente, continua para verificar cookie JWT legado
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { jwtVerify } from 'jose';
import type { UserRole } from '@prisma/client';

const ISSUER = 'kreato-nextjs';
const AUDIENCE = 'kreato-fastify';
const HEADER = 'x-internal-token';

function getKey(): Uint8Array {
  const secret = process.env.INTERNAL_SERVICE_SECRET;

  if (!secret || secret.length < 32) {
    // Em produção, esta variável DEVE estar configurada.
    // Em desenvolvimento sem Next.js, apenas ignoramos.
    return new Uint8Array(0);
  }

  return new TextEncoder().encode(secret);
}

type InternalTokenPayload = {
  sub: string;
  role: UserRole;
  tenantId: string | null;
};

/**
 * Tenta autenticar o request via X-Internal-Token.
 * Retorna true se autenticou com sucesso, false se não havia token ou era inválido.
 *
 * Não lança — falhas são silenciosas para permitir fallback ao JWT legado.
 */
export async function tryAuthenticateInternalToken(
  request: FastifyRequest,
): Promise<boolean> {
  const token = request.headers[HEADER];

  if (!token || typeof token !== 'string') {
    return false;
  }

  const key = getKey();
  if (key.length === 0) {
    request.log.warn('INTERNAL_SERVICE_SECRET não configurado — X-Internal-Token ignorado');
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const { sub, role, tenantId } = payload as unknown as InternalTokenPayload & { sub: string };

    // Popula request.user com os dados mínimos do SessionUser.
    // getAuthorizationContext não é chamado aqui para manter a latência baixa.
    // O Next.js já carregou o contexto completo na sessão Auth.js.
    request.user = {
      id: sub,
      tenantId: (tenantId as string | null) ?? null,
      role: (role as UserRole) ?? 'USER',
      email: '',       // não disponível no token — use se precisar consultar o banco
      usuario: '',
      nome: '',
      perfil: '',
      tipoAcesso: 'Operacional',
      unidadeIds: [],
      enabledModules: [],
      permissions: [],
    };

    return true;
  } catch (err) {
    request.log.warn({ err }, 'internal_token_validation_failed');
    return false;
  }
}
