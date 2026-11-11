import { RecordFormPage } from '@/components/shared/RecordFormPage';
import {
  OrcamentoFormBody,
  type OrcamentoHeaderInput,
} from '@/components/financeiro/OrcamentoFormBody';
import { ApiOrcamentoRepository, type Orcamento } from '@/modules/financeiro/orcamento.api';
import { ORCAMENTO_ROUTES } from '@/modules/financeiro/orcamento.navigation';

const repository = new ApiOrcamentoRepository();

const OrcamentoForm = ({ id }: { id?: string }) => (
  <RecordFormPage<Orcamento, OrcamentoHeaderInput>
    id={id}
    routes={ORCAMENTO_ROUTES}
    // Same permission the API enforces on POST / PUT /orcamento.
    permission={['Financeiro', 'Orçamento']}
    newTitle="Novo Orçamento"
    editTitle={(record) =>
      record
        ? `Orçamento ${record.ano} — ${record.centroLucroNome || ''}`.trim()
        : 'Editar Orçamento'
    }
    description={(isEditing) =>
      isEditing
        ? 'Os itens são salvos linha a linha; o botão Salvar grava o cabeçalho.'
        : 'Depois de salvar, abra o orçamento para lançar os itens.'
    }
    notFoundTitle="Orçamento não encontrado"
    load={(recordId) => repository.getById(recordId)}
    save={(input) => repository.save({ ...input, id })}
    messages={{ created: 'Orçamento criado', updated: 'Orçamento atualizado' }}
  >
    {(props) => <OrcamentoFormBody {...props} />}
  </RecordFormPage>
);

export default OrcamentoForm;
