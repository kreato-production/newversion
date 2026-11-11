import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { TabelaPrecoFormBody } from '@/components/producao/TabelaPrecoFormBody';
import { ApiTabelasPrecoRepository } from '@/modules/tabelas-preco/tabelas-preco.api.repository';
import { TABELAS_PRECO_ROUTES } from '@/modules/tabelas-preco/tabelas-preco.navigation';
import type {
  TabelaPrecoInput,
  TabelaPrecoItem,
} from '@/modules/tabelas-preco/tabelas-preco.types';

const repository = new ApiTabelasPrecoRepository();

const TabelaPrecoForm = ({ id }: { id?: string }) => (
  <RecordFormPage<TabelaPrecoItem, TabelaPrecoInput>
    id={id}
    routes={TABELAS_PRECO_ROUTES}
    permission={['Produção', 'Parametrizações', 'Tabelas de Preços']}
    newTitle="Nova Tabela de Preço"
    editTitle={(record) => record?.nome || 'Editar Tabela de Preço'}
    description={(isEditing) =>
      isEditing
        ? 'Edite os dados e os recursos com preço desta tabela.'
        : 'Depois de salvar, abra a tabela para cadastrar os recursos.'
    }
    notFoundTitle="Tabela de preço não encontrada"
    load={(recordId) => repository.getById(recordId)}
    save={(input) => repository.save(input)}
    messages={{ created: 'Tabela de preço cadastrada!', updated: 'Tabela de preço atualizada!' }}
  >
    {(props) => <TabelaPrecoFormBody {...props} />}
  </RecordFormPage>
);

export default TabelaPrecoForm;
