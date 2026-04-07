import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { UserRole } from '@prisma/client';
import { AuthError, AuthService } from '../modules/auth/auth.service.js';
import { AccessError } from '../modules/common/access.js';
import { ACCESS_COOKIE } from '../modules/auth/routes/index.js';
import { tryAuthenticateInternalToken } from './internal-auth.js';

function getAccessToken(request: FastifyRequest): string {
  const authorization = request.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  const cookie = request.cookies?.[ACCESS_COOKIE];
  if (cookie) return cookie;

  throw new AuthError('Token de acesso ausente', 401);
}

export function createAuthenticate(authService: AuthService): preHandlerHookHandler {
  return async (request) => {
    // 1. Keycloak session hook ou Internal Token já podem ter populado request.user.
    if (request.user) return;

    // 2. Tenta autenticar via X-Internal-Token (chamadas server-side do Next.js).
    //    É mais eficiente que JWT: não consulta o banco, payload já validado.
    const authenticatedByInternalToken = await tryAuthenticateInternalToken(request);
    if (authenticatedByInternalToken) return;

    // 3. Fallback: JWT legado via cookie ou Authorization header.
    const accessToken = getAccessToken(request);
    request.user = await authService.authenticateAccessToken(accessToken);
  };
}

export function createRequireRole(roles: UserRole[]): preHandlerHookHandler {
  return async (request) => {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new AuthError('Permissao insuficiente', 403);
    }
  };
}

export function createRequireTenantAccess(): preHandlerHookHandler {
  return async (request) => {
    if (!request.user) {
      throw new AuthError('Usuario nao autenticado', 401);
    }

    if (request.user.role !== 'GLOBAL_ADMIN' && !request.user.tenantId) {
      throw new AuthError('Contexto de tenant ausente', 403);
    }
  };
}

export async function authErrorHandler(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    request.log.warn({ correlationId: request.correlationId, issues: error.flatten() }, 'validation_error');
    return reply.status(400).send({ message: 'Payload invalido', issues: error.flatten(), correlationId: request.correlationId });
  }

  if (error instanceof AuthError || error instanceof AccessError) {
    request.log.warn({ correlationId: request.correlationId, message: error.message }, 'domain_error');
    return reply.status(error.statusCode).send({ message: error.message, correlationId: request.correlationId });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    request.log.warn({ correlationId: request.correlationId, meta: error.meta }, 'unique_constraint_violation');
    return reply.status(409).send({ message: 'Já existe um registro com este nome.', correlationId: request.correlationId });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    request.log.warn({ correlationId: request.correlationId, meta: error.meta }, 'record_not_found');
    return reply.status(404).send({ message: 'Registro não encontrado.', correlationId: request.correlationId });
  }

  if (error instanceof Error) {
    request.log.error({ correlationId: request.correlationId, message: error.message, stack: error.stack }, 'unexpected_error');
    return reply.status(500).send({ message: 'Erro interno do servidor', correlationId: request.correlationId });
  }

  throw error;
}
