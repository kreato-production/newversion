import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('aplica defaults essenciais', () => {
    const result = parseEnv({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/kreato_local?schema=public',
      JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-chars',
      JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-chars',
    });

    expect(result).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3333,
      HOST: '0.0.0.0',
      CORS_ORIGIN: 'http://localhost:8080',
      LOG_LEVEL: 'info',
      JWT_ACCESS_TTL_SECONDS: 900,
      JWT_REFRESH_TTL_SECONDS: 604800,
    });
  });

  it('falha sem DATABASE_URL', () => {
    expect(() => parseEnv({
      JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-chars',
      JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-chars',
    })).toThrowError();
  });
});
