'use client';

/**
 * Guard client-side por papel.
 *
 * Use apenas para ocultar/mostrar elementos de UI.
 * NUNCA use para proteger dados ou operações sensíveis —
 * isso deve ser feito server-side via requireRole().
 */

import { useSession } from 'next-auth/react';
import type { KreatoUserRole } from '@/types/next-auth';

const ROLE_LEVEL: Record<KreatoUserRole, number> = {
  USER: 0,
  TENANT_ADMIN: 1,
  GLOBAL_ADMIN: 2,
};

interface RoleGuardProps {
  minimumRole: KreatoUserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renderiza `children` apenas se o usuário tem o papel mínimo exigido.
 * Renderiza `fallback` (padrão: null) caso contrário.
 */
export function RoleGuard({ minimumRole, children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();

  if (!session?.user) return <>{fallback}</>;

  const userLevel = ROLE_LEVEL[session.user.role ?? 'USER'];
  const requiredLevel = ROLE_LEVEL[minimumRole];

  if (userLevel < requiredLevel) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Hook para verificar papel no client.
 */
export function useHasRole(minimumRole: KreatoUserRole): boolean {
  const { data: session } = useSession();
  if (!session?.user) return false;
  return ROLE_LEVEL[session.user.role ?? 'USER'] >= ROLE_LEVEL[minimumRole];
}
