import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireRole } from '../../../plugins/auth.js';
import type { AuthService } from '../../auth/auth.service.js';
import { saveTenantSchema, TenantsService } from '../tenants.service.js';

export function createTenantsRoutes(authService: AuthService, tenantsService: TenantsService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireGlobalAdmin = createRequireRole(['GLOBAL_ADMIN']);

    app.get('/tenants', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      return reply.status(200).send(await tenantsService.list(request.user!));
    });

    app.post('/tenants', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const body = saveTenantSchema.parse(request.body);
      return reply.status(200).send(await tenantsService.save(request.user!, body));
    });

    app.put('/tenants/:id', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      const body = saveTenantSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await tenantsService.save(request.user!, body));
    });

    app.delete('/tenants/:id', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      await tenantsService.remove(request.user!, params.id);
      return reply.status(204).send();
    });
  };
}
