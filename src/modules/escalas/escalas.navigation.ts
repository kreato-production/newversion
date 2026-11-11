import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';

export const ESCALAS_ROUTES: RecordRouteConfig = {
  basePath: '/recursos/escalas',
  navStorageKey: 'kreato_escalas_nav_ids',
};

export const ESCALAS_PERMISSION_SCOPE = {
  modulo: 'Recursos',
  subModulo1: 'Parametrizações',
  subModulo2: 'Escalas',
} as const;
