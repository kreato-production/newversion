import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { ContaPagarFormBody } from '@/components/financeiro/ContaPagarFormBody';
import {
  ApiContasPagarRepository,
  type ContaPagar,
  type SaveContaPagarInput,
} from '@/modules/financeiro/contas-pagar.api';
import { CONTAS_PAGAR_ROUTES } from '@/modules/financeiro/contas-pagar.navigation';

const repository = new ApiContasPagarRepository();

const ContaPagarForm = ({ id }: { id?: string }) => (
  <RecordFormPage<ContaPagar, SaveContaPagarInput>
    id={id}
    routes={CONTAS_PAGAR_ROUTES}
    // Same permission the API enforces on POST / PUT /contas-pagar.
    permission={['Financeiro', 'Contas a Pagar']}
    newTitle="Nova Conta a Pagar"
    editTitle={(record) => record?.descricao || record?.numeroDocumento || 'Editar Conta a Pagar'}
    notFoundTitle="Conta a pagar não encontrada"
    load={(recordId) => repository.getById(recordId)}
    save={(input) => repository.save(input)}
    messages={{ created: 'Conta criada com sucesso', updated: 'Conta atualizada com sucesso' }}
  >
    {(props) => <ContaPagarFormBody {...props} />}
  </RecordFormPage>
);

export default ContaPagarForm;
