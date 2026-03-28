import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { ParametrosService, saveParametroSchema } from '../parametros.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createParametrosRoutes(authService: AuthService, parametrosService: ParametrosService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/parametros/:storageKey', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { storageKey: string };
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await parametrosService.list(user, params.storageKey, opts));
    });

    app.post('/parametros/:storageKey', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { storageKey: string };
      const body = saveParametroSchema.parse(request.body);
      return reply.status(200).send(await parametrosService.save(user, params.storageKey, body));
    });

    app.put('/parametros/:storageKey/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { storageKey: string; id: string };
      const body = saveParametroSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await parametrosService.save(user, params.storageKey, body));
    });

    app.delete('/parametros/:storageKey/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { storageKey: string; id: string };
      await parametrosService.remove(user, params.storageKey, params.id);
      return reply.status(204).send();
    });
  };
}
