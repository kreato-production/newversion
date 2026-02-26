// ============= Full file contents =============

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPerfilPermissionsAsync, PermissionItem } from '@/data/permissionsMatrix';
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
  enabledModules: Set<string>;
}

export const usePermissions = (): UsePermissionsResult => {
  const { user, session } = useAuth();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  
  // Buscar módulos habilitados do tenant
  useEffect(() => {
    const fetchTenantModules = async () => {
      // Global admins see everything by default in terms of modules
      if (user?.email?.includes('admin_global') || user?.usuario === 'admin_global') {
        setEnabledModules(new Set(['Dashboard', 'Produção', 'Recursos', 'Administração', 'Global']));
        return;
      }

      // Check tenant modules
      const { data: tenantData } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .maybeSingle();

      if (tenantData?.tenant_id) {
        const { data: modulesData } = await supabase
          .from('tenant_modulos')
          .select('modulo')
          .eq('tenant_id', tenantData.tenant_id);
        
        if (modulesData) {
          setEnabledModules(new Set(modulesData.map((m: any) => m.modulo)));
        }
      } else {
        // Fallback for non-tenant users (should not happen in prod)
        setEnabledModules(new Set(['Dashboard', 'Produção', 'Recursos', 'Administração']));
      }
    };

    if (user && session) {
      fetchTenantModules();
    }
  }, [user, session]);

  // Buscar perfil e permissões do Supabase
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.perfil || !session) return;
      
      try {
        const { data, error } = await supabase
          .from('perfis_acesso')
          .select('id')
          .eq('nome', user.perfil)
          .maybeSingle();
        
        if (error || !data?.id) {
          // If profile not found, likely admin_global or system user
          console.log('Profile not found permissions, using defaults');
          return;
        }
        
        const perfilPermissoes = await getPerfilPermissionsAsync(data.id);
        setPermissions(perfilPermissoes?.permissoes || []);
      } catch (err) {
        console.error('Error in fetchPermissions:', err);
      }
    };
    
    fetchPermissions();
  }, [user?.perfil, session]);
  
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
    // 1. Check Tenant Module restriction first
    if (modulo !== 'Global' && !enabledModules.has(modulo)) {
      return false;
    }

    // Global admins bypass permission matrix
    if (user?.email?.includes('admin_global') || user?.usuario === 'admin_global') {
      return true;
    }

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
  }, [findPermission, enabledModules, user]);
  
  const hasPermission = isVisible;
  
  const isReadOnly = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    // Global admins are never read-only
    if (user?.email?.includes('admin_global') || user?.usuario === 'admin_global') {
      return false;
    }

    // Primeiro verifica se está visível
    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return true;
    
    // Para campos, verifica a permissão específica do campo
    if (campo !== '-') {
      const campoPermission = findPermission(modulo, subModulo1, subModulo2, campo);
      return campoPermission?.somenteLeitura ?? false;
    }
    
    return false;
  }, [findPermission, isVisible, user]);
  
  const canIncluir = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (user?.email?.includes('admin_global') || user?.usuario === 'admin_global') return true;

    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    
    // Verifica no nível do sub-módulo mais específico disponível
    if (subModulo2 !== '-') {
      const perm = findPermission(modulo, subModulo1, subModulo2, '-');
      if (perm) return perm.incluir ?? true;
    }
    if (subModulo1 !== '-') {
      const perm = findPermission(modulo, subModulo1, '-', '-');
      if (perm) return perm.incluir ?? true;
    }
    return true;
  }, [findPermission, isVisible, user]);
  
  const canAlterar = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (user?.email?.includes('admin_global') || user?.usuario === 'admin_global') return true;

    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    
    if (subModulo2 !== '-') {
      const perm = findPermission(modulo, subModulo1, subModulo2, '-');
      if (perm) return perm.alterar ?? true;
    }
    if (subModulo1 !== '-') {
      const perm = findPermission(modulo, subModulo1, '-', '-');
      if (perm) return perm.alterar ?? true;
    }
    return true;
  }, [findPermission, isVisible, user]);
  
  const canExcluir = useCallback((
    modulo: string,
    subModulo1: string = '-',
    subModulo2: string = '-',
    campo: string = '-'
  ): boolean => {
    if (user?.email?.includes('admin_global') || user?.usuario === 'admin_global') return true;

    if (!isVisible(modulo, subModulo1, subModulo2, campo)) return false;
    
    if (subModulo2 !== '-') {
      const perm = findPermission(modulo, subModulo1, subModulo2, '-');
      if (perm) return perm.excluir ?? true;
    }
    if (subModulo1 !== '-') {
      const perm = findPermission(modulo, subModulo1, '-', '-');
      if (perm) return perm.excluir ?? true;
    }
    return true;
  }, [findPermission, isVisible, user]);
  
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
    enabledModules,
  };
};

export default usePermissions;
