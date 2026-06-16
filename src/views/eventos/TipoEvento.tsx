import ParametroListPage from '@/components/shared/ParametroListPage';

const TipoEvento = () => (
  <ParametroListPage
    title="Tipo de Evento"
    description="Gerencie os tipos de evento disponíveis no sistema"
    entityName="Tipo de Evento"
    storageKey="kreato_tipo_evento"
    permissionPath={['Gestão de Eventos', 'Parametrizações', 'Tipo de Evento']}
    showCor
  />
);

export default TipoEvento;
