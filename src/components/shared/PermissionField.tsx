import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionFieldProps {
  modulo: string;
  subModulo1?: string;
  subModulo2?: string;
  campo: string;
  children: ReactNode;
  /** Se true, renderiza disabled version ao invés de ocultar quando invisível */
  showDisabledWhenInvisible?: boolean;
}

/**
 * Componente que controla visibilidade e somenteLeitura de campos
 * baseado nas permissões do perfil do usuário logado.
 * 
 * Uso:
 * <PermissionField modulo="Produção" subModulo1="Tarefas" campo="Data Limite">
 *   <Input ... />
 * </PermissionField>
 */
export const PermissionField = ({
  modulo,
  subModulo1 = '-',
  subModulo2 = '-',
  campo,
  children,
  showDisabledWhenInvisible = false,
}: PermissionFieldProps) => {
  const { isVisible, isReadOnly } = usePermissions();
  
  const visible = isVisible(modulo, subModulo1, subModulo2, campo);
  const readOnly = isReadOnly(modulo, subModulo1, subModulo2, campo);
  
  if (!visible) {
    if (showDisabledWhenInvisible) {
      // Renderiza children com disabled
      return <div className="opacity-50 pointer-events-none">{children}</div>;
    }
    return null;
  }
  
  if (readOnly) {
    // Envolve children em container que aplica estilos de disabled
    return (
      <div className="[&_input]:bg-muted [&_input]:cursor-not-allowed [&_textarea]:bg-muted [&_textarea]:cursor-not-allowed [&_button]:pointer-events-none [&_button]:opacity-70 [&_select]:pointer-events-none [&_.select-trigger]:pointer-events-none [&_.select-trigger]:bg-muted">
        <div className="pointer-events-none">
          {children}
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

/**
 * Hook helper para criar props de campo baseado em permissões
 */
export const useFieldPermission = (
  modulo: string,
  subModulo1: string = '-',
  subModulo2: string = '-',
  campo: string
) => {
  const { isVisible, isReadOnly } = usePermissions();
  
  const visible = isVisible(modulo, subModulo1, subModulo2, campo);
  const readOnly = isReadOnly(modulo, subModulo1, subModulo2, campo);
  
  return {
    visible,
    readOnly,
    disabled: readOnly,
    className: readOnly ? 'bg-muted cursor-not-allowed' : '',
  };
};

export default PermissionField;
