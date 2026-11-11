import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';

export const ESPACOS_ROUTES: RecordRouteConfig = {
  basePath: '/recursos/espacos',
  navStorageKey: 'kreato_espacos_nav_ids',
};

export const ESPACOS_PERMISSION_SCOPE = {
  modulo: 'Recursos',
  subModulo1: 'Espaços',
} as const;
