import ParametroListPage from '@/components/shared/ParametroListPage';

const StatusGravacao = () => (
  <ParametroListPage
    title="Status de Gravação"
    description="Gerencie os status possíveis para gravações"
    entityName="Status"
    storageKey="kreato_status_gravacao"
  />
);

export default StatusGravacao;
