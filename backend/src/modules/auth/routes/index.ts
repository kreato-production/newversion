import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { env } from '../../../config/env.js';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import { AuthService } from '../auth.service.js';

export const ACCESS_COOKIE = 'kreato_access_token';
export const REFRESH_COOKIE = 'kreato_refresh_token';

function setSessionCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  const secure = env.NODE_ENV === 'production';
  const cookieBase = { httpOnly: true, sameSite: 'strict' as const, secure, path: '/' };
  reply.setCookie(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: env.JWT_ACCESS_TTL_SECONDS });
  reply.setCookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: env.JWT_REFRESH_TTL_SECONDS });
}

const loginSchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export function createAuthRoutes(authService: AuthService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.post('/auth/login', {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '15 minutes',
          errorResponseBuilder: () => ({
            message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
          }),
        },
      },
    }, async (request, reply) => {
      const body = loginSchema.parse(request.body);
      const session = await authService.login(body.usuario, body.password);
      setSessionCookies(reply, session.accessToken, session.refreshToken);
      return reply.status(200).send(session);
    });

    app.post('/auth/refresh', {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '15 minutes',
          errorResponseBuilder: () => ({
            message: 'Muitas tentativas de refresh. Tente novamente em 15 minutos.',
          }),
        },
      },
    }, async (request, reply) => {
      const body = refreshSchema.parse(request.body);
      const tokenFromCookie = request.cookies?.[REFRESH_COOKIE];
      const refreshToken = body.refreshToken ?? tokenFromCookie;

      if (!refreshToken) {
        return reply.status(401).send({ message: 'Refresh token ausente' });
      }

      const session = await authService.refresh(refreshToken);
      setSessionCookies(reply, session.accessToken, session.refreshToken);
      return reply.status(200).send(session);
    });

    app.get('/auth/me', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      return reply.status(200).send({ user: request.user });
    });

    app.get('/auth/admin-access', { preHandler: [authenticate, requireAdminRole] }, async (_request, reply) => {
      return reply.status(200).send({ ok: true });
    });

    app.post('/auth/logout', async (_request, reply) => {
      reply.clearCookie(ACCESS_COOKIE, { path: '/' });
      reply.clearCookie(REFRESH_COOKIE, { path: '/' });
      return reply.status(200).send({ ok: true });
    });
  };
}
