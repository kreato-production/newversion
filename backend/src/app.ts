import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';
import { createLoggerOptions } from './config/logger.js';
import { PrismaAuthRepository } from './modules/auth/auth.repository.js';
import { AuthService } from './modules/auth/auth.service.js';
import { createAuthRoutes } from './modules/auth/routes/index.js';
import { PrismaEquipesRepository } from './modules/equipes/equipes.repository.js';
import { createEquipesRoutes } from './modules/equipes/routes/index.js';
import { EquipesService } from './modules/equipes/equipes.service.js';
import { PrismaGravacoesRepository } from './modules/gravacoes/gravacoes.repository.js';
import { createGravacoesRoutes } from './modules/gravacoes/routes/index.js';
import { GravacoesService } from './modules/gravacoes/gravacoes.service.js';
import { PrismaProgramasRepository } from './modules/programas/programas.repository.js';
import { createProgramasRoutes } from './modules/programas/routes/index.js';
import { ProgramasService } from './modules/programas/programas.service.js';
import { PrismaTenantsRepository } from './modules/tenants/tenants.repository.js';
import { createTenantsRoutes } from './modules/tenants/routes/index.js';
import { TenantsService } from './modules/tenants/tenants.service.js';
import { PrismaUnidadesRepository } from './modules/unidades/unidades.repository.js';
import { createUnidadesRoutes } from './modules/unidades/routes/index.js';
import { UnidadesService } from './modules/unidades/unidades.service.js';
import { PrismaUsersRepository } from './modules/users/users.repository.js';
import { createUsersRoutes } from './modules/users/routes/index.js';
import { UsersService } from './modules/users/users.service.js';
import { authErrorHandler } from './plugins/auth.js';
import { observabilityPlugin } from './plugins/observability.js';
import { createHealthRoutes } from './routes/health/index.js';
import type { HealthService } from './routes/health/health.presenter.js';

type BuildAppOptions = {
  authService?: AuthService;
  equipesService?: EquipesService;
  gravacoesService?: GravacoesService;
  programasService?: ProgramasService;
  tenantsService?: TenantsService;
  unidadesService?: UnidadesService;
  usersService?: UsersService;
  healthService?: HealthService;
};

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({ logger: createLoggerOptions() });
  const authService = options.authService ?? new AuthService(new PrismaAuthRepository());
  const equipesService = options.equipesService ?? new EquipesService(new PrismaEquipesRepository());
  const gravacoesService = options.gravacoesService ?? new GravacoesService(new PrismaGravacoesRepository());
  const programasService = options.programasService ?? new ProgramasService(new PrismaProgramasRepository());
  const tenantsService = options.tenantsService ?? new TenantsService(new PrismaTenantsRepository());
  const unidadesService = options.unidadesService ?? new UnidadesService(new PrismaUnidadesRepository());
  const usersService = options.usersService ?? new UsersService(new PrismaUsersRepository());

  app.setErrorHandler(authErrorHandler);

  await observabilityPlugin(app, {});
  await app.register(cookie);
  await app.register(rateLimit, { global: false });

  if (env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Kreato API',
          description: 'API do sistema Kreato de gestão de produção',
          version: env.APP_VERSION,
        },
        components: {
          securitySchemes: {
            cookieAuth: {
              type: 'apiKey',
              in: 'cookie',
              name: 'kreato_access_token',
            },
          },
        },
      },
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(createHealthRoutes(options.healthService));
  await app.register(createAuthRoutes(authService));
  await app.register(createEquipesRoutes(authService, equipesService));
  await app.register(createGravacoesRoutes(authService, gravacoesService));
  await app.register(createProgramasRoutes(authService, programasService));
  await app.register(createTenantsRoutes(authService, tenantsService));
  await app.register(createUnidadesRoutes(authService, unidadesService));
  await app.register(createUsersRoutes(authService, usersService));

  return app;
}
