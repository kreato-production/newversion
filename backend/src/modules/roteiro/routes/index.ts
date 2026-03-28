import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { RoteiroService, roteiroQuerySchema, saveCenaSchema } from '../roteiro.service.js';

export function createRoteiroRoutes(authService: AuthService, roteiroService: RoteiroService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/gravacoes/:id/roteiro', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const query = roteiroQuerySchema.parse(request.query);
      return reply.status(200).send(await roteiroService.list(user, params.id, query.conteudoId));
    });

    app.post('/gravacoes/:id/roteiro/cenas', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveCenaSchema.parse(request.body);
      return reply.status(200).send(await roteiroService.saveCena(user, params.id, body));
    });

    app.put('/gravacoes/:id/roteiro/cenas/:sceneId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; sceneId: string };
      const body = saveCenaSchema.parse({ ...(request.body as object), id: params.sceneId });
      return reply.status(200).send(await roteiroService.saveCena(user, params.id, body));
    });

    app.delete('/gravacoes/:id/roteiro/cenas/:sceneId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; sceneId: string };
      await roteiroService.removeCena(user, params.id, params.sceneId);
      return reply.status(204).send();
    });
  };
}
