import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { RecursosFisicosService, saveRecursoFisicoSchema } from '../recursos-fisicos.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createRecursosFisicosRoutes(authService: AuthService, recursosFisicosService: RecursosFisicosService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);
    const ocupacaoQuerySchema = z.object({
      dataInicio: z.string().min(1),
      dataFim: z.string().min(1),
    });

    app.get('/recursos-fisicos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await recursosFisicosService.list(user, opts));
    });

    app.get('/recursos-fisicos/ocupacao', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const query = ocupacaoQuerySchema.parse(request.query);
      return reply.status(200).send(await recursosFisicosService.listOcupacoes(user, query.dataInicio, query.dataFim));
    });

    app.post('/recursos-fisicos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveRecursoFisicoSchema.parse(request.body);
      return reply.status(200).send(await recursosFisicosService.save(user, body));
    });

    app.put('/recursos-fisicos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveRecursoFisicoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await recursosFisicosService.save(user, body));
    });

    app.delete('/recursos-fisicos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await recursosFisicosService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
