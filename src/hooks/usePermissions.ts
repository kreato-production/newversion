import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPerfilPermissions, PermissionItem } from '@/data/permissionsMatrix';

interface UsePermissionsResult {
  hasPermission: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  isVisible: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  isReadOnly: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  canIncluir: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  canAlterar: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  canExcluir: (modulo: string, subModulo1?: string, subModulo2?: string, campo?: string) => boolean;
  getFieldPermission: (modulo: string, subModulo1: string, subModulo2: string, campo: string) => PermissionItem | null;
  permissions: PermissionItem[];
}

export const usePermissions = (): UsePermissionsResult => {
  const { user } = useAuth();
  
  const permissions = useMemo(() => {
    if (!user?.perfil) return [];
    
    // Buscar o perfil pelo nome
    const storedPerfis = localStorage.getItem('kreato_perfis_acesso');
    if (!storedPerfis) return [];
    
    const perfis = JSON.parse(storedPerfis);
    const perfilEncontrado = perfis.find((p: { nome: string; id: string }) => p.nome === user.perfil);
    
    if (!perfilEncontrado) return [];
    
    const perfilPermissoes = getPerfilPermissions(perfilEncontrado.id);
    return perfilPermissoes?.permissoes || [];
  }, [user?.perfil]);
  
  const findPermission = (
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): PermissionItem | null => {
    return permissions.find(
      p =>
        p.modulo === modulo &&
        p.subModulo1 === subModulo1 &&
        p.subModulo2 === subModulo2 &&
        p.campo === campo
    ) || null;
  };
  
  // Verifica se um item (e seus pais) estão visíveis
  const isVisible = (
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    // Verifica o módulo
    const moduloPermission = findPermission(modulo, '-', '-', '-');
    if (moduloPermission?.acao === 'invisible') return false;
    
    // Se só pediu o módulo, retorna true
    if (subModulo1 === '-') return true;
    
    // Verifica o sub-módulo 1
    const subModulo1Permission = findPermission(modulo, subModulo1, '-', '-');
    if (subModulo1Permission?.acao === 'invisible') return false;
    
    // Se só pediu até o sub-módulo 1, retorna true
    if (subModulo2 === '-' && campo === '-') return true;
    
    // Verifica o sub-módulo 2
    if (subModulo2 !== '-') {
      const subModulo2Permission = findPermission(modulo, subModulo1, subModulo2, '-');
      if (subModulo2Permission?.acao === 'invisible') return false;
    }
    
    // Se só pediu até o sub-módulo 2, retorna true
    if (campo === '-') return true;
    
    // Verifica o campo específico
    const campoPermission = findPermission(modulo, subModulo1, subModulo2, campo);
    if (campoPermission?.acao === 'invisible') return false;
    
    return true;
  };
  
  const hasPermission = isVisible;
  
  const isReadOnly = (
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    const permission = findPermission(modulo, subModulo1, subModulo2, campo);
    return permission?.somenteLeitura ?? false;
  };
  
  const canIncluir = (
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    const permission = findPermission(modulo, subModulo1, subModulo2, campo);
    return permission?.incluir ?? true;
  };
  
  const canAlterar = (
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    const permission = findPermission(modulo, subModulo1, subModulo2, campo);
    return permission?.alterar ?? true;
  };
  
  const canExcluir = (
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    const permission = findPermission(modulo, subModulo1, subModulo2, campo);
    return permission?.excluir ?? true;
  };
  
  const getFieldPermission = (
    modulo: string,
    subModulo1: string,
    subModulo2: string,
    campo: string
  ): PermissionItem | null => {
    return findPermission(modulo, subModulo1, subModulo2, campo);
  };
  
  return {
    hasPermission,
    isVisible,
    isReadOnly,
    canIncluir,
    canAlterar,
    canExcluir,
    getFieldPermission,
    permissions,
  };
};

export default usePermissions;
