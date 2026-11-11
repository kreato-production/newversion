import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';

export const USUARIOS_ROUTES: RecordRouteConfig = {
  basePath: '/admin/usuarios',
  navStorageKey: 'kreato_usuarios_nav_ids',
};

export const GLOBAL_USUARIOS_ROUTES: RecordRouteConfig = {
  basePath: '/global/usuarios',
  navStorageKey: 'kreato_global_usuarios_nav_ids',
};
