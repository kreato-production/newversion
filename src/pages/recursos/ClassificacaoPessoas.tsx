import ParametroListPage from '@/components/shared/ParametroListPage';

const ClassificacaoPessoas = () => (
  <ParametroListPage
    title="Classificação de Pessoas"
    description="Gerencie as classificações de pessoas (Jogador de Futebol, Atriz, Ator, etc.)"
    entityName="Classificação"
    storageKey="kreato_classificacao_pessoas"
  />
);

export default ClassificacaoPessoas;
