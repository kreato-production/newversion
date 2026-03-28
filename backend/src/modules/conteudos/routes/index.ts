import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  ConteudosService,
  conteudoResourceTypeSchema,
  saveConteudoResourceSchema,
  saveConteudoSchema,
  saveConteudoTerceiroSchema,
  updateConteudoResourceSchema,
  updateConteudoTerceiroSchema,
} from '../conteudos.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createConteudosRoutes(authService: AuthService, conteudosService: ConteudosService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);
    const resourceQuerySchema = z.object({
      tipo: conteudoResourceTypeSchema,
      tabelaPrecoId: z.string().optional(),
    });

    app.get('/conteudos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await conteudosService.list(user, opts));
    });

    app.get('/conteudos/options', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await conteudosService.listOptions(user));
    });

    app.post('/conteudos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveConteudoSchema.parse(request.body);
      return reply.status(200).send(await conteudosService.save(user, body));
    });

    app.put('/conteudos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveConteudoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await conteudosService.save(user, body));
    });

    app.delete('/conteudos/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await conteudosService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/conteudos/:id/recursos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const query = resourceQuerySchema.parse(request.query);
      return reply.status(200).send(await conteudosService.listResources(user, params.id, query.tipo, query.tabelaPrecoId));
    });

    app.post('/conteudos/:id/recursos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const query = z.object({ tipo: conteudoResourceTypeSchema }).parse(request.query);
      const body = saveConteudoResourceSchema.parse(request.body);
      return reply.status(200).send(await conteudosService.addResource(user, params.id, query.tipo, body));
    });

    app.put('/conteudos/:id/recursos/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      const query = z.object({ tipo: conteudoResourceTypeSchema }).parse(request.query);
      const body = updateConteudoResourceSchema.parse(request.body);
      return reply.status(200).send(await conteudosService.updateResource(user, params.itemId, query.tipo, body));
    });

    app.delete('/conteudos/:id/recursos/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      const query = z.object({ tipo: conteudoResourceTypeSchema }).parse(request.query);
      await conteudosService.removeResource(user, params.itemId, query.tipo);
      return reply.status(204).send();
    });

    app.get('/conteudos/:id/terceiros', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await conteudosService.listTerceiros(user, params.id));
    });

    app.post('/conteudos/:id/terceiros', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveConteudoTerceiroSchema.parse(request.body);
      return reply.status(200).send(await conteudosService.addTerceiro(user, params.id, body));
    });

    app.put('/conteudos/:id/terceiros/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      const body = updateConteudoTerceiroSchema.parse(request.body);
      return reply.status(200).send(await conteudosService.updateTerceiro(user, params.itemId, body));
    });

    app.delete('/conteudos/:id/terceiros/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      await conteudosService.removeTerceiro(user, params.itemId);
      return reply.status(204).send();
    });

    app.post('/conteudos/:id/gerar-gravacoes', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await conteudosService.generateGravacoes(user, params.id));
    });
  };
}
