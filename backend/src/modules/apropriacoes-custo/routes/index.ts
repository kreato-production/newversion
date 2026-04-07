import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { ApropriacoesCustoService } from '../apropriacoes-custo.service.js';

const querySchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  centroLucroId: z.string().optional().nullable(),
  unidadeId: z.string().optional().nullable(),
});

export function createApropriacoesCustoRoutes(
  authService: AuthService,
  service: ApropriacoesCustoService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    app.get(
      '/financeiro/apropriacoes-custo',
      { preHandler: [authenticate, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const query = querySchema.parse(request.query);
        return reply.status(200).send(await service.getApropriacoes(user, query));
      },
    );
  };
}
