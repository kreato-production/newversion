import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  saveTabelaPrecoRecursoSchema,
  saveTabelaPrecoSchema,
  TabelasPrecoService,
} from '../tabelas-preco.service.js';

const tipoParamsSchema = z.object({
  tipo: z.enum(['tecnico', 'fisico']),
});

export function createTabelasPrecoRoutes(authService: AuthService, tabelasPrecoService: TabelasPrecoService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/tabelas-preco', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await tabelasPrecoService.list(user));
    });

    app.get('/tabelas-preco/options', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await tabelasPrecoService.listOptions(user));
    });

    app.post('/tabelas-preco', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveTabelaPrecoSchema.parse(request.body);
      return reply.status(200).send(await tabelasPrecoService.save(user, body));
    });

    app.put('/tabelas-preco/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveTabelaPrecoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await tabelasPrecoService.save(user, body));
    });

    app.delete('/tabelas-preco/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await tabelasPrecoService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/tabelas-preco/:id/recursos/:tipo', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; tipo: string };
      const parsed = tipoParamsSchema.parse({ tipo: params.tipo });
      return reply.status(200).send(await tabelasPrecoService.listRecursos(user, params.id, parsed.tipo));
    });

    app.post('/tabelas-preco/:id/recursos/:tipo', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; tipo: string };
      const parsedParams = tipoParamsSchema.parse({ tipo: params.tipo });
      const body = saveTabelaPrecoRecursoSchema.parse({ ...(request.body as object), tipo: parsedParams.tipo });
      return reply.status(200).send(await tabelasPrecoService.addRecurso(user, params.id, body));
    });

    app.delete('/tabelas-preco/:id/recursos/:tipo/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; tipo: string; itemId: string };
      const parsed = tipoParamsSchema.parse({ tipo: params.tipo });
      await tabelasPrecoService.removeRecurso(user, params.id, params.itemId, parsed.tipo);
      return reply.status(204).send();
    });
  };
}
