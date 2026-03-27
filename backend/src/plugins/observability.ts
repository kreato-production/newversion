import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

export const observabilityPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request) => {
    request.startedAt = Date.now();
    request.correlationId = request.headers['x-request-id']?.toString() || request.id || randomUUID();
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.correlationId);
    reply.header('x-service-name', env.SERVICE_NAME);
    reply.header('x-service-version', env.APP_VERSION);
    return payload;
  });

  app.addHook('onResponse', async (request, reply) => {
    const durationMs = Date.now() - request.startedAt;
    request.log.info({
      correlationId: request.correlationId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs,
    }, 'request_completed');
  });
};
