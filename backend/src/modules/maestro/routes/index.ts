import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import { createRequirePermission } from '../../../plugins/permissions.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { MaestroService, saveMaestroSchema } from '../maestro.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createMaestroRoutes(authService: AuthService, maestroService: MaestroService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const pre = [authenticate, requireTenantAccess];
    const requireIncluir = createRequirePermission(authService, 'Administração', 'Maestro', 'incluir');
    const requireAlterar = createRequirePermission(authService, 'Administração', 'Maestro', 'alterar');
    const requireExcluir = createRequirePermission(authService, 'Administração', 'Maestro', 'excluir');

    app.get('/maestro', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const query = listQuerySchema.parse(request.query);
      return reply.status(200).send(await maestroService.list(user, query));
    });

    app.get('/maestro/:id', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const item = await maestroService.getById(user, id);
      if (!item) return reply.status(404).send({ message: 'Maestro não encontrado' });
      return reply.status(200).send(item);
    });

    app.post('/maestro', { preHandler: [...pre, requireIncluir] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveMaestroSchema.parse(request.body);
      return reply.status(200).send(await maestroService.save(user, body));
    });

    app.put('/maestro/:id', { preHandler: [...pre, requireAlterar] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const body = saveMaestroSchema.parse({ ...(request.body as object), id });
      return reply.status(200).send(await maestroService.save(user, body));
    });

    app.delete('/maestro/:id', { preHandler: [...pre, requireExcluir] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      await maestroService.remove(user, id);
      return reply.status(204).send();
    });

    app.post('/maestro/:id/executar', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const result = await maestroService.execute(user, id);
      return reply.status(200).send(result);
    });
  };
}
