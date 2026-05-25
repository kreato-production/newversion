import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { saveOrcamentoSchema, saveOrcamentoItemSchema, OrcamentoService } from '../orcamento.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

const anoQuerySchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100),
});

export function createOrcamentoRoutes(
  authService: AuthService,
  orcamentoService: OrcamentoService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const pre = [authenticate, requireTenantAccess];

    // ─── Orçamentos ───────────────────────────────────────────────────────────

    app.get('/orcamento', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const query = listQuerySchema.parse(request.query);
      return reply.status(200).send(await orcamentoService.list(user, query));
    });

    app.get('/orcamento/por-ano', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { ano } = anoQuerySchema.parse(request.query);
      return reply.status(200).send(await orcamentoService.listByAno(user, ano));
    });

    app.get('/orcamento/totais-por-ano', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { ano } = anoQuerySchema.parse(request.query);
      return reply.status(200).send(await orcamentoService.listTotaisPorAno(user, ano));
    });

    app.get('/orcamento/itens-por-ano', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { ano } = anoQuerySchema.parse(request.query);
      return reply.status(200).send(await orcamentoService.listItensPorAno(user, ano));
    });

    app.get('/orcamento/:id', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const item = await orcamentoService.getOrcamentoComItens(user, id);
      if (!item) return reply.status(404).send({ message: 'Orçamento não encontrado' });
      return reply.status(200).send(item);
    });

    app.post('/orcamento', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(
        await orcamentoService.save(user, saveOrcamentoSchema.parse(request.body)),
      );
    });

    app.put('/orcamento/:id', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      return reply.status(200).send(
        await orcamentoService.save(user, saveOrcamentoSchema.parse({ ...(request.body as object), id })),
      );
    });

    app.delete('/orcamento/:id', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      await orcamentoService.remove(user, id);
      return reply.status(204).send();
    });

    // ─── Itens ────────────────────────────────────────────────────────────────

    app.get('/orcamento/:id/itens', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      return reply.status(200).send(await orcamentoService.listItens(user, id));
    });

    app.post('/orcamento/:id/itens', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      return reply.status(200).send(
        await orcamentoService.saveItem(user, saveOrcamentoItemSchema.parse({ ...(request.body as object), orcamentoId: id })),
      );
    });

    app.put('/orcamento/:id/itens/:itemId', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id, itemId } = request.params as { id: string; itemId: string };
      return reply.status(200).send(
        await orcamentoService.saveItem(
          user,
          saveOrcamentoItemSchema.parse({ ...(request.body as object), id: itemId, orcamentoId: id }),
        ),
      );
    });

    app.delete('/orcamento/:id/itens/:itemId', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id, itemId } = request.params as { id: string; itemId: string };
      await orcamentoService.removeItem(user, itemId, id);
      return reply.status(204).send();
    });
  };
}
