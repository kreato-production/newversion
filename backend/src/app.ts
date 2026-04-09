import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env, assertKeycloakConfig } from './config/env.js';
import { sessionSecretToKey } from './lib/security/session-crypto.js';
import { getDiscovery, validateKeycloakToken } from './lib/oidc/discovery.js';
import { refreshKeycloakTokens } from './lib/oidc/token-exchange.js';
import { PrismaSessionRepository } from './modules/auth/session.repository.js';
import { createOidcRoutes } from './modules/auth/routes/oidc.js';
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
import { PrismaFeriadosRepository } from './modules/feriados/feriados.repository.js';
import { createFeriadosRoutes } from './modules/feriados/routes/index.js';
import { FeriadosService } from './modules/feriados/feriados.service.js';
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
import { PrismaApropriacoesCustoRepository } from './modules/apropriacoes-custo/apropriacoes-custo.repository.js';
import { createApropriacoesCustoRoutes } from './modules/apropriacoes-custo/routes/index.js';
import { ApropriacoesCustoService } from './modules/apropriacoes-custo/apropriacoes-custo.service.js';
import { PrismaContasPagarRepository } from './modules/contas-pagar/contas-pagar.repository.js';
import { createContasPagarRoutes } from './modules/contas-pagar/routes/index.js';
import { ContasPagarService } from './modules/contas-pagar/contas-pagar.service.js';
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
import { PrismaTurnosRepository } from './modules/turnos/turnos.repository.js';
import { createTurnosRoutes } from './modules/turnos/routes/index.js';
import { TurnosService } from './modules/turnos/turnos.service.js';
import { PrismaEscalasRepository } from './modules/escalas/escalas.repository.js';
import { createEscalasRoutes } from './modules/escalas/routes/index.js';
import { EscalasService } from './modules/escalas/escalas.service.js';
import { authErrorHandler } from './plugins/auth.js';
import { observabilityPlugin } from './plugins/observability.js';
import { createHealthRoutes } from './routes/health/index.js';
import type { HealthService } from './routes/health/health.presenter.js';

