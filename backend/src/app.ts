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
import { PrismaAlocacoesRepository } from './modules/alocacoes/alocacoes.repository.js';
import { createAlocacoesRoutes } from './modules/alocacoes/routes/index.js';
import { AlocacoesService } from './modules/alocacoes/alocacoes.service.js';
import { PrismaAnalyticsRepository } from './modules/analytics/analytics.repository.js';
import { createAnalyticsRoutes } from './modules/analytics/routes/index.js';
import { AnalyticsService } from './modules/analytics/analytics.service.js';
import { PrismaAdminConfigRepository } from './modules/admin-config/admin-config.repository.js';
import { createAdminConfigRoutes } from './modules/admin-config/routes/index.js';
import { AdminConfigService } from './modules/admin-config/admin-config.service.js';
import { PrismaConteudosRepository } from './modules/conteudos/conteudos.repository.js';
import { createConteudosRoutes } from './modules/conteudos/routes/index.js';
import { ConteudosService } from './modules/conteudos/conteudos.service.js';
import { PrismaDepartamentosRepository } from './modules/departamentos/departamentos.repository.js';
import { createDepartamentosRoutes } from './modules/departamentos/routes/index.js';
import { DepartamentosService } from './modules/departamentos/departamentos.service.js';
import { PrismaElencoRepository } from './modules/elenco/elenco.repository.js';
import { createElencoRoutes } from './modules/elenco/routes/index.js';
import { ElencoService } from './modules/elenco/elenco.service.js';
import { PrismaEquipesRepository } from './modules/equipes/equipes.repository.js';
import { createEquipesRoutes } from './modules/equipes/routes/index.js';
import { EquipesService } from './modules/equipes/equipes.service.js';
import { PrismaFornecedoresRepository } from './modules/fornecedores/fornecedores.repository.js';
import { createFornecedoresRoutes } from './modules/fornecedores/routes/index.js';
import { FornecedoresService } from './modules/fornecedores/fornecedores.service.js';
import { PrismaFigurinosRepository } from './modules/figurinos/figurinos.repository.js';
import { createFigurinosRoutes } from './modules/figurinos/routes/index.js';
import { FigurinosService } from './modules/figurinos/figurinos.service.js';
import { PrismaGravacoesRepository } from './modules/gravacoes/gravacoes.repository.js';
import { createGravacoesRoutes } from './modules/gravacoes/routes/index.js';
import { GravacoesService } from './modules/gravacoes/gravacoes.service.js';
import { PrismaIncidenciasGravacaoRepository } from './modules/incidencias-gravacao/incidencias-gravacao.repository.js';
import { createIncidenciasGravacaoRoutes } from './modules/incidencias-gravacao/routes/index.js';
import { IncidenciasGravacaoService } from './modules/incidencias-gravacao/incidencias-gravacao.service.js';
import { PrismaProgramasRepository } from './modules/programas/programas.repository.js';
import { createProgramasRoutes } from './modules/programas/routes/index.js';
import { ProgramasService } from './modules/programas/programas.service.js';
import { PrismaParametrosRepository } from './modules/parametros/parametros.repository.js';
import { createParametrosRoutes } from './modules/parametros/routes/index.js';
import { ParametrosService } from './modules/parametros/parametros.service.js';
import { PrismaParametrizacoesRepository } from './modules/parametrizacoes/parametrizacoes.repository.js';
import { createParametrizacoesRoutes } from './modules/parametrizacoes/routes/index.js';
import { ParametrizacoesService } from './modules/parametrizacoes/parametrizacoes.service.js';
import { PrismaPessoasRepository } from './modules/pessoas/pessoas.repository.js';
import { createPessoasRoutes } from './modules/pessoas/routes/index.js';
import { PessoasService } from './modules/pessoas/pessoas.service.js';
import { PrismaRecursosTecnicosRepository } from './modules/recursos-tecnicos/recursos-tecnicos.repository.js';
import { PrismaRecursosFisicosRepository } from './modules/recursos-fisicos/recursos-fisicos.repository.js';
import { createRecursosFisicosRoutes } from './modules/recursos-fisicos/routes/index.js';
import { RecursosFisicosService } from './modules/recursos-fisicos/recursos-fisicos.service.js';
import { PrismaRecursosHumanosRepository } from './modules/recursos-humanos/recursos-humanos.repository.js';
import { createRecursosHumanosRoutes } from './modules/recursos-humanos/routes/index.js';
import { RecursosHumanosService } from './modules/recursos-humanos/recursos-humanos.service.js';
import { createRecursosTecnicosRoutes } from './modules/recursos-tecnicos/routes/index.js';
import { RecursosTecnicosService } from './modules/recursos-tecnicos/recursos-tecnicos.service.js';
import { PrismaRoteiroRepository } from './modules/roteiro/roteiro.repository.js';
import { createRoteiroRoutes } from './modules/roteiro/routes/index.js';
import { RoteiroService } from './modules/roteiro/roteiro.service.js';
import { PrismaTenantsRepository } from './modules/tenants/tenants.repository.js';
import { createTenantsRoutes } from './modules/tenants/routes/index.js';
import { TenantsService } from './modules/tenants/tenants.service.js';
import { PrismaTarefasRepository } from './modules/tarefas/tarefas.repository.js';
import { createTarefasRoutes } from './modules/tarefas/routes/index.js';
import { TarefasService } from './modules/tarefas/tarefas.service.js';
import { PrismaTabelasPrecoRepository } from './modules/tabelas-preco/tabelas-preco.repository.js';
import { createTabelasPrecoRoutes } from './modules/tabelas-preco/routes/index.js';
import { TabelasPrecoService } from './modules/tabelas-preco/tabelas-preco.service.js';
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
  alocacoesService?: AlocacoesService;
  analyticsService?: AnalyticsService;
  adminConfigService?: AdminConfigService;
  authService?: AuthService;
  conteudosService?: ConteudosService;
  departamentosService?: DepartamentosService;
  elencoService?: ElencoService;
  equipesService?: EquipesService;
  figurinosService?: FigurinosService;
  fornecedoresService?: FornecedoresService;
  gravacoesService?: GravacoesService;
  incidenciasGravacaoService?: IncidenciasGravacaoService;
  parametrosService?: ParametrosService;
  parametrizacoesService?: ParametrizacoesService;
  pessoasService?: PessoasService;
  programasService?: ProgramasService;
  recursosFisicosService?: RecursosFisicosService;
  recursosHumanosService?: RecursosHumanosService;
  recursosTecnicosService?: RecursosTecnicosService;
  roteiroService?: RoteiroService;
  tabelasPrecoService?: TabelasPrecoService;
  tarefasService?: TarefasService;
  tenantsService?: TenantsService;
  unidadesService?: UnidadesService;
  usersService?: UsersService;
  healthService?: HealthService;
};

