import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  modulo: string;
  subModulo1?: string;
  subModulo2?: string;
  campo?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  modulo,
  subModulo1,
  subModulo2,
  campo,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission } = usePermissions();
  return hasPermission(modulo, subModulo1, subModulo2, campo) ? <>{children}</> : <>{fallback}</>;
}
