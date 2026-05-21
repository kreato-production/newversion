import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  GravacoesService,
  gravacaoEspacoResourceTypeSchema,
  saveGravacaoConvidadoSchema,
  saveGravacaoDespesaSchema,
  saveGravacaoEspacoSchema,
  saveGravacaoEspacoResourceSchema,
  saveGravacaoFigurinoSchema,
  saveGravacaoSchema,
  saveGravacaoTerceiroSchema,
  updateGravacaoEspacoSchema,
  updateGravacaoEspacoResourceSchema,
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

    app.get('/gravacoes', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await gravacoesService.list(user, opts));
    });

    app.post('/gravacoes', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveGravacaoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.save(user, body));
    });

    app.put('/gravacoes/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await gravacoesService.save(user, body));
    });

    app.delete('/gravacoes/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
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

    app.post('/gravacoes/:id/figurinos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoFigurinoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addFigurino(user, params.id, body));
    });

    app.put('/gravacoes/:id/figurinos/:itemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      const body = updateGravacaoFigurinoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.updateFigurino(user, params.id, params.itemId, body));
    });

    app.delete('/gravacoes/:id/figurinos/:itemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
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

    app.post('/gravacoes/:id/terceiros', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoTerceiroSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addTerceiro(user, params.id, body));
    });

    app.delete('/gravacoes/:id/terceiros/:itemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
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

    app.post('/gravacoes/:id/convidados', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoConvidadoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addConvidado(user, params.id, body));
    });

    app.delete('/gravacoes/:id/convidados/:itemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      await gravacoesService.removeConvidado(user, params.id, params.itemId);
      return reply.status(204).send();
    });

    app.get('/gravacoes/:id/espacos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await gravacoesService.listEspacos(user, params.id));
    });

    app.post('/gravacoes/:id/espacos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoEspacoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addEspaco(user, params.id, body));
    });

    app.put('/gravacoes/:id/espacos/:itemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      const body = updateGravacaoEspacoSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.updateEspaco(user, params.id, params.itemId, body));
    });

    app.delete('/gravacoes/:id/espacos/:itemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      await gravacoesService.removeEspaco(user, params.id, params.itemId);
      return reply.status(204).send();
    });

    app.get('/gravacoes/:id/espacos/:espacoItemId/recursos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; espacoItemId: string };
      const query = request.query as { tipo?: string };
      const tipo = gravacaoEspacoResourceTypeSchema.parse(query.tipo ?? 'fisico');
      return reply.status(200).send(await gravacoesService.listEspacoResources(user, params.id, params.espacoItemId, tipo));
    });

    app.post('/gravacoes/:id/espacos/:espacoItemId/recursos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; espacoItemId: string };
      const query = request.query as { tipo?: string };
      const tipo = gravacaoEspacoResourceTypeSchema.parse(query.tipo ?? 'fisico');
      const body = saveGravacaoEspacoResourceSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addEspacoResource(user, params.id, params.espacoItemId, tipo, body));
    });

    app.put('/gravacoes/:id/espacos/:espacoItemId/recursos/:resourceItemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; espacoItemId: string; resourceItemId: string };
      const query = request.query as { tipo?: string };
      const tipo = gravacaoEspacoResourceTypeSchema.parse(query.tipo ?? 'fisico');
      const body = updateGravacaoEspacoResourceSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.updateEspacoResource(user, params.id, params.espacoItemId, params.resourceItemId, tipo, body));
    });

    app.delete('/gravacoes/:id/espacos/:espacoItemId/recursos/:resourceItemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; espacoItemId: string; resourceItemId: string };
      const query = request.query as { tipo?: string };
      const tipo = gravacaoEspacoResourceTypeSchema.parse(query.tipo ?? 'fisico');
      await gravacoesService.removeEspacoResource(user, params.id, params.espacoItemId, params.resourceItemId, tipo);
      return reply.status(204).send();
    });

    app.get('/gravacoes/:id/custos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await gravacoesService.getCustos(user, params.id));
    });

    app.get('/gravacoes/:id/recursos-espacos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await gravacoesService.listEspacoRecursosSummary(user, params.id));
    });

    app.get('/gravacoes/:id/despesas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await gravacoesService.listDespesas(user, params.id));
    });

    app.post('/gravacoes/:id/despesas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveGravacaoDespesaSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.addDespesa(user, params.id, body));
    });

    app.put('/gravacoes/:id/despesas/:itemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      const body = saveGravacaoDespesaSchema.parse(request.body);
      return reply.status(200).send(await gravacoesService.updateDespesa(user, params.id, params.itemId, body));
    });

    app.delete('/gravacoes/:id/despesas/:itemId', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      await gravacoesService.removeDespesa(user, params.id, params.itemId);
      return reply.status(204).send();
    });
  };
}
