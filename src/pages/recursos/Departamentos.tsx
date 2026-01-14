import ParametroListPage from '@/components/shared/ParametroListPage';

const Departamentos = () => (
  <ParametroListPage
    title="Departamentos"
    description="Gerencie os departamentos da organização"
    entityName="Departamento"
    storageKey="kreato_departamentos"
  />
);

export default Departamentos;
