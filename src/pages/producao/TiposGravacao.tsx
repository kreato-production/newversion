import ParametroListPage from '@/components/shared/ParametroListPage';

const TiposGravacao = () => (
  <ParametroListPage
    title="Tipos de Gravação"
    description="Gerencie os tipos de gravação disponíveis no sistema"
    entityName="Tipo de Gravação"
    storageKey="kreato_tipos_gravacao"
  />
);

export default TiposGravacao;
