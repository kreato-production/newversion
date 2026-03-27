import { describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import type { HealthService } from './health.presenter.js';

class UpHealthService implements HealthService {
  async checkReadiness() { return { database: 'up' as const }; }
}

class DownHealthService implements HealthService {
  async checkReadiness() { return { database: 'down' as const }; }
}

describe('health routes', () => {
  it('responde /ready com 200 quando database esta up', async () => {
    const app = await buildApp({ healthService: new UpHealthService() });
    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.objectContaining({ status: 'ready', checks: { database: 'up' } }));
    await app.close();
  });

  it('responde /ready com 503 quando database esta down', async () => {
    const app = await buildApp({ healthService: new DownHealthService() });
    const response = await app.inject({ method: 'GET', url: '/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual(expect.objectContaining({ status: 'degraded', checks: { database: 'down' } }));
    await app.close();
  });
});