type BuildAppOptions = {
  alocacoesService?: AlocacoesService;
  analyticsService?: AnalyticsService;
  adminConfigService?: AdminConfigService;
  authService?: AuthService;
  apropriacoesCustoService?: ApropriacoesCustoService;
  contasPagarService?: ContasPagarService;
  conteudosService?: ConteudosService;
  departamentosService?: DepartamentosService;
  elencoService?: ElencoService;
  equipesService?: EquipesService;
  feriadosService?: FeriadosService;
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
  turnosService?: TurnosService;
  escalasService?: EscalasService;
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
  // Separamos authRepository para que o hook de sessão Keycloak possa usá-lo
  // diretamente sem criar uma segunda instância de PrismaAuthRepository.
  const authRepository = new PrismaAuthRepository();
  const authService = options.authService ?? new AuthService(authRepository);
  const apropriacoesCustoService = options.apropriacoesCustoService ?? new ApropriacoesCustoService(new PrismaApropriacoesCustoRepository());
  const contasPagarService = options.contasPagarService ?? new ContasPagarService(new PrismaContasPagarRepository());
  const conteudosService = options.conteudosService ?? new ConteudosService(new PrismaConteudosRepository());
  const departamentosService = options.departamentosService ?? new DepartamentosService(new PrismaDepartamentosRepository());
  const elencoService = options.elencoService ?? new ElencoService(new PrismaElencoRepository());
  const equipesService = options.equipesService ?? new EquipesService(new PrismaEquipesRepository());
  const feriadosService = options.feriadosService ?? new FeriadosService(new PrismaFeriadosRepository());
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
  const turnosService = options.turnosService ?? new TurnosService(new PrismaTurnosRepository());
  const escalasService = options.escalasService ?? new EscalasService(new PrismaEscalasRepository());
  const unidadesService = options.unidadesService ?? new UnidadesService(new PrismaUnidadesRepository());
  const usersService = options.usersService ?? new UsersService(new PrismaUsersRepository());

  app.setErrorHandler(authErrorHandler);

  await observabilityPlugin(app, {});

  // ── Security headers ────────────────────────────────────────────────────────
  // Em development, a CSP é desabilitada para o Swagger UI funcionar corretamente
  // (ele carrega scripts e estilos inline que seriam bloqueados pela CSP padrão).
  // Em production, o helmet aplica:
  //   • Strict-Transport-Security (HSTS)
  //   • X-Frame-Options: SAMEORIGIN
  //   • X-Content-Type-Options: nosniff
  //   • Content-Security-Policy (padrão conservador)
  //   • Cross-Origin-Resource-Policy: same-origin
  //   • Referrer-Policy: no-referrer
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite API ser consumida por SPA
  });

  await app.register(cookie);
  await app.register(rateLimit, { global: false });

  // ── Keycloak BFF — apenas quando KEYCLOAK_AUTH_ENABLED=true ────────────────
  // Durante a migração ambos os fluxos coexistem:
  //   • Usuários Keycloak → cookie kreato_session → hook abaixo preenche request.user
  //   • Usuários legado   → cookie kreato_access_token / Bearer → createAuthenticate
  //
  // O hook roda ANTES dos preHandlers de rota. Se encontrar uma sessão válida,
  // popula request.user e createAuthenticate retorna imediatamente (early-return).
  if (env.KEYCLOAK_AUTH_ENABLED) {
    assertKeycloakConfig(env);

    const sessionKey = sessionSecretToKey(env.SESSION_SECRET!);
    const sessionRepository = new PrismaSessionRepository(sessionKey);

    // Registra rotas OIDC (/auth/login, /auth/callback, /auth/logout/keycloak)
    await app.register(createOidcRoutes(sessionRepository, authRepository, sessionKey));

    // Pré-carrega o discovery document na inicialização para validar que o
    // Keycloak está acessível antes do servidor aceitar tráfego.
    await getDiscovery().catch((err: unknown) => {
      app.log.error({ err }, 'Falha ao conectar ao Keycloak — verifique KEYCLOAK_URL e KEYCLOAK_REALM');
      throw err;
    });

    // ── Limpeza de sessões expiradas ──────────────────────────────────────────
    // Remove sessões expiradas na inicialização (lixo de crashes anteriores)
    // e a cada hora durante a operação normal.
    await sessionRepository.deleteExpiredSessions().catch((err: unknown) => {
      app.log.warn({ err }, 'session_cleanup_startup_failed');
    });
    const sessionCleanupInterval = setInterval(async () => {
      const deleted = await sessionRepository.deleteExpiredSessions().catch((err: unknown) => {
        app.log.warn({ err }, 'session_cleanup_periodic_failed');
      });
      if (deleted !== undefined) {
        app.log.debug({ deleted }, 'session_cleanup_periodic');
      }
    }, 60 * 60 * 1000); // 1 hora

    app.addHook('onClose', () => {
      clearInterval(sessionCleanupInterval);
    });

    // Hook global que autentica requests via sessão Keycloak.
    // Não lança: se a sessão for inválida, o request continua sem request.user
    // e o preHandler da rota decide se a autenticação é obrigatória (401) ou não.
    app.addHook('preHandler', async (request, reply) => {
      if (request.user) return; // já autenticado (ex: outro hook)

      const sessionId = request.cookies?.[env.SESSION_COOKIE_NAME];
      if (!sessionId) return;

      try {
        const session = await sessionRepository.findById(sessionId);

        if (!session || session.expiresAt <= new Date()) {
          // Sessão não encontrada ou expirada: limpa cookie silenciosamente
          if (session) await sessionRepository.deleteSession(sessionId);
          reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
          return;
        }

        // Valida o access token. Se expirado, tenta refresh proativo antes de
        // abandonar a sessão. Isso evita que o usuário precise re-autenticar
        // a cada expiração de access token (15 min por padrão).
        const tokenIsValid = await validateKeycloakToken(session.accessToken).then(
          () => true,
          () => false,
        );

        if (!tokenIsValid) {
          // Access token expirado — tenta renovar silenciosamente
          const discovery = await getDiscovery();
          let refreshSucceeded = false;

          try {
            const refreshed = await refreshKeycloakTokens({
              tokenEndpoint: discovery.token_endpoint,
              refreshToken: session.refreshToken,
              clientId: env.KEYCLOAK_CLIENT_ID,
              clientSecret: env.KEYCLOAK_CLIENT_SECRET!,
            });

            const newExpiry = new Date(
              Date.now() + (refreshed.refresh_expires_in ?? env.SESSION_TTL_SECONDS) * 1000,
            );
            await sessionRepository.updateTokens(session.id, {
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token,
              idToken: refreshed.id_token,
              expiresAt: newExpiry,
            });

            // Renova o TTL do cookie para refletir a nova expiração
            const secure = env.NODE_ENV === 'production';
            reply.setCookie(env.SESSION_COOKIE_NAME, sessionId, {
              httpOnly: true,
              sameSite: 'lax',
              secure,
              path: '/',
              maxAge: refreshed.refresh_expires_in ?? env.SESSION_TTL_SECONDS,
            });

            refreshSucceeded = true;
          } catch (refreshErr) {
            app.log.info({ sessionId, err: refreshErr }, 'keycloak_session_refresh_failed');
          }

          if (!refreshSucceeded) {
            // Refresh também falhou: encerra a sessão e força novo login
            await sessionRepository.deleteSession(sessionId);
            reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
            return;
          }
        }

        // Token válido (original ou recém-renovado): carrega o contexto de autorização
        request.user = await authService.authenticateByUserId(session.userId);
      } catch (err) {
        // Qualquer erro inesperado: loga mas não falha o request
        app.log.warn({ err, sessionId }, 'keycloak_session_hook_error');
      }
    });
  }

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
  await app.register(createApropriacoesCustoRoutes(authService, apropriacoesCustoService));
  await app.register(createContasPagarRoutes(authService, contasPagarService));
  await app.register(createConteudosRoutes(authService, conteudosService));
  await app.register(createDepartamentosRoutes(authService, departamentosService));
  await app.register(createElencoRoutes(authService, elencoService));
  await app.register(createEquipesRoutes(authService, equipesService));
  await app.register(createFeriadosRoutes(authService, feriadosService));
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
  await app.register(createTurnosRoutes(authService, turnosService));
  await app.register(createEscalasRoutes(authService, escalasService));
  await app.register(createUnidadesRoutes(authService, unidadesService));
  await app.register(createUsersRoutes(authService, usersService));

  return app;
}
