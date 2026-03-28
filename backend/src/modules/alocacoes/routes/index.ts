import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  AlocacoesService,
  allocationConflictQuerySchema,
  saveAllocationAnchorSchema,
  saveAllocationColaboradorSchema,
  saveAllocationHorarioSchema,
} from '../alocacoes.service.js';

export function createAlocacoesRoutes(authService: AuthService, alocacoesService: AlocacoesService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/gravacoes/:id/alocacoes', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await alocacoesService.listByGravacao(user, params.id));
    });

    app.get('/gravacoes/:id/alocacoes/conflitos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const query = allocationConflictQuerySchema.parse(request.query);
      return reply.status(200).send(await alocacoesService.listConflicts(user, params.id, query.tipo, query.recursoId));
    });

    app.post('/gravacoes/:id/alocacoes', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveAllocationAnchorSchema.parse(request.body);
      return reply.status(200).send(await alocacoesService.addAnchor(user, params.id, body));
    });

    app.patch('/gravacoes/:id/alocacoes/:allocationId', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; allocationId: string };
      const body = saveAllocationHorarioSchema.parse(request.body);
      return reply.status(200).send(await alocacoesService.updateHorario(user, params.id, params.allocationId, body));
    });

    app.post('/gravacoes/:id/alocacoes/:allocationId/colaboradores', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; allocationId: string };
      const body = saveAllocationColaboradorSchema.parse(request.body);
      return reply.status(200).send(await alocacoesService.addColaborador(user, params.id, params.allocationId, body));
    });

    app.delete('/gravacoes/:id/alocacoes/:allocationId', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; allocationId: string };
      await alocacoesService.removeAllocation(user, params.id, params.allocationId);
      return reply.status(204).send();
    });

    app.get('/alocacoes/overview', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await alocacoesService.listOverview(user));
    });
  };
}
