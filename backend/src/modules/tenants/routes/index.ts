import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireRole } from '../../../plugins/auth.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  saveTenantLicencaSchema,
  saveTenantModuloSchema,
  saveTenantSchema,
  saveTenantUnidadeSchema,
  TenantsService,
} from '../tenants.service.js';

export function createTenantsRoutes(authService: AuthService, tenantsService: TenantsService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireGlobalAdmin = createRequireRole(['GLOBAL_ADMIN']);

    app.get('/tenants', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      return reply.status(200).send(await tenantsService.list(request.user!));
    });

    app.post('/tenants', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const body = saveTenantSchema.parse(request.body);
      return reply.status(200).send(await tenantsService.save(request.user!, body));
    });

    app.put('/tenants/:id', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      const body = saveTenantSchema.parse({ ...(request.body as object), id: params.id });
      return reply.status(200).send(await tenantsService.save(request.user!, body));
    });

    app.delete('/tenants/:id', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      await tenantsService.remove(request.user!, params.id);
      return reply.status(204).send();
    });

    app.get('/tenants/:id/licencas', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      return reply.status(200).send(await tenantsService.listLicencas(request.user!, params.id));
    });

    app.post('/tenants/:id/licencas', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      const body = saveTenantLicencaSchema.parse(request.body);
      return reply.status(200).send(await tenantsService.addLicenca(request.user!, params.id, body));
    });

    app.delete('/tenants/:id/licencas/:licencaId', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string; licencaId: string };
      await tenantsService.removeLicenca(request.user!, params.id, params.licencaId);
      return reply.status(204).send();
    });

    app.get('/tenants/:id/modulos', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      return reply.status(200).send(await tenantsService.listModulos(request.user!, params.id));
    });

    app.post('/tenants/:id/modulos', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      const body = saveTenantModuloSchema.parse(request.body);
      await tenantsService.setModulo(request.user!, params.id, body);
      return reply.status(204).send();
    });

    app.get('/tenants/:id/unidades', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      return reply.status(200).send(await tenantsService.listUnidades(request.user!, params.id));
    });

    app.post('/tenants/:id/unidades', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string };
      const body = saveTenantUnidadeSchema.parse(request.body);
      return reply.status(200).send(await tenantsService.createUnidade(request.user!, params.id, body));
    });

    app.put('/tenants/:id/unidades/:unidadeId', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string; unidadeId: string };
      const body = saveTenantUnidadeSchema.parse(request.body);
      return reply.status(200).send(await tenantsService.updateUnidade(request.user!, params.id, params.unidadeId, body));
    });

    app.delete('/tenants/:id/unidades/:unidadeId', { preHandler: [authenticate, requireGlobalAdmin] }, async (request, reply) => {
      const params = request.params as { id: string; unidadeId: string };
      await tenantsService.removeUnidade(request.user!, params.id, params.unidadeId);
      return reply.status(204).send();
    });
  };
}
