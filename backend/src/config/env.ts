import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // ─── Aplicação ──────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:8080'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SERVICE_NAME: z.string().min(1).default('kreato-backend'),
  APP_VERSION: z.string().min(1).default('0.1.0'),

  // ─── Auth legado (JWT customizado) ──────────────────────────────────────────
  // Mantido enquanto LEGACY_AUTH_ENABLED=true. Remover após migração completa.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must have at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must have at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(604800),

  // ─── Feature flags de migração ──────────────────────────────────────────────
  // KEYCLOAK_AUTH_ENABLED: ativa o fluxo BFF com Keycloak.
  // LEGACY_AUTH_ENABLED:   mantém o fluxo JWT customizado ativo em paralelo.
  // Durante a migração: ambos true. Após migração: Keycloak=true, Legacy=false.
  KEYCLOAK_AUTH_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  LEGACY_AUTH_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),

  // ─── Keycloak OIDC ──────────────────────────────────────────────────────────
  // Obrigatórios quando KEYCLOAK_AUTH_ENABLED=true. Validados em runtime pelo
  // assertKeycloakConfig() chamado em app.ts para não quebrar deploys atuais.
  KEYCLOAK_URL: z.string().url().optional(),
  KEYCLOAK_REALM: z.string().min(1).default('kreato'),
  KEYCLOAK_CLIENT_ID: z.string().min(1).default('kreato-bff'),
  KEYCLOAK_CLIENT_SECRET: z.string().min(1).optional(),
  // URL pública do backend — usada para construir o redirect_uri do OAuth callback.
  // Local: http://localhost:3333  |  Produção: https://api.seudominio.com.br
  BACKEND_PUBLIC_URL: z.string().url().default('http://localhost:3333'),

  // ─── Session (BFF) ──────────────────────────────────────────────────────────
  // SESSION_SECRET: chave AES-256 para encriptar tokens Keycloak no banco.
  // Deve ser exatamente 64 chars hexadecimais (= 32 bytes).
  // Gere com: openssl rand -hex 32
  SESSION_SECRET: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'SESSION_SECRET must be a 64-char hex string (32 bytes). Generate with: openssl rand -hex 32')
    .optional(),
  // TTL da sessão no banco — deve ser >= refresh token TTL do Keycloak.
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  // Cookie name para o session_id
  SESSION_COOKIE_NAME: z.string().min(1).default('kreato_session'),
});

export type AppEnv = z.infer<typeof envSchema>;

// Verifica em runtime se as vars Keycloak estão presentes quando a feature
// está habilitada. Lança erro claro antes do servidor aceitar tráfego.
export function assertKeycloakConfig(env: AppEnv): void {
  if (!env.KEYCLOAK_AUTH_ENABLED) return;

  const missing: string[] = [];
  if (!env.KEYCLOAK_URL) missing.push('KEYCLOAK_URL');
  if (!env.KEYCLOAK_CLIENT_SECRET) missing.push('KEYCLOAK_CLIENT_SECRET');
  if (!env.SESSION_SECRET) missing.push('SESSION_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `KEYCLOAK_AUTH_ENABLED=true but required variables are missing: ${missing.join(', ')}`,
    );
  }
}

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(source);
}

function resolveEnvSource(source: Record<string, string | undefined>): Record<string, string | undefined> {
  if (source.NODE_ENV === 'test') {
    return {
      JWT_ACCESS_SECRET: 'test-access-secret-with-at-least-32-chars',
      JWT_REFRESH_SECRET: 'test-refresh-secret-with-at-least-32-chars',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/kreato_test?schema=public',
      KEYCLOAK_AUTH_ENABLED: 'false',
      LEGACY_AUTH_ENABLED: 'true',
      BACKEND_PUBLIC_URL: 'http://localhost:3333',
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
