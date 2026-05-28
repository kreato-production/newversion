import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  saveEstadoEventoSchema,
  saveSateliteSchema,
  EstadosEventoService,
  SatelitesService,
} from '../satops.service.js';
import { saveJanelaSchema, JanelasService } from '../janelas.service.js';
import { saveAlertaSchema, AlertasService } from '../alertas.service.js';

const grelhaQuerySchema = z.object({
  canal: z.string().min(1),
  data: z.string().min(1),
});

export function createSatOpsRoutes(
  authService: AuthService,
  estadosEventoService: EstadosEventoService,
  satelitesService: SatelitesService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    // ── Estados de Evento ────────────────────────────────────────────────────

    app.get('/satops/estados-evento', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await estadosEventoService.list(user));
    });

    app.post('/satops/estados-evento', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(
        await estadosEventoService.save(user, saveEstadoEventoSchema.parse(request.body)),
      );
    });

    app.put('/satops/estados-evento/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(
        await estadosEventoService.save(
          user,
          saveEstadoEventoSchema.parse({ ...(request.body as object), id: params.id }),
        ),
      );
    });

    app.delete('/satops/estados-evento/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await estadosEventoService.remove(user, params.id);
      return reply.status(204).send();
    });

    // ── Satélites ────────────────────────────────────────────────────────────

    app.get('/satops/satelites', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await satelitesService.list(user));
    });

    app.post('/satops/satelites', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(
        await satelitesService.save(user, saveSateliteSchema.parse(request.body)),
      );
    });

    app.put('/satops/satelites/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(
        await satelitesService.save(
          user,
          saveSateliteSchema.parse({ ...(request.body as object), id: params.id }),
        ),
      );
    });

    app.delete('/satops/satelites/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await satelitesService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}

export function createAlertasRoutes(
  authService: AuthService,
  alertasService: AlertasService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    app.get('/satops/alertas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await alertasService.list(user));
    });

    app.post('/satops/alertas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(
        await alertasService.save(user, saveAlertaSchema.parse(request.body)),
      );
    });

    app.put('/satops/alertas/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(
        await alertasService.save(
          user,
          saveAlertaSchema.parse({ ...(request.body as object), id: params.id }),
        ),
      );
    });

    app.delete('/satops/alertas/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await alertasService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}

export function createJanelasRoutes(
  authService: AuthService,
  janelasService: JanelasService,
): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();

    // ── Helpers de Grelha ────────────────────────────────────────────────────

    app.get('/satops/janelas/canais', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await janelasService.listCanais(user));
    });

    app.get('/satops/janelas/programas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { canal, data } = grelhaQuerySchema.parse(request.query);
      return reply.status(200).send(await janelasService.listProgramas(user, canal, data));
    });

    // ── CRUD Janelas ─────────────────────────────────────────────────────────

    app.get('/satops/janelas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await janelasService.list(user));
    });

    app.post('/satops/janelas', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(
        await janelasService.save(user, saveJanelaSchema.parse(request.body)),
      );
    });

    app.put('/satops/janelas/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(
        await janelasService.save(
          user,
          saveJanelaSchema.parse({ ...(request.body as object), id: params.id }),
        ),
      );
    });

    app.delete('/satops/janelas/:id', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await janelasService.remove(user, params.id);
      return reply.status(204).send();
    });
  };
}
