import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { RecursosTecnicosService, saveRecursoTecnicoSchema } from '../recursos-tecnicos.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createRecursosTecnicosRoutes(authService: AuthService, recursosTecnicosService: RecursosTecnicosService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/recursos-tecnicos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await recursosTecnicosService.list(user, opts));
    });

    app.get('/recursos-tecnicos/options', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await recursosTecnicosService.listOptions(user));
    });

    app.post('/recursos-tecnicos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveRecursoTecnicoSchema.parse(request.body);
      return reply.status(200).send(await recursosTecnicosService.save(user, body));
    });

    app.put('/recursos-tecnicos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveRecursoTecnicoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await recursosTecnicosService.save(user, body));
    });

    app.delete('/recursos-tecnicos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await recursosTecnicosService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
