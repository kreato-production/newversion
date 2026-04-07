import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { saveContaPagarSchema, ContasPagarService } from '../contas-pagar.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createContasPagarRoutes(
  authService: AuthService,
  contasPagarService: ContasPagarService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    app.get('/contas-pagar', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const query = listQuerySchema.parse(request.query);
      return reply.status(200).send(await contasPagarService.list(user, query));
    });

    app.post('/contas-pagar', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(
        await contasPagarService.save(user, saveContaPagarSchema.parse(request.body)),
      );
    });

    app.put('/contas-pagar/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(
        await contasPagarService.save(
          user,
          saveContaPagarSchema.parse({ ...(request.body as object), id: params.id }),
        ),
      );
    });

    app.delete('/contas-pagar/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await contasPagarService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
