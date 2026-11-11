import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { ConteudoFormBody } from '@/components/producao/ConteudoFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import { CONTEUDOS_ROUTES } from '@/modules/conteudos/conteudos.navigation';
import type { Conteudo, ConteudoInput } from '@/modules/conteudos/conteudos.types';

const ConteudoForm = ({ id }: { id?: string }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  return (
    <RecordFormPage<Conteudo, ConteudoInput>
      id={id}
      routes={CONTEUDOS_ROUTES}
      permission={['Produção', 'Conteúdo']}
      newTitle={t('content.new')}
      editTitle={(record) => record?.descricao || t('content.edit')}
      description={(isEditing) =>
        isEditing ? t('field.editContentData') : t('field.fillContentData')
      }
      notFoundTitle="Conteúdo não encontrado"
      load={(recordId) => conteudosRepository.getById(recordId)}
      save={(data) =>
        conteudosRepository.save({ ...data, id, tenantId: user?.tenantId ?? null }, user?.id)
      }
      messages={{ created: t('field.contentCreated'), updated: t('field.contentUpdated') }}
    >
      {(props) => <ConteudoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default ConteudoForm;
