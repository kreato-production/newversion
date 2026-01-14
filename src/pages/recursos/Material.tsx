import ParametroListPage from '@/components/shared/ParametroListPage';

const Material = () => {
  return (
    <ParametroListPage
      title="Material"
      description="Gerencie os materiais disponíveis para os figurinos"
      entityName="Material"
      storageKey="kreato_material"
    />
  );
};

export default Material;
