import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { saveExpositorSchema, ExpositoresService } from '../expositores.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createExpositoresRoutes(
  authService: AuthService,
  expositoresService: ExpositoresService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    app.get('/expositores', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const query = listQuerySchema.parse(request.query);
      return reply.status(200).send(await expositoresService.list(user, query));
    });

    app.post('/expositores', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(
        await expositoresService.save(user, saveExpositorSchema.parse(request.body)),
      );
    });

    app.put('/expositores/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(
        await expositoresService.save(
          user,
          saveExpositorSchema.parse({ ...(request.body as object), id: params.id }),
        ),
      );
    });

    app.delete('/expositores/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await expositoresService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
