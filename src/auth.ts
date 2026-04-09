/**
 * Configuração central do Auth.js v5.
 *
 * Estratégia de sessão: JWT (obrigatório para Credentials provider no v5).
 * O JWT fica em cookie HttpOnly assinado com AUTH_SECRET — nunca no localStorage.
 *
 * Revogação: o jwt callback valida status do usuário no banco a cada request
 * (com cache de 5 minutos via `updatedAt`), permitindo revogar contas imediatamente.
 *
 * Para SSO via Keycloak: Keycloak provider usa database sessions automaticamente
 * quando disponível — para Credentials a constraint é JWT.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Keycloak from 'next-auth/providers/keycloak';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { KreatoUserRole, KreatoPermission } from '@/types/next-auth';

// ─── Tipos internos ───────────────────────────────────────────────────────────

type FastifyLoginResponse = {
  user: {
    id: string;
    tenantId: string | null;
    nome: string;
    email: string;
    usuario: string;
    role: string;
    perfil: string;
    tipoAcesso: string;
    unidadeIds: string[];
    enabledModules: string[];
    permissions: KreatoPermission[];
  };
};

type SessionTokenShape = {
  sub?: string;
  userId?: string;
  role?: KreatoUserRole;
  tenantId?: string | null;
  usuario?: string;
  perfil?: string;
  tipoAcesso?: string;
  unidadeIds?: string[];
  enabledModules?: string[];
  permissions?: KreatoPermission[];
  checkedAt?: number;
  name?: string | null;
  email?: string | null;
};

const credentialsSchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
});

function defaultEnabledModules(role: KreatoUserRole): string[] {
  if (role === 'GLOBAL_ADMIN') {
    return ['Dashboard', 'Produção', 'Recursos', 'Administração', 'Financeiro', 'Global'];
  }

  return ['Dashboard', 'Produção', 'Recursos', 'Administração', 'Financeiro'];
}

function defaultPerfil(role: KreatoUserRole): string {
  if (role === 'GLOBAL_ADMIN') return 'Administrador Global';
  if (role === 'TENANT_ADMIN') return 'Administrador Tenant';
  return 'Usuário';
}

function normalizeTokenShape(token: SessionTokenShape): string | undefined {
  const resolvedUserId = token.userId ?? token.sub;

  if (resolvedUserId) {
    token.userId = resolvedUserId;
  }

  if (!Array.isArray(token.unidadeIds)) {
    token.unidadeIds = [];
  }

  if (!Array.isArray(token.permissions)) {
    token.permissions = [];
  }

  if (!token.tipoAcesso) {
    token.tipoAcesso = 'Operacional';
  }

  if (!token.usuario) {
    token.usuario = token.email ?? '';
  }

  if (token.role && !Array.isArray(token.enabledModules)) {
    token.enabledModules = defaultEnabledModules(token.role);
  }

  if (token.role && !token.perfil) {
    token.perfil = defaultPerfil(token.role);
  }

  return resolvedUserId;
}

// ─── Auth.js ──────────────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter persiste contas OAuth (Account) e tokens de verificação.
  // Para Credentials, a sessão fica no JWT — não no banco.
  adapter: PrismaAdapter(prisma),

  session: {
    // JWT é obrigatório para o Credentials provider no Auth.js v5.
    // O token fica em cookie HttpOnly assinado — equivalente em segurança
    // a database sessions para o browser.
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
    updateAge: 24 * 60 * 60, // renova TTL uma vez por dia
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },

  providers: [
    // ── Credentials (username + password) ─────────────────────────────────
    Credentials({
      id: 'credentials',
      name: 'Kreato',
      credentials: {
        usuario: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parse = credentialsSchema.safeParse(rawCredentials);
        if (!parse.success) return null;

        const { usuario, password } = parse.data;
        const fastifyUrl = process.env.INTERNAL_FASTIFY_URL ?? 'http://localhost:3333';

        let data: FastifyLoginResponse;
        try {
          const response = await fetch(`${fastifyUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password }),
          });

          if (!response.ok) {
            const err = (await response.json().catch(() => ({}))) as { message?: string };
            throw new Error(err.message ?? 'Credenciais inválidas');
          }

          data = (await response.json()) as FastifyLoginResponse;
        } catch (err) {
          if (err instanceof Error) throw err;
          throw new Error('Erro ao comunicar com o servidor');
        }

        const u = data.user;

        // Retorna o User para o jwt callback.
        // Campos extras são incluídos e persistidos no token JWT.
        return {
          id: u.id,
          email: u.email,
          name: u.nome,
          image: null,
          usuario: u.usuario,
          role: u.role as KreatoUserRole,
          tenantId: u.tenantId,
          perfil: u.perfil,
          tipoAcesso: u.tipoAcesso,
          unidadeIds: u.unidadeIds,
          enabledModules: u.enabledModules,
          permissions: u.permissions,
        };
      },
    }),

    // ── Keycloak OIDC (habilitado por variáveis de ambiente) ───────────────
    ...(process.env.KEYCLOAK_CLIENT_ID &&
    process.env.KEYCLOAK_CLIENT_SECRET &&
    process.env.KEYCLOAK_ISSUER
      ? [
          Keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
            issuer: process.env.KEYCLOAK_ISSUER,
          }),
        ]
      : []),
  ],

  callbacks: {
    // ── jwt callback ────────────────────────────────────────────────────────
    // Chamado na criação do token e em cada request subsequente.
    // `user` só existe no primeiro login — depois apenas `token` é passado.
    async jwt({ token, user, account, profile }) {
      const sessionToken = token as SessionTokenShape;

      // Primeiro login: persiste dados do usuário no token
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        sessionToken.userId = u.id as string;
        sessionToken.role = (u.role ?? 'USER') as KreatoUserRole;
        sessionToken.tenantId = (u.tenantId as string | null) ?? null;
        sessionToken.usuario = (u.usuario as string | undefined) ?? u.email ?? '';
        sessionToken.perfil = (u.perfil as string | undefined) ?? 'Usuário';
        sessionToken.tipoAcesso = (u.tipoAcesso as string | undefined) ?? 'Operacional';
        sessionToken.unidadeIds = (u.unidadeIds as string[] | undefined) ?? [];
        sessionToken.enabledModules = (u.enabledModules as string[] | undefined) ?? [];
        sessionToken.permissions = (u.permissions as KreatoPermission[] | undefined) ?? [];
        sessionToken.checkedAt = Date.now(); // timestamp da última validação
      }

      // Login via Keycloak: sincroniza claims customizados
      if (account?.provider === 'keycloak' && profile) {
        const kc = profile as {
          app_role?: string;
          tenant_id?: string;
          preferred_username?: string;
        };
        sessionToken.role = mapKeycloakRole(kc.app_role);
        sessionToken.tenantId = kc.tenant_id ?? null;
        sessionToken.usuario = kc.preferred_username ?? sessionToken.email ?? '';
        sessionToken.checkedAt = Date.now();

        // Sincroniza no banco para o Fastify consultar
        if (sessionToken.email) {
          await prisma.user
            .update({
              where: { email: sessionToken.email },
              data: {
                role: sessionToken.role,
                tenantId: sessionToken.tenantId,
                usuario: sessionToken.usuario,
                nome: (sessionToken.name as string | undefined) ?? sessionToken.email.split('@')[0],
              },
            })
            .catch(() => {});
        }
      }

      const normalizedUserId = normalizeTokenShape(sessionToken);

      // Validação periódica anti-revogação:
      // A cada 5 minutos, revalida se o usuário ainda está ativo no banco.
      // Isso permite revogar contas sem esperar o token expirar (7 dias).
      const FIVE_MINUTES = 5 * 60 * 1000;
      const needsRecovery =
        !sessionToken.role ||
        !sessionToken.usuario ||
        !sessionToken.perfil ||
        !Array.isArray(sessionToken.enabledModules) ||
        !Array.isArray(sessionToken.permissions) ||
        !Array.isArray(sessionToken.unidadeIds);
      const needsCheck =
        needsRecovery ||
        !sessionToken.checkedAt ||
        Date.now() - sessionToken.checkedAt > FIVE_MINUTES;

      if (needsCheck && normalizedUserId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: normalizedUserId },
            select: {
              status: true,
              role: true,
              tenantId: true,
              usuario: true,
              nome: true,
              email: true,
              perfil: true,
              tipoAcesso: true,
            },
          });

          if (!dbUser || dbUser.status !== 'ATIVO') {
            // Usuário removido ou desativado → invalida o token
            return null as never;
          }

          // Atualiza dados que podem ter mudado (promoção de role, troca de tenant)
          sessionToken.role = dbUser.role as KreatoUserRole;
          sessionToken.tenantId = dbUser.tenantId;
          sessionToken.usuario = dbUser.usuario ?? sessionToken.usuario ?? dbUser.email ?? '';
          sessionToken.perfil =
            dbUser.perfil ?? sessionToken.perfil ?? defaultPerfil(sessionToken.role);
          sessionToken.tipoAcesso = dbUser.tipoAcesso ?? sessionToken.tipoAcesso ?? 'Operacional';
          sessionToken.name = (sessionToken.name as string | null | undefined) ?? dbUser.nome;
          sessionToken.email = (sessionToken.email as string | null | undefined) ?? dbUser.email;
          sessionToken.enabledModules = Array.isArray(sessionToken.enabledModules)
            ? sessionToken.enabledModules
            : defaultEnabledModules(sessionToken.role);
          sessionToken.unidadeIds = Array.isArray(sessionToken.unidadeIds)
            ? sessionToken.unidadeIds
            : [];
          sessionToken.permissions = Array.isArray(sessionToken.permissions)
            ? sessionToken.permissions
            : [];
          sessionToken.checkedAt = Date.now();
        } catch {
          // Falha de banco não invalida a sessão (degradação graciosa)
          // — o usuário continua com os dados do último check
        }
      }

      return token;
    },

    // ── session callback ────────────────────────────────────────────────────
    // Monta o objeto de sessão a partir do token JWT.
    // Chamado sempre que `auth()` ou `useSession()` é usado.
    async session({ session, token }) {
      const sessionToken = token as SessionTokenShape;
      const resolvedUserId = normalizeTokenShape(sessionToken);

      session.user.id = resolvedUserId ?? '';
      session.user.role = sessionToken.role ?? 'USER';
      session.user.tenantId = sessionToken.tenantId ?? null;
      session.user.usuario = sessionToken.usuario ?? session.user.email ?? '';
      session.user.perfil = sessionToken.perfil ?? 'Usuário';
      session.user.tipoAcesso = sessionToken.tipoAcesso ?? 'Operacional';
      session.user.unidadeIds = sessionToken.unidadeIds ?? [];
      session.user.enabledModules =
        sessionToken.enabledModules ?? defaultEnabledModules(session.user.role);
      session.user.permissions = sessionToken.permissions ?? [];

      return session;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (process.env.NODE_ENV !== 'test') {
        console.log('[auth] signIn', { userId: user.id, provider: account?.provider, isNewUser });
      }
    },
    async signOut() {
      // Com JWT strategy, signOut apaga o cookie — nenhuma ação de banco necessária
      if (process.env.NODE_ENV !== 'test') {
        console.log('[auth] signOut');
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapKeycloakRole(claim: string | undefined): KreatoUserRole {
  if (claim === 'GLOBAL_ADMIN') return 'GLOBAL_ADMIN';
  if (claim === 'TENANT_ADMIN') return 'TENANT_ADMIN';
  return 'USER';
}
