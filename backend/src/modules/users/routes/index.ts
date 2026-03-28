import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import { saveUserRelationSchema, saveUserSchema, UsersService } from '../users.service.js';
import type { AuthService } from '../../auth/auth.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export function createUsersRoutes(authService: AuthService, usersService: UsersService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/users', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const opts = listQuerySchema.parse(request.query);
      return reply.status(200).send(await usersService.list(user, opts));
    });

    app.post('/users', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveUserSchema.parse(request.body);
      return reply.status(200).send(await usersService.save(user, body));
    });

    app.put('/users/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveUserSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await usersService.save(user, body));
    });

    app.delete('/users/:id', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await usersService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/users/:id/unidades', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await usersService.listUnidades(user, params.id));
    });

    app.post('/users/:id/unidades', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveUserRelationSchema.parse(request.body);
      await usersService.addUnidade(user, params.id, body.targetId);
      return reply.status(204).send();
    });

    app.delete('/users/:id/unidades/:targetId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; targetId: string };
      await usersService.removeUnidade(user, params.id, params.targetId);
      return reply.status(204).send();
    });

    app.get('/users/:id/programas', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await usersService.listProgramas(user, params.id));
    });

    app.post('/users/:id/programas', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveUserRelationSchema.parse(request.body);
      await usersService.addPrograma(user, params.id, body.targetId);
      return reply.status(204).send();
    });

    app.delete('/users/:id/programas/:targetId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; targetId: string };
      await usersService.removePrograma(user, params.id, params.targetId);
      return reply.status(204).send();
    });

    app.get('/users/:id/equipes', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await usersService.listEquipes(user, params.id));
    });

    app.post('/users/:id/equipes', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveUserRelationSchema.parse(request.body);
      await usersService.addEquipe(user, params.id, body.targetId);
      return reply.status(204).send();
    });

    app.delete('/users/:id/equipes/:targetId', { preHandler: [authenticate, requireAdminRole, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; targetId: string };
      await usersService.removeEquipe(user, params.id, params.targetId);
      return reply.status(204).send();
    });
  };
}
