import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  GravacoesService,
  saveGravacaoConvidadoSchema,
  saveGravacaoFigurinoSchema,
  saveGravacaoSchema,
  saveGravacaoTerceiroSchema,
  updateGravacaoFigurinoSchema,
} from '../gravacoes.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createGravacoesRoutes(authService: AuthService, gravacoesService: GravacoesService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/gravacoes', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await gravacoesService.list(user, opts));
    });

    app.post('/gravacoes', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveGravacaoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.save(user, body));
    });

    app.put('/gravacoes/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await gravacoesService.save(user, body));
    });

    app.delete('/gravacoes/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await gravacoesService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/gravacoes/:id/figurinos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await gravacoesService.listFigurinos(user, params.id));
    });

    app.post('/gravacoes/:id/figurinos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoFigurinoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addFigurino(user, params.id, body));
    });

    app.put('/gravacoes/:id/figurinos/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      const body = updateGravacaoFigurinoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.updateFigurino(user, params.id, params.itemId, body));
    });

    app.delete('/gravacoes/:id/figurinos/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      await gravacoesService.removeFigurino(user, params.id, params.itemId);
      return reply.status(204).send();
    });

    app.get('/gravacoes/:id/terceiros', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await gravacoesService.listTerceiros(user, params.id));
    });

    app.post('/gravacoes/:id/terceiros', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoTerceiroSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addTerceiro(user, params.id, body));
    });

    app.delete('/gravacoes/:id/terceiros/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      await gravacoesService.removeTerceiro(user, params.id, params.itemId);
      return reply.status(204).send();
    });

    app.get('/gravacoes/:id/convidados', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await gravacoesService.listConvidados(user, params.id));
    });

    app.post('/gravacoes/:id/convidados', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoConvidadoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addConvidado(user, params.id, body));
    });

    app.delete('/gravacoes/:id/convidados/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      await gravacoesService.removeConvidado(user, params.id, params.itemId);
      return reply.status(204).send();
    });
  };
}
