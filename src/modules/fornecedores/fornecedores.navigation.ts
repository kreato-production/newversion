import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';

/** Fornecedores live under Recursos and Gestão de Eventos: the list path comes from the URL. */
export function fornecedoresRoutes(basePath: string): RecordRouteConfig {
  return { basePath, navStorageKey: 'kreato_fornecedores_nav_ids' };
}
