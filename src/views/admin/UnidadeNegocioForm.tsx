import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { UnidadeNegocioFormBody } from '@/components/admin/UnidadeNegocioFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';
import { UNIDADES_ROUTES } from '@/modules/unidades/unidades.navigation';
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';

const UnidadeNegocioForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <RecordFormPage<UnidadeNegocio, UnidadeNegocio>
      id={id}
      routes={UNIDADES_ROUTES}
      newTitle="Nova Unidade de Negócio"
      editTitle={(record) => record?.nome || 'Editar Unidade de Negócio'}
      description={(isEditing) =>
        `Preencha os campos abaixo para ${isEditing ? 'editar' : 'cadastrar'} a unidade de negócio.`
      }
      notFoundTitle="Unidade de negócio não encontrada"
      load={(recordId) => unidadesRepository.getById(recordId)}
      save={(input) => unidadesRepository.save(input, user?.id)}
      messages={{ created: t('businessUnits.saved'), updated: t('businessUnits.updated') }}
    >
      {(props) => <UnidadeNegocioFormBody {...props} />}
    </RecordFormPage>
  );
};

export default UnidadeNegocioForm;
