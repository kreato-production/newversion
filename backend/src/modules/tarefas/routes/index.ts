import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { saveTarefaSchema, TarefasService } from '../tarefas.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createTarefasRoutes(authService: AuthService, tarefasService: TarefasService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    app.get('/tarefas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const query = listQuerySchema.parse(request.query);
      return reply.status(200).send(await tarefasService.list(user, query));
    });

    app.get('/tarefas/options', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await tarefasService.listOptions(user));
    });

    app.get('/gravacoes/:id/tarefas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await tarefasService.listByGravacao(user, params.id));
    });

    app.post('/tarefas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await tarefasService.save(user, saveTarefaSchema.parse(request.body)));
    });

    app.put('/tarefas/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await tarefasService.save(user, saveTarefaSchema.parse({ ...(request.body as object), id: params.id })));
    });

    app.delete('/tarefas/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await tarefasService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
