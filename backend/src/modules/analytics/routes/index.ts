import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import type { AnalyticsService } from '../analytics.service.js';

export function createAnalyticsRoutes(authService: AuthService, analyticsService: AnalyticsService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    app.get(
      '/dashboard/overview',
      { preHandler: [authenticate, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        return reply.status(200).send(await analyticsService.getDashboardOverview(user));
      },
    );

    app.get(
      '/gravacoes/:id/report',
      { preHandler: [authenticate, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const params = request.params as { id: string };
        return reply.status(200).send(await analyticsService.getGravacaoReport(user, params.id));
      },
    );
  };
}