function expandLocalOriginAliases(origin: string): string[] {
  try {
    const url = new URL(origin);
    const aliases = new Set<string>([origin]);

    if (url.hostname === 'localhost') {
      aliases.add(`${url.protocol}//127.0.0.1${url.port ? `:${url.port}` : ''}`);
    }

    if (url.hostname === '127.0.0.1') {
      aliases.add(`${url.protocol}//localhost${url.port ? `:${url.port}` : ''}`);
    }

    return [...aliases];
  } catch {
    return [origin];
  }
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({ logger: createLoggerOptions() });
  const alocacoesService = options.alocacoesService ?? new AlocacoesService(new PrismaAlocacoesRepository());
  const analyticsService = options.analyticsService ?? new AnalyticsService(new PrismaAnalyticsRepository());
  const adminConfigService = options.adminConfigService ?? new AdminConfigService(new PrismaAdminConfigRepository());
  const authService = options.authService ?? new AuthService(new PrismaAuthRepository());
  const conteudosService = options.conteudosService ?? new ConteudosService(new PrismaConteudosRepository());
  const departamentosService = options.departamentosService ?? new DepartamentosService(new PrismaDepartamentosRepository());
  const elencoService = options.elencoService ?? new ElencoService(new PrismaElencoRepository());
  const equipesService = options.equipesService ?? new EquipesService(new PrismaEquipesRepository());
  const figurinosService = options.figurinosService ?? new FigurinosService(new PrismaFigurinosRepository());
  const fornecedoresService = options.fornecedoresService ?? new FornecedoresService(new PrismaFornecedoresRepository());
  const gravacoesService = options.gravacoesService ?? new GravacoesService(new PrismaGravacoesRepository());
  const incidenciasGravacaoService = options.incidenciasGravacaoService ?? new IncidenciasGravacaoService(new PrismaIncidenciasGravacaoRepository());
  const parametrosService = options.parametrosService ?? new ParametrosService(new PrismaParametrosRepository());
  const parametrizacoesService = options.parametrizacoesService ?? new ParametrizacoesService(new PrismaParametrizacoesRepository());
  const pessoasService = options.pessoasService ?? new PessoasService(new PrismaPessoasRepository());
  const programasService = options.programasService ?? new ProgramasService(new PrismaProgramasRepository());
  const recursosFisicosService = options.recursosFisicosService ?? new RecursosFisicosService(new PrismaRecursosFisicosRepository());
  const recursosHumanosService = options.recursosHumanosService ?? new RecursosHumanosService(new PrismaRecursosHumanosRepository());
  const recursosTecnicosService = options.recursosTecnicosService ?? new RecursosTecnicosService(new PrismaRecursosTecnicosRepository());
  const roteiroService = options.roteiroService ?? new RoteiroService(new PrismaRoteiroRepository());
  const tabelasPrecoService = options.tabelasPrecoService ?? new TabelasPrecoService(new PrismaTabelasPrecoRepository());
  const tarefasService = options.tarefasService ?? new TarefasService(new PrismaTarefasRepository());
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

  const allowedOrigins = env.CORS_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const normalizedAllowedOrigins = new Set(allowedOrigins.flatMap(expandLocalOriginAliases));

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || normalizedAllowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'), false);
    },
    credentials: true,
  });

  await app.register(createHealthRoutes(options.healthService));
  await app.register(createAlocacoesRoutes(authService, alocacoesService));
  await app.register(createAnalyticsRoutes(authService, analyticsService));
  await app.register(createAdminConfigRoutes(authService, adminConfigService));
  await app.register(createAuthRoutes(authService));
  await app.register(createConteudosRoutes(authService, conteudosService));
  await app.register(createDepartamentosRoutes(authService, departamentosService));
  await app.register(createElencoRoutes(authService, elencoService));
  await app.register(createEquipesRoutes(authService, equipesService));
  await app.register(createFigurinosRoutes(authService, figurinosService));
  await app.register(createFornecedoresRoutes(authService, fornecedoresService));
  await app.register(createGravacoesRoutes(authService, gravacoesService));
  await app.register(createIncidenciasGravacaoRoutes(authService, incidenciasGravacaoService));
  await app.register(createParametrosRoutes(authService, parametrosService));
  await app.register(createParametrizacoesRoutes(authService, parametrizacoesService));
  await app.register(createPessoasRoutes(authService, pessoasService));
  await app.register(createProgramasRoutes(authService, programasService));
  await app.register(createRecursosFisicosRoutes(authService, recursosFisicosService));
  await app.register(createRecursosHumanosRoutes(authService, recursosHumanosService));
  await app.register(createRecursosTecnicosRoutes(authService, recursosTecnicosService));
  await app.register(createRoteiroRoutes(authService, roteiroService));
  await app.register(createTabelasPrecoRoutes(authService, tabelasPrecoService));
  await app.register(createTarefasRoutes(authService, tarefasService));
  await app.register(createTenantsRoutes(authService, tenantsService));
  await app.register(createUnidadesRoutes(authService, unidadesService));
  await app.register(createUsersRoutes(authService, usersService));

  return app;
}
