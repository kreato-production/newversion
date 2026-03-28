import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { ElencoService, saveElencoSchema, updateElencoSchema } from '../elenco.service.js';

export function createElencoRoutes(authService: AuthService, elencoService: ElencoService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/elenco/:entityType/:entityId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { entityType: 'gravacao' | 'conteudo'; entityId: string };
      return reply.status(200).send(await elencoService.list(user, params.entityType, params.entityId));
    });

    app.post('/elenco/:entityType/:entityId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { entityType: 'gravacao' | 'conteudo'; entityId: string };
      const body = saveElencoSchema.parse(request.body);
      return reply.status(200).send(await elencoService.add(user, params.entityType, params.entityId, body));
    });

    app.put('/elenco/:entityType/:entityId/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { entityType: 'gravacao' | 'conteudo'; entityId: string; itemId: string };
      const body = updateElencoSchema.parse(request.body);
      return reply.status(200).send(await elencoService.update(user, params.entityType, params.entityId, params.itemId, body));
    });

    app.delete('/elenco/:entityType/:entityId/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { entityType: 'gravacao' | 'conteudo'; entityId: string; itemId: string };
      await elencoService.remove(user, params.entityType, params.entityId, params.itemId);
      return reply.status(204).send();
    });
  };
}
