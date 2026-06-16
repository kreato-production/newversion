import ParametroListPage from '@/components/shared/ParametroListPage';

const TipoExpositor = () => (
  <ParametroListPage
    title="Tipo de Expositor"
    description="Gerencie os tipos de expositor disponíveis no sistema"
    entityName="Tipo de Expositor"
    storageKey="kreato_tipo_expositor"
    permissionPath={['Gestão de Eventos', 'Parametrizações', 'Tipo de Expositor']}
    showCor
  />
);

export default TipoExpositor;
