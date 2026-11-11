import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { EspacoFormBody } from '@/components/recursos/EspacoFormBody';
import { useLanguage } from '@/contexts/LanguageContext';
import { espacosRepository } from '@/modules/espacos/espacos.repository.provider';
import { ESPACOS_PERMISSION_SCOPE, ESPACOS_ROUTES } from '@/modules/espacos/espacos.navigation';
import type { Espaco, EspacoInput } from '@/modules/espacos/espacos.types';

const EspacoForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();

  return (
    <RecordFormPage<Espaco, EspacoInput>
      id={id}
      routes={ESPACOS_ROUTES}
      permission={[ESPACOS_PERMISSION_SCOPE.modulo, ESPACOS_PERMISSION_SCOPE.subModulo1]}
      newTitle="Novo Espaço"
      editTitle={(record) => record?.titulo || 'Editar Espaço'}
      description={(isEditing) =>
        isEditing ? 'Altere os dados do espaço' : 'Preencha os dados para cadastrar o espaço.'
      }
      notFoundTitle="Espaço não encontrado"
      load={(recordId) => espacosRepository.getById(recordId)}
      save={(input) => espacosRepository.save(input)}
      messages={{ created: t('spaces.created'), updated: t('spaces.updated') }}
    >
      {(props) => <EspacoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default EspacoForm;
