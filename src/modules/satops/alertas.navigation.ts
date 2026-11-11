import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';

export const ALERTAS_ROUTES: RecordRouteConfig = {
  basePath: '/satops/alertas',
  navStorageKey: 'kreato_alertas_nav_ids',
};

/** HH:MM fields of the Janelas cadastro an alert can be relative to. */
export const JANELA_TIME_FIELDS = [
  { key: 'aberturaPrevia', label: 'Abertura Prévia' },
  { key: 'aberturaReal', label: 'Abertura Real' },
  { key: 'fechoPrevisto', label: 'Fecho Previsto' },
  { key: 'fechoReal', label: 'Fecho Real' },
] as const;
