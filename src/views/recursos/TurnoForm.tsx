import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { TurnoFormBody } from '@/components/recursos/TurnoFormBody';
import { useLanguage } from '@/contexts/LanguageContext';
import { turnosRepository } from '@/modules/turnos/turnos.repository.provider';
import { TURNOS_PERMISSION_SCOPE, TURNOS_ROUTES } from '@/modules/turnos/turnos.navigation';
import type { Turno, TurnoInput } from '@/modules/turnos/turnos.types';

const PERMISSION = [
  TURNOS_PERMISSION_SCOPE.modulo,
  TURNOS_PERMISSION_SCOPE.subModulo1,
  TURNOS_PERMISSION_SCOPE.subModulo2,
] as const;

const TurnoForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();

  return (
    <RecordFormPage<Turno, TurnoInput>
      id={id}
      routes={TURNOS_ROUTES}
      permission={PERMISSION}
      newTitle={t('turns.new')}
      editTitle={(record) => record?.nome || t('turns.edit')}
      description={(isEditing) =>
        isEditing ? t('turns.editDescription') : t('turns.newDescription')
      }
      notFoundTitle="Turno não encontrado"
      load={(recordId) => turnosRepository.getById(recordId)}
      save={(input) => turnosRepository.save({ ...input, id })}
      messages={{ created: t('turns.created'), updated: t('turns.updated') }}
    >
      {(props) => <TurnoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default TurnoForm;
