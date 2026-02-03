import { useMemo, useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPerfilPermissions, PermissionItem } from '@/data/permissionsMatrix';
import { supabase } from '@/integrations/supabase/client';

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
  const { user, session } = useAuth();
  const [perfilId, setPerfilId] = useState<string | null>(null);
  
  // Buscar o perfil do usuário do Supabase
  useEffect(() => {
    const fetchPerfil = async () => {
      if (!user?.perfil || !session) return;
      
      try {
        const { data, error } = await supabase
          .from('perfis_acesso')
          .select('id')
          .eq('nome', user.perfil)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching perfil:', error);
          return;
        }
        
        setPerfilId(data?.id || null);
      } catch (err) {
        console.error('Error in fetchPerfil:', err);
      }
    };
    
    fetchPerfil();
  }, [user?.perfil, session]);
  
  const permissions = useMemo(() => {
    if (!perfilId) return [];
    
    const perfilPermissoes = getPerfilPermissions(perfilId);
    return perfilPermissoes?.permissoes || [];
  }, [perfilId]);
  
  const findPermission = useCallback((
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
  }, [permissions]);
  
  // Verifica se um item (e seus pais) estão visíveis
  const isVisible = useCallback((
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
  }, [findPermission]);
  
  const hasPermission = isVisible;
  
  const isReadOnly = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    // Primeiro verifica se está visível
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return true;
    
    // Para campos, verifica a permissão específica do campo
    if (campo !== '-') {
      const campoPermission = findPermission(modulo, subModulo1, subModulo2, campo);
      return campoPermission?.somenteLeitura ?? false;
    }
    
    return false;
  }, [findPermission, isVisible]);
  
  const canIncluir = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    
    // Busca permissão do nível mais específico disponível
    let permission: PermissionItem | null = null;
    
    if (campo !== '-') {
      permission = findPermission(modulo, subModulo1, subModulo2, campo);
    }
    
    if (!permission && subModulo2 !== '-') {
      permission = findPermission(modulo, subModulo1, subModulo2, '-');
    }
    
    if (!permission && subModulo1 !== '-') {
      permission = findPermission(modulo, subModulo1, '-', '-');
    }
    
    if (!permission) {
      permission = findPermission(modulo, '-', '-', '-');
    }
    
    return permission?.incluir ?? true;
  }, [findPermission, isVisible]);
  
  const canAlterar = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    
    // Busca permissão do nível mais específico disponível
    let permission: PermissionItem | null = null;
    
    if (campo !== '-') {
      permission = findPermission(modulo, subModulo1, subModulo2, campo);
    }
    
    if (!permission && subModulo2 !== '-') {
      permission = findPermission(modulo, subModulo1, subModulo2, '-');
    }
    
    if (!permission && subModulo1 !== '-') {
      permission = findPermission(modulo, subModulo1, '-', '-');
    }
    
    if (!permission) {
      permission = findPermission(modulo, '-', '-', '-');
    }
    
    return permission?.alterar ?? true;
  }, [findPermission, isVisible]);
  
  const canExcluir = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    
    // Busca permissão do nível mais específico disponível
    let permission: PermissionItem | null = null;
    
    if (campo !== '-') {
      permission = findPermission(modulo, subModulo1, subModulo2, campo);
    }
    
    if (!permission && subModulo2 !== '-') {
      permission = findPermission(modulo, subModulo1, subModulo2, '-');
    }
    
    if (!permission && subModulo1 !== '-') {
      permission = findPermission(modulo, subModulo1, '-', '-');
    }
    
    if (!permission) {
      permission = findPermission(modulo, '-', '-', '-');
    }
    
    return permission?.excluir ?? true;
  }, [findPermission, isVisible]);
  
  const getFieldPermission = useCallback((
    modulo: string,
    subModulo1: string,
    subModulo2: string,
    campo: string
  ): PermissionItem | null => {
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
  };
};

export default usePermissions;