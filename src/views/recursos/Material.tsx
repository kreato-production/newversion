import ParametroListPage from '@/components/shared/ParametroListPage';

const Material = () => (
  <ParametroListPage
    title="Material"
    description="Gerencie os materiais disponíveis para os figurinos"
    entityName="Material"
    storageKey="kreato_material"
    permissionPath={['Recursos', 'Parametrizações', 'Material']}
  />
);

export default Material;
