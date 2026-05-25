import type { FastifyPluginAsync } from 'fastify';
import { createAuthenticate, createRequireTenantAccess } from '../../../plugins/auth.js';
import type { AuthenticatedRequest } from '../../../fastify.js';
import type { AuthService } from '../../auth/auth.service.js';
import { z } from 'zod';
import { GrelhaProgramacaoService, updateStatusPlaneamentoSchema } from '../grelha-programacao.service.js';
import { prisma } from '../../../lib/prisma.js';

export function createGrelhaProgramacaoRoutes(authService: AuthService, service: GrelhaProgramacaoService): FastifyPluginAsync {
  return async (app) => {
    const authenticate = createAuthenticate(authService);
    const requireTenantAccess = createRequireTenantAccess();
    const pre = [authenticate, requireTenantAccess];

    // ── Diagnóstico: sem auth — acesso directo pelo browser para debug ──
    app.get('/grelha-programacao/diagnostico', async (request, reply) => {
      const q = request.query as Record<string, string>;
      const tenantId = q.tenantId ?? '';
      const logs: string[] = [];
      try {
        const rows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
          `SELECT COUNT(*)::bigint AS total FROM grelha_programa WHERE tenant_id = '${tenantId.replace(/'/g, "''")}'`,
        );
        logs.push(`Registos na tabela: ${rows[0]?.total ?? 0}`);
      } catch (e) {
        logs.push(`ERRO ao contar registos: ${String(e)}`);
      }
      try {
        const testId = 'DIAG-TEST-ID-9999';
        await prisma.$executeRawUnsafe(`
          INSERT INTO grelha_programa (id, tenant_id, maestro_id, api_id, nome, tem_alteracao, created_at, updated_at)
          VALUES ('${testId}', '${tenantId.replace(/'/g, "''")}', 'DIAG', 'DIAG-TEST-API-9999', 'TESTE DIAGNÓSTICO', false, NOW(), NOW())
          ON CONFLICT (tenant_id, api_id) DO UPDATE SET updated_at = NOW()
        `);
        logs.push('Upsert de teste: OK');
        await prisma.$executeRawUnsafe(`DELETE FROM grelha_programa WHERE api_id = 'DIAG-TEST-API-9999'`);
        logs.push('Limpeza do teste: OK');
      } catch (e) {
        logs.push(`ERRO no upsert de teste: ${String(e)}`);
      }
      return reply.status(200).send({ tenantId, logs });
    });

    // ── Sync directo: aceita o body raw da API e corre o sync sem passar pelo Maestro ──
    app.post('/grelha-programacao/sync-directo', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const tenantId = user.tenantId ?? '';
      const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
      try {
        const count = await service.syncFromApiResponse(tenantId, 'DIRECTO', rawBody);
        return reply.status(200).send({ sincronizados: count, tenantId });
      } catch (err) {
        return reply.status(500).send({ erro: String(err) });
      }
    });

    app.get('/grelha-programacao', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const q = request.query as Record<string, string>;
      const opts = {
        limit: q.limit ? Number(q.limit) : undefined,
        offset: q.offset ? Number(q.offset) : undefined,
        mes: q.mes ? Number(q.mes) : undefined,
        ano: q.ano ? Number(q.ano) : undefined,
        canal: q.canal || undefined,
      };
      return reply.status(200).send(await service.list(user, opts));
    });

    app.get('/grelha-programacao/:id', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const record = await service.getById(user, id);
      if (!record) return reply.status(404).send({ error: 'Não encontrado' });
      return reply.status(200).send(record);
    });

    app.patch('/grelha-programacao/:id/status-planeamento', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const body = updateStatusPlaneamentoSchema.parse(request.body);
      return reply.status(200).send(await service.updateStatusPlaneamento(user, id, body.statusPlaneamentoId));
    });

    app.patch('/grelha-programacao/:id/alteracao-vista', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      await service.marcarAlteracaoVista(user, id);
      return reply.status(204).send();
    });

    app.patch('/grelha-programacao/:id/gravacao', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const body = z.object({ gravacaoId: z.string().nullable() }).parse(request.body);
      return reply.status(200).send(await service.linkGravacao(user, id, body.gravacaoId));
    });

    app.delete('/grelha-programacao/:id', { preHandler: pre }, async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      await service.remove(user, id);
      return reply.status(204).send();
    });
  };
}
