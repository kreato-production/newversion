import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { EscalasService, saveEscalaSchema, saveColaboradoresSchema } from '../escalas.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createEscalasRoutes(
  authService: AuthService,
  escalasService: EscalasService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/escalas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await escalasService.list(user, opts));
    });

    app.post('/escalas', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveEscalaSchema.parse(request.body);
      return reply.status(200).send(await escalasService.save(user, body));
    });

    app.put('/escalas/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveEscalaSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await escalasService.save(user, body));
    });

    app.delete('/escalas/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await escalasService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/escalas/:id/colaboradores', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await escalasService.getColaboradores(user, params.id));
    });

    app.put('/escalas/:id/colaboradores', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveColaboradoresSchema.parse(request.body);
      return reply.status(200).send(await escalasService.saveColaboradores(user, params.id, body));
    });

    app.get('/escalas/opcoes/funcoes', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await escalasService.listFuncoes(user));
    });

    app.get('/escalas/opcoes/colaboradores', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { funcaoId } = request.query as { funcaoId?: string };
      if (!funcaoId) return reply.status(200).send([]);
      return reply.status(200).send(await escalasService.listColaboradoresByFuncao(user, funcaoId));
    });
  };
}
