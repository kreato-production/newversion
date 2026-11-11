import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { FigurinoFormBody } from '@/components/recursos/FigurinoFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { figurinosRepository } from '@/modules/figurinos/figurinos.repository.provider';
import { FIGURINOS_ROUTES } from '@/modules/figurinos/figurinos.navigation';
import type { Figurino, FigurinoInput } from '@/modules/figurinos/figurinos.types';

const FigurinoForm = ({ id }: { id?: string }) => {
  const { user } = useAuth();

  return (
    <RecordFormPage<Figurino, FigurinoInput>
      id={id}
      routes={FIGURINOS_ROUTES}
      permission={['Recursos', 'Figurinos']}
      newTitle="Novo Figurino"
      editTitle={(record) => record?.codigoFigurino || record?.descricao || 'Editar Figurino'}
      notFoundTitle="Figurino não encontrado"
      load={(recordId) => figurinosRepository.getById(recordId)}
      save={(input) => figurinosRepository.save({ ...input, tenantId: user?.tenantId ?? null })}
      messages={{
        created: 'O figurino foi criado com sucesso.',
        updated: 'O figurino foi atualizado com sucesso.',
      }}
    >
      {(props) => <FigurinoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default FigurinoForm;
