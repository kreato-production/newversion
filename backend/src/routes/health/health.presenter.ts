import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';

export type HealthStatus = {
  status: 'ok';
  service: string;
  timestamp: string;
  version: string;
};

export type ReadinessStatus = {
  status: 'ready' | 'degraded';
  service: string;
  timestamp: string;
  version: string;
  checks: {
    database: 'up' | 'down';
  };
};

export interface HealthService {
  checkReadiness(): Promise<{ database: 'up' | 'down' }>;
}

export class PrismaHealthService implements HealthService {
  async checkReadiness(): Promise<{ database: 'up' | 'down' }> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { database: 'up' };
    } catch {
      return { database: 'down' };
    }
  }
}

export function buildHealthStatus(now = new Date()): HealthStatus {
  return {
    status: 'ok',
    service: env.SERVICE_NAME,
    timestamp: now.toISOString(),
    version: env.APP_VERSION,
  };
}

export function buildReadinessStatus(checks: { database: 'up' | 'down' }, now = new Date()): ReadinessStatus {
  return {
    status: checks.database === 'up' ? 'ready' : 'degraded',
    service: env.SERVICE_NAME,
    timestamp: now.toISOString(),
    version: env.APP_VERSION,
    checks,
  };
}
