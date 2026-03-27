import type { FastifyPluginAsync } from 'fastify';
import { buildHealthStatus, buildReadinessStatus, PrismaHealthService, type HealthService } from './health.presenter.js';

export function createHealthRoutes(healthService: HealthService = new PrismaHealthService()): FastifyPluginAsync {
  return async (app) => {
    app.get('/health', async (_request, reply) => {
      return reply.status(200).send(buildHealthStatus());
    });

    app.get('/ready', async (_request, reply) => {
      const checks = await healthService.checkReadiness();
      const payload = buildReadinessStatus(checks);
      const statusCode = payload.status === 'ready' ? 200 : 503;
      return reply.status(statusCode).send(payload);
    });
  };
}
