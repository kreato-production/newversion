import { describe, expect, it } from 'vitest';
import { buildHealthStatus, buildReadinessStatus } from './health.presenter.js';

describe('health presenter', () => {
  it('monta payload de healthcheck consistente', () => {
    const now = new Date('2026-03-25T09:30:00.000Z');
    const result = buildHealthStatus(now);

    expect(result).toEqual({
      status: 'ok',
      service: 'kreato-backend',
      timestamp: '2026-03-25T09:30:00.000Z',
      version: '0.1.0-test',
    });
  });

  it('monta payload de readiness com checks', () => {
    const now = new Date('2026-03-25T09:30:00.000Z');
    const result = buildReadinessStatus({ database: 'up' }, now);

    expect(result).toEqual({
      status: 'ready',
      service: 'kreato-backend',
      timestamp: '2026-03-25T09:30:00.000Z',
      version: '0.1.0-test',
      checks: { database: 'up' },
    });
  });
});
