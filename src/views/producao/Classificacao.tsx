import ParametroListPage from '@/components/shared/ParametroListPage';

const Classificacao = () => (
  <ParametroListPage
    title="Classificação"
    description="Gerencie as classificações de conteúdo"
    entityName="Classificação"
    storageKey="kreato_classificacao"
    permissionPath={['Produção', 'Parametrizações', 'Classificação']}
    showCor
  />
);

export default Classificacao;
