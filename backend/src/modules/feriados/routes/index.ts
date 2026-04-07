import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { FeriadosService, saveFeriadoSchema } from '../feriados.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createFeriadosRoutes(
  authService: AuthService,
  feriadosService: FeriadosService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/feriados', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await feriadosService.list(user, opts));
    });

    app.post(
      '/feriados',
      { preHandler: [authenticate, requireAdminRole, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const body = saveFeriadoSchema.parse(request.body);
        return reply.status(200).send(await feriadosService.save(user, body));
      },
    );

    app.put(
      '/feriados/:id',
      { preHandler: [authenticate, requireAdminRole, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const params = request.params as { id: string };
        const body = saveFeriadoSchema.parse({ ...(request.body as object), id: params.id });
        return reply.status(200).send(await feriadosService.save(user, body));
      },
    );

    app.delete(
      '/feriados/:id',
      { preHandler: [authenticate, requireAdminRole, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const params = request.params as { id: string };
        await feriadosService.remove(user, params.id);
        return reply.status(204).send();
      },
    );
  };
}
