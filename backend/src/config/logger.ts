import type { FastifyServerOptions } from 'fastify';
import { env } from './env.js';

export function createLoggerOptions(): FastifyServerOptions['logger'] {
  return {
    level: env.LOG_LEVEL,
  };
}
