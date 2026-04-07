/**
 * Helpers de autorização — Auth.js v5.
 *
 * Todos os guards são server-side. NUNCA confie em estado do cliente
 * para decisões de autorização.
 *
 * Uso em Server Components / Route Handlers:
 *   const session = await requireAuth()
 *   const session = await requireRole('GLOBAL_ADMIN')
 *   const ok = hasRole(session, 'TENANT_ADMIN')
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import type { KreatoUserRole, KreatoPermission } from '@/types/next-auth';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type KreatoSession = Session & {
  user: Session['user'] & {
    id: string;
    role: KreatoUserRole;
    tenantId: string | null;
    usuario: string;
    perfil: string;
    tipoAcesso: string;
    unidadeIds: string[];
    enabledModules: string[];
    permissions: KreatoPermission[];
  };
};

const ROLE_LEVEL: Record<KreatoUserRole, number> = {
  USER: 0,
  TENANT_ADMIN: 1,
  GLOBAL_ADMIN: 2,
};

// ─── requireAuth ──────────────────────────────────────────────────────────────

/**
 * Exige autenticação. Se não houver sessão, redireciona para /login.
 */
export async function requireAuth(redirectTo = '/login'): Promise<KreatoSession> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(redirectTo);
  }

  return session as KreatoSession;
}

// ─── requireRole ─────────────────────────────────────────────────────────────

/**
 * Exige papel mínimo. Se insuficiente, redireciona para /unauthorized.
 */
export async function requireRole(minimumRole: KreatoUserRole): Promise<KreatoSession> {
  const session = await requireAuth();
  const userLevel = ROLE_LEVEL[session.user.role ?? 'USER'];
  const required = ROLE_LEVEL[minimumRole];

  if (userLevel < required) {
    redirect('/unauthorized');
  }

  return session;
}

// ─── requireSameTenant ────────────────────────────────────────────────────────

/**
 * Exige que o usuário pertença ao tenant especificado.
 * GLOBAL_ADMIN sempre passa.
 */
export async function requireSameTenant(tenantId: string): Promise<KreatoSession> {
  const session = await requireAuth();

  if (session.user.role === 'GLOBAL_ADMIN') return session;

  if (session.user.tenantId !== tenantId) {
    redirect('/unauthorized');
  }

  return session;
}

// ─── Helpers síncronos ────────────────────────────────────────────────────────

export function hasRole(session: KreatoSession, minimumRole: KreatoUserRole): boolean {
  return ROLE_LEVEL[session.user.role ?? 'USER'] >= ROLE_LEVEL[minimumRole];
}

export function hasModule(session: KreatoSession, modulo: string): boolean {
  if (session.user.role === 'GLOBAL_ADMIN') return true;
  return session.user.enabledModules?.includes(modulo) ?? false;
}

export function checkPermission(
  session: KreatoSession,
  modulo: string,
  acao: 'incluir' | 'alterar' | 'excluir' | 'somenteLeitura',
): boolean {
  if (session.user.role === 'GLOBAL_ADMIN') return true;

  const perm = session.user.permissions?.find(
    (p) => p.modulo === modulo && p.tipo === 'modulo',
  );

  if (!perm) return true;
  if (perm.acao === 'invisible') return false;
  return perm[acao] !== false;
}

export async function getSessionOrNull(): Promise<KreatoSession | null> {
  const session = await auth();
  return session ? (session as KreatoSession) : null;
}

export function isGlobalAdmin(session: KreatoSession): boolean {
  return session.user.role === 'GLOBAL_ADMIN';
}

export function isTenantAdmin(session: KreatoSession): boolean {
  return session.user.role === 'TENANT_ADMIN' || session.user.role === 'GLOBAL_ADMIN';
}
