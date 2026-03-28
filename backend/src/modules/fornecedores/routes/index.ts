import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  addFornecedorArquivoSchema,
  addFornecedorServicoSchema,
  FornecedoresService,
  saveFornecedorSchema,
  updateFornecedorServicoSchema,
} from '../fornecedores.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createFornecedoresRoutes(authService: AuthService, fornecedoresService: FornecedoresService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/fornecedores', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await fornecedoresService.list(user, opts));
    });

    app.get('/fornecedores/options', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await fornecedoresService.listOptions(user));
    });

    app.post('/fornecedores', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveFornecedorSchema.parse(request.body);
      return reply.status(200).send(await fornecedoresService.save(user, body));
    });

    app.put('/fornecedores/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveFornecedorSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await fornecedoresService.save(user, body));
    });

    app.delete('/fornecedores/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await fornecedoresService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/fornecedores/:id/servicos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await fornecedoresService.listServicos(user, params.id));
    });

    app.post('/fornecedores/:id/servicos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = addFornecedorServicoSchema.parse(request.body);
      return reply.status(200).send(await fornecedoresService.addServico(user, params.id, body));
    });

    app.put('/fornecedores/:id/servicos/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      const body = updateFornecedorServicoSchema.parse(request.body);
      return reply.status(200).send(await fornecedoresService.updateServico(user, params.id, params.itemId, body));
    });

    app.delete('/fornecedores/:id/servicos/:itemId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; itemId: string };
      await fornecedoresService.removeServico(user, params.id, params.itemId);
      return reply.status(204).send();
    });

    app.get('/fornecedores/:id/arquivos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await fornecedoresService.listArquivos(user, params.id));
    });

    app.post('/fornecedores/:id/arquivos', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = addFornecedorArquivoSchema.parse(request.body);
      return reply.status(200).send(await fornecedoresService.addArquivo(user, params.id, body));
    });

    app.delete('/fornecedores/:id/arquivos/:arquivoId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; arquivoId: string };
      await fornecedoresService.removeArquivo(user, params.id, params.arquivoId);
      return reply.status(204).send();
    });
  };
}
