import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';

export const TURNOS_ROUTES: RecordRouteConfig = {
  basePath: '/recursos/turnos',
  navStorageKey: 'kreato_turnos_nav_ids',
};

export const TURNOS_PERMISSION_SCOPE = {
  modulo: 'Recursos',
  subModulo1: 'Parametrizações',
  subModulo2: 'Turnos',
} as const;
