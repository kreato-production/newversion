import { ZodError } from 'zod';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { UserRole } from '@prisma/client';
import { AuthError, AuthService } from '../modules/auth/auth.service.js';
import { AccessError } from '../modules/common/access.js';
import { ACCESS_COOKIE } from '../modules/auth/routes/index.js';

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

  if (error instanceof Error) {
    request.log.error({ correlationId: request.correlationId, message: error.message, stack: error.stack }, 'unexpected_error');
    return reply.status(500).send({ message: 'Erro interno do servidor', correlationId: request.correlationId });
  }

  throw error;
}
