import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { RecursoFisicoFormBody } from '@/components/recursos/RecursoFisicoFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { recursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.repository.provider';
import { RECURSOS_FISICOS_ROUTES } from '@/modules/recursos-fisicos/recursos-fisicos.navigation';
import type {
  RecursoFisico,
  RecursoFisicoInput,
} from '@/modules/recursos-fisicos/recursos-fisicos.types';

const RecursoFisicoForm = ({ id }: { id?: string }) => {
  const { user } = useAuth();

  return (
    <RecordFormPage<RecursoFisico, RecursoFisicoInput>
      id={id}
      routes={RECURSOS_FISICOS_ROUTES}
      permission={['Recursos', 'Recursos Físicos']}
      newTitle="Novo Recurso Físico"
      editTitle={(record) => record?.nome || 'Editar Recurso Físico'}
      notFoundTitle="Recurso físico não encontrado"
      load={(recordId) => recursosFisicosRepository.getById(recordId)}
      save={(input) =>
        recursosFisicosRepository.save({ ...input, tenantId: user?.tenantId ?? null })
      }
      messages={{ created: 'Recurso físico criado!', updated: 'Recurso físico atualizado!' }}
    >
      {(props) => <RecursoFisicoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default RecursoFisicoForm;
