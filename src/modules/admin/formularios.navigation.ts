import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';

/**
 * Configuração dos campos de um formulário: `/admin/formularios/[id]`, onde o id é o do
 * formulário no `formsRegistry`. Não há criação (os formulários são fixos no código).
 */
export const FORMULARIOS_ROUTES: RecordRouteConfig = {
  basePath: '/admin/formularios',
  navStorageKey: 'kreato_formularios_nav',
};

export interface FormulariosTenant {
  id: string;
  nome: string;
}

const TENANT_STORAGE_KEY = 'kreato_formularios_tenant';

/** Tenant escolhido pelo GLOBAL_ADMIN na lista; a página do formulário configura esse tenant. */
export function saveFormulariosTenant(tenant: FormulariosTenant | null): void {
  try {
    if (tenant) sessionStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
    else sessionStorage.removeItem(TENANT_STORAGE_KEY);
  } catch {
    // Storage indisponível: o GLOBAL_ADMIN volta a escolher o tenant na lista.
  }
}

export function readFormulariosTenant(): FormulariosTenant | null {
  try {
    const raw = sessionStorage.getItem(TENANT_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as FormulariosTenant).id === 'string' &&
      typeof (parsed as FormulariosTenant).nome === 'string'
    ) {
      return parsed as FormulariosTenant;
    }
    return null;
  } catch {
    return null;
  }
}
