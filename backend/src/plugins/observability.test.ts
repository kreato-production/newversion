import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import type { HealthService } from '../routes/health/health.presenter.js';

class UpHealthService implements HealthService {
  async checkReadiness() { return { database: 'up' as const }; }
}

describe('observability plugin', () => {
  it('injeta headers de rastreabilidade na resposta', async () => {
    const app = await buildApp({ healthService: new UpHealthService() });
    const response = await app.inject({ method: 'GET', url: '/health', headers: { 'x-request-id': 'req-test-123' } });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toBeTruthy();
    expect(response.headers['x-service-name']).toBe('kreato-backend');
    expect(response.headers['x-service-version']).toBe('0.1.0-test');

    await app.close();
  });
});
