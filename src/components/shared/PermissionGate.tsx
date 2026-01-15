import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  modulo: string;
  subModulo1?: string;
  subModulo2?: string;
  campo?: string;
  /** Tipo de ação a verificar */
  action?: 'view' | 'incluir' | 'alterar' | 'excluir';
  children: ReactNode;
  /** Conteúdo alternativo quando não tem permissão */
  fallback?: ReactNode;
}

/**
 * Componente gate que renderiza children apenas se o usuário tem permissão.
 * 
 * Uso para botões de ação:
 * <PermissionGate modulo="Produção" subModulo1="Tarefas" action="incluir">
 *   <Button>Nova Tarefa</Button>
 * </PermissionGate>
 * 
 * Uso para visibilidade geral:
 * <PermissionGate modulo="Produção" subModulo1="Tarefas">
 *   <ComponenteCompleto />
 * </PermissionGate>
 */
export const PermissionGate = ({
  modulo,
  subModulo1 = '-',
  subModulo2 = '-',
  campo = '-',
  action = 'view',
  children,
  fallback = null,
}: PermissionGateProps) => {
  const { isVisible, canIncluir, canAlterar, canExcluir } = usePermissions();
  
  let hasPermission = false;
  
  switch (action) {
    case 'view':
      hasPermission = isVisible(modulo, subModulo1, subModulo2, campo);
      break;
    case 'incluir':
      hasPermission = canIncluir(modulo, subModulo1, subModulo2, campo);
      break;
    case 'alterar':
      hasPermission = canAlterar(modulo, subModulo1, subModulo2, campo);
      break;
    case 'excluir':
      hasPermission = canExcluir(modulo, subModulo1, subModulo2, campo);
      break;
  }
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default PermissionGate;
