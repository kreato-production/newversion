import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { saveTemplateSchema, TemplatesService } from '../templates.service.js';

export function createTemplatesRoutes(
  authService: AuthService,
  templatesService: TemplatesService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    app.get(
      '/templates',
      { preHandler: [authenticate, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        return reply.status(200).send(await templatesService.list(user));
      },
    );

    app.get(
      '/templates/:id',
      { preHandler: [authenticate, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const { id } = request.params as { id: string };
        const item = await templatesService.findById(user, id);
        if (!item) return reply.status(404).send({ message: 'Template não encontrado' });
        return reply.status(200).send(item);
      },
    );

    app.post(
      '/templates',
      { preHandler: [authenticate, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const body = saveTemplateSchema.parse(request.body);
        return reply.status(200).send(await templatesService.save(user, body));
      },
    );

    app.put(
      '/templates/:id',
      { preHandler: [authenticate, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const { id } = request.params as { id: string };
        const body = saveTemplateSchema.parse({ ...(request.body as object), id });
        return reply.status(200).send(await templatesService.save(user, body));
      },
    );

    app.delete(
      '/templates/:id',
      { preHandler: [authenticate, requireTenantAccess] },
      async (request, reply) => {
        const { user } = request as AuthenticatedRequest;
        const { id } = request.params as { id: string };
        await templatesService.remove(user, id);
        return reply.status(204).send();
      },
    );
  };
}
