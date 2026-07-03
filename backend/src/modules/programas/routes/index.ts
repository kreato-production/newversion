import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import { createRequirePermission } from '../../../plugins/permissions.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { ProgramasService, saveProgramaSchema } from '../programas.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createProgramasRoutes(authService: AuthService, programasService: ProgramasService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireIncluir = createRequirePermission(authService, 'Produção', 'Programas', 'incluir');
    const requireAlterar = createRequirePermission(authService, 'Produção', 'Programas', 'alterar');
    const requireExcluir = createRequirePermission(authService, 'Produção', 'Programas', 'excluir');

    app.get('/programas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await programasService.list(user, opts));
    });

    app.post('/programas', { preHandler: [authenticate, requireTenantAccess, requireIncluir] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveProgramaSchema.parse(request.body);
      return reply.status(200).send(await programasService.save(user, body));
    });

    app.put('/programas/:id', { preHandler: [authenticate, requireTenantAccess, requireAlterar] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveProgramaSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await programasService.save(user, body));
    });

    app.delete('/programas/:id', { preHandler: [authenticate, requireTenantAccess, requireExcluir] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await programasService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
