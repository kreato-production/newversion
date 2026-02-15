import ParametroListPage from '@/components/shared/ParametroListPage';

const Funcoes = () => (
  <ParametroListPage
    title="Funções"
    description="Gerencie as funções disponíveis"
    entityName="Função"
    storageKey="kreato_funcoes"
    permissionPath={['Recursos', 'Parametrizações', 'Funções']}
  />
);

export default Funcoes;
