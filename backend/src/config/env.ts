import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:8080'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must have at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must have at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  SERVICE_NAME: z.string().min(1).default('kreato-backend'),
  APP_VERSION: z.string().min(1).default('0.1.0'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(source);
}

function resolveEnvSource(source: Record<string, string | undefined>): Record<string, string | undefined> {
  if (source.NODE_ENV === 'test') {
    return {
      JWT_ACCESS_SECRET: 'test-access-secret-with-at-least-32-chars',
      JWT_REFRESH_SECRET: 'test-refresh-secret-with-at-least-32-chars',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/kreato_test?schema=public',
      ...source,
      SERVICE_NAME: 'kreato-backend',
      APP_VERSION: '0.1.0-test',
    };
  }

  return {
    SERVICE_NAME: source.SERVICE_NAME ?? 'kreato-backend',
    APP_VERSION: source.APP_VERSION ?? source.npm_package_version ?? '0.1.0',
    ...source,
  };
}

let cachedEnv: AppEnv | null = null;

export function getEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  if (source === process.env) {
    cachedEnv ??= parseEnv(resolveEnvSource(source));
    return cachedEnv;
  }

  return parseEnv(resolveEnvSource(source));
}

export const env = getEnv();
