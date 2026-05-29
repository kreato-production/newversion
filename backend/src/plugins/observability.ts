import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

// Aceita apenas UUIDs v4 canônicos (8-4-4-4-12 hex, case-insensitive).
// Qualquer outro valor no header X-Request-ID é descartado para evitar
// log injection e header injection por valores com \n, \r ou JSON.
const REQUEST_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeRequestId(value: string | string[] | undefined, fallback: string): string {
  if (!value) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  return REQUEST_ID_REGEX.test(raw) ? raw : fallback;
}

export const observabilityPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request) => {
    request.startedAt = Date.now();
    request.correlationId = sanitizeRequestId(
      request.headers['x-request-id'],
      request.id || randomUUID(),
    );
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
