import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionItem } from '@/modules/auth/auth.types';

interface UsePermissionsResult {
  hasPermission: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  isVisible: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  isReadOnly: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  canIncluir: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  canAlterar: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  canExcluir: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  getFieldPermission: (modulo: string, subModulo1: string, subModulo2: string, campo: string) => PermissionItem | null;
  permissions: PermissionItem[];
  enabledModules: Set<string>;
}

export const usePermissions = (): UsePermissionsResult => {
  const { user } = useAuth();

  const permissions = user?.permissions || [];
  const enabledModules = useMemo(() => new Set(user?.enabledModules || []), [user?.enabledModules]);

  const findPermission = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-',
  ): PermissionItem | null => {
    return permissions.find(
      (permission) =>
        permission.modulo === modulo
        && permission.subModulo1 === subModulo1
        && permission.subModulo2 === subModulo2
        && permission.campo === campo,
    ) || null;
  }, [permissions]);

  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';

  const isVisible = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-',
  ): boolean => {
    if (modulo !== 'Global' && enabledModules.size > 0 && !enabledModules.has(modulo)) {
      return false;
    }

    if (isGlobalAdmin) {
      return true;
    }

    const moduloPermission = findPermission(modulo, '-', '-', '-');
    if (moduloPermission?.acao === 'invisible') return false;
    if (subModulo1 === '-') return true;

    const subModulo1Permission = findPermission(modulo, subModulo1, '-', '-');
    if (subModulo1Permission?.acao === 'invisible') return false;
    if (subModulo2 === '-' && campo === '-') return true;

    if (subModulo2 !== '-') {
      const subModulo2Permission = findPermission(modulo, subModulo1, subModulo2, '-');
      if (subModulo2Permission?.acao === 'invisible') return false;
    }

    if (campo === '-') return true;

    const campoPermission = findPermission(modulo, subModulo1, subModulo2, campo);
    if (campoPermission?.acao === 'invisible') return false;

    return true;
  }, [enabledModules, findPermission, isGlobalAdmin]);

  const hasPermission = isVisible;

  const isReadOnly = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-',
  ): boolean => {
    if (isGlobalAdmin) {
      return false;
    }

    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return true;

    if (campo !== '-') {
      const campoPermission = findPermission(modulo, subModulo1, subModulo2, campo);
      return campoPermission?.somenteLeitura ?? false;
    }

    return false;
  }, [findPermission, isGlobalAdmin, isVisible]);

  const canIncluir = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-',
  ): boolean => {
    if (isGlobalAdmin) return true;
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;

    if (subModulo2 !== '-') {
      const permission = findPermission(modulo, subModulo1, subModulo2, '-');
      if (permission) return permission.incluir ?? true;
    }

    if (subModulo1 !== '-') {
      const permission = findPermission(modulo, subModulo1, '-', '-');
      if (permission) return permission.incluir ?? true;
    }

    return true;
  }, [findPermission, isGlobalAdmin, isVisible]);

  const canAlterar = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-',
  ): boolean => {
    if (isGlobalAdmin) return true;
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;

    if (subModulo2 !== '-') {
      const permission = findPermission(modulo, subModulo1, subModulo2, '-');
      if (permission) return permission.alterar ?? true;
    }

    if (subModulo1 !== '-') {
      const permission = findPermission(modulo, subModulo1, '-', '-');
      if (permission) return permission.alterar ?? true;
    }

    return true;
  }, [findPermission, isGlobalAdmin, isVisible]);

  const canExcluir = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-',
  ): boolean => {
    if (isGlobalAdmin) return true;
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;

    if (subModulo2 !== '-') {
      const permission = findPermission(modulo, subModulo1, subModulo2, '-');
      if (permission) return permission.excluir ?? true;
    }

    if (subModulo1 !== '-') {
      const permission = findPermission(modulo, subModulo1, '-', '-');
      if (permission) return permission.excluir ?? true;
    }

    return true;
  }, [findPermission, isGlobalAdmin, isVisible]);

  const getFieldPermission = useCallback((modulo: string, subModulo1: string, subModulo2: string, campo: string) => {
    return findPermission(modulo, subModulo1, subModulo2, campo);
  }, [findPermission]);

  return {
    hasPermission,
    isVisible,
    isReadOnly,
    canIncluir,
    canAlterar,
    canExcluir,
    getFieldPermission,
    permissions,
    enabledModules,
  };
};

export default usePermissions;
