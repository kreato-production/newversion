import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import { createRequirePermission } from '../../../plugins/permissions.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { EspacosService, saveEspacoSchema } from '../espacos.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createEspacosRoutes(authService: AuthService, espacosService: EspacosService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireIncluir = createRequirePermission(authService, 'Recursos', 'Espaços', 'incluir');
    const requireAlterar = createRequirePermission(authService, 'Recursos', 'Espaços', 'alterar');
    const requireExcluir = createRequirePermission(authService, 'Recursos', 'Espaços', 'excluir');

    app.get('/espacos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await espacosService.list(user, opts));
    });

    app.post('/espacos', { preHandler: [authenticate, requireTenantAccess, requireIncluir] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveEspacoSchema.parse(request.body);
      return reply.status(200).send(await espacosService.save(user, body));
    });

    app.put('/espacos/:id', { preHandler: [authenticate, requireTenantAccess, requireAlterar] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveEspacoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await espacosService.save(user, body));
    });

    app.delete('/espacos/:id', { preHandler: [authenticate, requireTenantAccess, requireExcluir] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await espacosService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
