import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { EquipeFormBody } from '@/components/recursos/EquipeFormBody';
import { useLanguage } from '@/contexts/LanguageContext';
import { equipesRepository } from '@/modules/equipes/equipes.repository.provider';
import { EQUIPES_ROUTES } from '@/modules/equipes/equipes.navigation';
import type { Equipe, EquipeInput } from '@/modules/equipes/equipes.types';

const EquipeForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();

  return (
    <RecordFormPage<Equipe, EquipeInput>
      id={id}
      routes={EQUIPES_ROUTES}
      permission={['Recursos', 'Equipes']}
      newTitle={t('teams.new')}
      editTitle={(record) => record?.descricao || t('teams.edit')}
      notFoundTitle="Equipe não encontrada"
      load={(recordId) => equipesRepository.getById(recordId)}
      save={(input) => (id ? equipesRepository.update(id, input) : equipesRepository.create(input))}
      messages={{ created: t('teams.created'), updated: t('teams.updated') }}
    >
      {(props) => <EquipeFormBody {...props} />}
    </RecordFormPage>
  );
};

export default EquipeForm;
