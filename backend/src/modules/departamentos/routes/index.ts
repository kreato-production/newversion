import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { DepartamentosService, saveDepartamentoFuncaoSchema, saveDepartamentoSchema } from '../departamentos.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createDepartamentosRoutes(authService: AuthService, departamentosService: DepartamentosService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/departamentos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await departamentosService.list(user, opts));
    });

    app.post('/departamentos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveDepartamentoSchema.parse(request.body);
      return reply.status(200).send(await departamentosService.save(user, body));
    });

    app.put('/departamentos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveDepartamentoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await departamentosService.save(user, body));
    });

    app.delete('/departamentos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await departamentosService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/departamentos/:id/funcoes', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await departamentosService.listFuncoes(user, params.id));
    });

    app.post('/departamentos/:id/funcoes', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveDepartamentoFuncaoSchema.parse(request.body);
      return reply.status(200).send(await departamentosService.addFuncao(user, params.id, body.funcaoId));
    });

    app.delete('/departamentos/:id/funcoes/:associacaoId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; associacaoId: string };
      await departamentosService.removeFuncao(user, params.id, params.associacaoId);
      return reply.status(204).send();
    });
  };
}
