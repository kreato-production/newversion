import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { RecursosHumanosService, saveRecursoHumanoSchema } from '../recursos-humanos.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

const ocupacaoQuerySchema = z.object({
  dataInicio: z.string().min(1),
  dataFim: z.string().min(1),
});

export function createRecursosHumanosRoutes(authService: AuthService, recursosHumanosService: RecursosHumanosService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/recursos-humanos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await recursosHumanosService.list(user, opts));
    });

    app.get('/recursos-humanos/options', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await recursosHumanosService.listOptions(user));
    });

    app.get('/recursos-humanos/ocupacao', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const query = ocupacaoQuerySchema.parse(request.query);
      return reply.status(200).send(await recursosHumanosService.listOcupacoes(user, query.dataInicio, query.dataFim));
    });

    app.post('/recursos-humanos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveRecursoHumanoSchema.parse(request.body);
      return reply.status(200).send(await recursosHumanosService.save(user, body));
    });

    app.put('/recursos-humanos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveRecursoHumanoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await recursosHumanosService.save(user, body));
    });

    app.delete('/recursos-humanos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await recursosHumanosService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
