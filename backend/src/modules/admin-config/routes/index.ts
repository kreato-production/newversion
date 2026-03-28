import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { AdminConfigService, saveFormularioCamposSchema, savePerfilPermissionsSchema } from '../admin-config.service.js';

const perfilParamsSchema = z.object({
  perfilId: z.string().uuid(),
});

const formularioParamsSchema = z.object({
  formularioId: z.string().min(1),
});

export function createAdminConfigRoutes(authService: AuthService, adminConfigService: AdminConfigService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get(
      '/admin-config/perfis/:perfilId/permissoes',
      { preHandler: [authenticate, requireAdminRole, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const params = perfilParamsSchema.parse(request.params);
        return reply.status(200).send(await adminConfigService.getPerfilPermissions(user, params.perfilId));
      },
    );

    app.put(
      '/admin-config/perfis/:perfilId/permissoes',
      { preHandler: [authenticate, requireAdminRole, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const params = perfilParamsSchema.parse(request.params);
        const body = savePerfilPermissionsSchema.parse(request.body);
        await adminConfigService.savePerfilPermissions(user, params.perfilId, body);
        return reply.status(204).send();
      },
    );

    app.get(
      '/admin-config/formularios/:formularioId/campos',
      { preHandler: [authenticate, requireAdminRole, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const params = formularioParamsSchema.parse(request.params);
        return reply.status(200).send(await adminConfigService.getFormularioCampos(user, params.formularioId));
      },
    );

    app.put(
      '/admin-config/formularios/:formularioId/campos',
      { preHandler: [authenticate, requireAdminRole, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const params = formularioParamsSchema.parse(request.params);
        const body = saveFormularioCamposSchema.parse(request.body);
        await adminConfigService.saveFormularioCampos(user, params.formularioId, body);
        return reply.status(204).send();
      },
    );
  };
}
