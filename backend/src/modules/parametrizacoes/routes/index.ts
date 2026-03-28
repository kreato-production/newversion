import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireRole, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import {
  ParametrizacoesService,
  saveCentroLucroSchema,
  saveCentroLucroUnidadesSchema,
  saveClassificacaoSchema,
  saveStatusGravacaoSchema,
  saveStatusTarefaSchema,
  saveTituloSchema,
  toggleInicialSchema,
} from '../parametrizacoes.service.js';

export function createParametrizacoesRoutes(authService: AuthService, parametrizacoesService: ParametrizacoesService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const requireAdminRole = createRequireRole(['GLOBAL_ADMIN', 'TENANT_ADMIN']);

    app.get('/parametrizacoes/status-gravacao', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.listStatusGravacao(user));
    });

    app.post('/parametrizacoes/status-gravacao', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.saveStatusGravacao(user, saveStatusGravacaoSchema.parse(request.body)));
    });

    app.put('/parametrizacoes/status-gravacao/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.saveStatusGravacao(user, saveStatusGravacaoSchema.parse({ ...(request.body as object), id: params.id })));
    });

    app.patch('/parametrizacoes/status-gravacao/:id/inicial', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = toggleInicialSchema.parse(request.body);
      return reply.status(200).send(await parametrizacoesService.toggleStatusGravacaoInicial(user, params.id, body.value));
    });

    app.delete('/parametrizacoes/status-gravacao/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await parametrizacoesService.removeStatusGravacao(user, params.id);
      return reply.status(204).send();
    });

    app.get('/parametrizacoes/status-tarefa', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.listStatusTarefa(user));
    });

    app.post('/parametrizacoes/status-tarefa', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.saveStatusTarefa(user, saveStatusTarefaSchema.parse(request.body)));
    });

    app.put('/parametrizacoes/status-tarefa/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.saveStatusTarefa(user, saveStatusTarefaSchema.parse({ ...(request.body as object), id: params.id })));
    });

    app.patch('/parametrizacoes/status-tarefa/:id/inicial', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = toggleInicialSchema.parse(request.body);
      return reply.status(200).send(await parametrizacoesService.toggleStatusTarefaInicial(user, params.id, body.value));
    });

    app.delete('/parametrizacoes/status-tarefa/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await parametrizacoesService.removeStatusTarefa(user, params.id);
      return reply.status(204).send();
    });

    app.get('/parametrizacoes/categorias-incidencia', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.listCategoriasIncidencia(user));
    });

    app.post('/parametrizacoes/categorias-incidencia', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.saveCategoriaIncidencia(user, saveTituloSchema.parse(request.body)));
    });

    app.put('/parametrizacoes/categorias-incidencia/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.saveCategoriaIncidencia(user, saveTituloSchema.parse({ ...(request.body as object), id: params.id })));
    });

    app.delete('/parametrizacoes/categorias-incidencia/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await parametrizacoesService.removeCategoriaIncidencia(user, params.id);
      return reply.status(204).send();
    });

    app.get('/parametrizacoes/categorias-incidencia/:id/classificacoes', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.listClassificacoesIncidencia(user, params.id));
    });

    app.post('/parametrizacoes/categorias-incidencia/:id/classificacoes', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.saveClassificacaoIncidencia(user, params.id, saveClassificacaoSchema.parse(request.body)));
    });

    app.put('/parametrizacoes/categorias-incidencia/:id/classificacoes/:classificacaoId', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; classificacaoId: string };
      return reply.status(200).send(await parametrizacoesService.saveClassificacaoIncidencia(user, params.id, saveClassificacaoSchema.parse({ ...(request.body as object), id: params.classificacaoId })));
    });

    app.delete('/parametrizacoes/categorias-incidencia/:id/classificacoes/:classificacaoId', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string; classificacaoId: string };
      await parametrizacoesService.removeClassificacaoIncidencia(user, params.id, params.classificacaoId);
      return reply.status(204).send();
    });

    app.get('/parametrizacoes/severidades-incidencia', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.listSeveridadesIncidencia(user));
    });

    app.post('/parametrizacoes/severidades-incidencia', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.saveSeveridadeIncidencia(user, saveTituloSchema.parse(request.body)));
    });

    app.put('/parametrizacoes/severidades-incidencia/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.saveSeveridadeIncidencia(user, saveTituloSchema.parse({ ...(request.body as object), id: params.id })));
    });

    app.delete('/parametrizacoes/severidades-incidencia/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await parametrizacoesService.removeSeveridadeIncidencia(user, params.id);
      return reply.status(204).send();
    });

    app.get('/parametrizacoes/impactos-incidencia', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.listImpactosIncidencia(user));
    });

    app.post('/parametrizacoes/impactos-incidencia', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.saveImpactoIncidencia(user, saveTituloSchema.parse(request.body)));
    });

    app.put('/parametrizacoes/impactos-incidencia/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.saveImpactoIncidencia(user, saveTituloSchema.parse({ ...(request.body as object), id: params.id })));
    });

    app.delete('/parametrizacoes/impactos-incidencia/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await parametrizacoesService.removeImpactoIncidencia(user, params.id);
      return reply.status(204).send();
    });

    app.get('/parametrizacoes/centros-lucro', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.listCentrosLucro(user));
    });

    app.post('/parametrizacoes/centros-lucro', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      return reply.status(200).send(await parametrizacoesService.saveCentroLucro(user, saveCentroLucroSchema.parse(request.body)));
    });

    app.put('/parametrizacoes/centros-lucro/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.saveCentroLucro(user, saveCentroLucroSchema.parse({ ...(request.body as object), id: params.id })));
    });

    app.delete('/parametrizacoes/centros-lucro/:id', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      await parametrizacoesService.removeCentroLucro(user, params.id);
      return reply.status(204).send();
    });

    app.get('/parametrizacoes/centros-lucro/:id/unidades', { preHandler: [authenticate, requireTenantAccess] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      return reply.status(200).send(await parametrizacoesService.listCentroLucroUnidades(user, params.id));
    });

    app.put('/parametrizacoes/centros-lucro/:id/unidades', { preHandler: [authenticate, requireTenantAccess, requireAdminRole] }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const params = request.params as { id: string };
      const body = saveCentroLucroUnidadesSchema.parse(request.body);
      await parametrizacoesService.saveCentroLucroUnidades(user, params.id, body.unidadeIds);
      return reply.status(204).send();
    });
  };
}
