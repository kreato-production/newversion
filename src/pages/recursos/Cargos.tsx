import ParametroListPage from '@/components/shared/ParametroListPage';

const Cargos = () => (
  <ParametroListPage
    title="Cargos"
    description="Gerencie os cargos dos recursos humanos"
    entityName="Cargo"
    storageKey="kreato_cargos"
    permissionPath={['Recursos', 'Parametrizações', 'Cargos']}
  />
);

export default Cargos;
