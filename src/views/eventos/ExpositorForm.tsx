import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { ExpositorFormBody } from '@/components/eventos/ExpositorFormBody';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ApiExpositoresRepository,
  type Expositor,
  type SaveExpositorInput,
} from '@/modules/gestao-eventos/expositores.api.repository';
import { EXPOSITORES_ROUTES } from '@/modules/gestao-eventos/expositores.navigation';

const repository = new ApiExpositoresRepository();

const ExpositorForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();

  return (
    <RecordFormPage<Expositor, SaveExpositorInput>
      id={id}
      routes={EXPOSITORES_ROUTES}
      permission={['Gestão de Eventos', 'Expositores']}
      newTitle="Novo Expositor"
      editTitle={(record) => record?.nome || 'Editar Expositor'}
      notFoundTitle="Expositor não encontrado"
      load={(recordId) => repository.getById(recordId)}
      save={(input) => repository.save({ ...input, id })}
      messages={{
        created: 'Expositor salvo!',
        updated: `Expositor ${t('common.updated').toLowerCase()}!`,
      }}
    >
      {(props) => <ExpositorFormBody {...props} />}
    </RecordFormPage>
  );
};

export default ExpositorForm;
