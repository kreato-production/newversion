import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { EscalaFormBody } from '@/components/recursos/EscalaFormBody';
import { useLanguage } from '@/contexts/LanguageContext';
import { escalasRepository } from '@/modules/escalas/escalas.repository.provider';
import { ESCALAS_PERMISSION_SCOPE, ESCALAS_ROUTES } from '@/modules/escalas/escalas.navigation';
import type { Escala, EscalaInput } from '@/modules/escalas/escalas.types';

const EscalaForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();
  return (
    <RecordFormPage<Escala, EscalaInput>
      id={id}
      routes={ESCALAS_ROUTES}
      permission={[
        ESCALAS_PERMISSION_SCOPE.modulo,
        ESCALAS_PERMISSION_SCOPE.subModulo1,
        ESCALAS_PERMISSION_SCOPE.subModulo2,
      ]}
      newTitle={t('scales.new')}
      editTitle={(record) => record?.titulo || t('scales.edit')}
      description={(isEditing) =>
        isEditing ? t('scales.editDescription') : t('scales.newDescription')
      }
      notFoundTitle="Escala não encontrada"
      load={(recordId) => escalasRepository.getById(recordId)}
      save={(data) => escalasRepository.save({ ...data, id })}
      messages={{ created: t('scales.created'), updated: t('scales.updated') }}
    >
      {(props) => <EscalaFormBody {...props} />}
    </RecordFormPage>
  );
};

export default EscalaForm;
