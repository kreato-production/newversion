import ParametroListPage from '@/components/shared/ParametroListPage';

const TipoFigurino = () => {
  return (
    <ParametroListPage
      title="Tipo de Figurino"
      description="Gerencie os tipos de figurino disponíveis no sistema"
      entityName="Tipo de Figurino"
      storageKey="kreato_tipo_figurino"
    />
  );
};

export default TipoFigurino;
