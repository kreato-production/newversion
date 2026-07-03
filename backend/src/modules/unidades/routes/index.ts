import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import { createRequirePermission } from '../../../plugins/permissions.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import { saveUnidadeSchema, UnidadesService } from '../unidades.service.js';
import type { AuthService } from '../../auth/auth.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createUnidadesRoutes(authService: AuthService, unidadesService: UnidadesService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);
    const requireIncluir = createRequirePermission(authService, 'Administração', 'Unidades de Negócio', 'incluir');
    const requireAlterar = createRequirePermission(authService, 'Administração', 'Unidades de Negócio', 'alterar');
    const requireExcluir = createRequirePermission(authService, 'Administração', 'Unidades de Negócio', 'excluir');

    app.get('/unidades', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await unidadesService.list(user, opts));
    });

    app.post('/unidades', { preHandler: [authenticate, requireAdminRole, requireTenantAccess, requireIncluir] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveUnidadeSchema.parse(request.body);
      return reply.status(200).send(await unidadesService.save(user, body));
    });

    app.put('/unidades/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess, requireAlterar] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveUnidadeSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await unidadesService.save(user, body));
    });

    app.delete('/unidades/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess, requireExcluir] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await unidadesService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
