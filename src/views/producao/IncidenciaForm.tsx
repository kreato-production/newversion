import { RecordFormPage } from '@/components/shared/RecordFormPage';
import {
  IncidenciaGravacaoFormBody,
  type IncidenciaFormData,
} from '@/components/producao/IncidenciaGravacaoFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ApiIncidenciasGravacaoRepository,
  type SaveIncidenciaGravacaoInput,
} from '@/modules/incidencias-gravacao/incidencias-gravacao.api';
import { INCIDENCIAS_ROUTES } from '@/modules/incidencias-gravacao/incidencias-gravacao.navigation';

const repository = new ApiIncidenciasGravacaoRepository();

const IncidenciaForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const entity = t('incident.entity');

  return (
    <RecordFormPage<IncidenciaFormData, SaveIncidenciaGravacaoInput>
      id={id}
      routes={INCIDENCIAS_ROUTES}
      permission={['Produção', 'Incidências de Gravação']}
      newTitle={`${t('common.new')} ${entity}`}
      editTitle={(record) => record?.titulo || `${t('common.edit')} ${entity}`}
      description={() => t('incident.formDescription')}
      notFoundTitle="Incidência não encontrada"
      load={(recordId) => repository.getById(recordId) as Promise<IncidenciaFormData>}
      save={(input) => repository.save({ ...input, id, created_by: user?.id || null })}
      messages={{
        created: `${entity} ${t('common.save').toLowerCase()}!`,
        updated: `${entity} ${t('common.update').toLowerCase()}!`,
      }}
    >
      {(props) => <IncidenciaGravacaoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default IncidenciaForm;
