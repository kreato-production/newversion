import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  addIncidenciaAnexoSchema,
  IncidenciasGravacaoService,
  saveIncidenciaGravacaoSchema,
} from '../incidencias-gravacao.service.js';

export function createIncidenciasGravacaoRoutes(
  authService: AuthService,
  incidenciasService: IncidenciasGravacaoService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/incidencias-gravacao', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await incidenciasService.list(user));
    });

    app.get('/gravacoes/:id/incidencias', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await incidenciasService.listByGravacao(user, params.id));
    });

    app.post('/incidencias-gravacao', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const body = saveIncidenciaGravacaoSchema.parse(request.body);
      return reply.status(200).send(await incidenciasService.save(user, body));
    });

    app.put('/incidencias-gravacao/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveIncidenciaGravacaoSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await incidenciasService.save(user, body));
    });

    app.delete('/incidencias-gravacao/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await incidenciasService.remove(user, params.id);
      return reply.status(204).send();
    });

    app.get('/incidencias-gravacao/:id/anexos', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await incidenciasService.listAnexos(user, params.id));
    });

    app.post('/incidencias-gravacao/:id/anexos', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = addIncidenciaAnexoSchema.parse(request.body);
      return reply.status(200).send(await incidenciasService.addAnexo(user, params.id, body));
    });

    app.delete('/incidencias-gravacao/:id/anexos/:anexoId', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; anexoId: string };
      await incidenciasService.removeAnexo(user, params.id, params.anexoId);
      return reply.status(204).send();
    });
  };
}
