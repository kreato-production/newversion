import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { RecursoHumanoFormBody } from '@/components/recursos/RecursoHumanoFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { recursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.repository.provider';
import { RECURSOS_HUMANOS_ROUTES } from '@/modules/recursos-humanos/recursos-humanos.navigation';
import type {
  RecursoHumano,
  RecursoHumanoInput,
} from '@/modules/recursos-humanos/recursos-humanos.types';

const RecursoHumanoForm = ({ id }: { id?: string }) => {
  const { user } = useAuth();
  return (
    <RecordFormPage<RecursoHumano, RecursoHumanoInput>
      id={id}
      routes={RECURSOS_HUMANOS_ROUTES}
      permission={['Recursos', 'Recursos Humanos']}
      newTitle="Novo Colaborador"
      editTitle={(record) =>
        record ? `${record.nome} ${record.sobrenome}`.trim() : 'Editar Colaborador'
      }
      description={() => 'Preencha os dados do colaborador.'}
      notFoundTitle="Colaborador não encontrado"
      load={(recordId) => recursosHumanosRepository.getById(recordId)}
      save={(data) =>
        recursosHumanosRepository.save({
          ...data,
          id,
          tenantId: user?.tenantId ?? null,
        })
      }
      messages={{ created: 'Colaborador criado!', updated: 'Colaborador atualizado!' }}
    >
      {(props) => <RecursoHumanoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default RecursoHumanoForm;
