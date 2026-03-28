import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import { EquipesService, saveEquipeMembroSchema, saveEquipeSchema } from '../equipes.service.js';
import type { AuthService } from '../../auth/auth.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createEquipesRoutes(authService: AuthService, equipesService: EquipesService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/equipes', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await equipesService.list(user, opts));
    });

    app.post('/equipes', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveEquipeSchema.parse(request.body);
      return reply.status(200).send(await equipesService.save(user, body));
    });

    app.put('/equipes/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveEquipeSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await equipesService.save(user, body));
    });

    app.delete('/equipes/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await equipesService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/equipes/:id/membros', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await equipesService.listMembros(user, params.id));
    });

    app.post('/equipes/:id/membros', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveEquipeMembroSchema.parse(request.body);
      return reply.status(200).send(await equipesService.addMembro(user, params.id, body.targetId));
    });

    app.delete('/equipes/:id/membros/:targetId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; targetId: string };
      await equipesService.removeMembro(user, params.id, params.targetId);
      return reply.status(204).send();
    });
  };
}
