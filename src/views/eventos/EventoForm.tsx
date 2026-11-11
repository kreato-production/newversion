import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { EventoFormBody } from '@/components/eventos/EventoFormBody';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ApiEventosRepository,
  type Evento,
  type SaveEventoInput,
} from '@/modules/gestao-eventos/gestao-eventos.api.repository';
import { EVENTOS_ROUTES } from '@/modules/gestao-eventos/eventos.navigation';

const repository = new ApiEventosRepository();

const EventoForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();

  return (
    <RecordFormPage<Evento, SaveEventoInput>
      id={id}
      routes={EVENTOS_ROUTES}
      permission={['Gestão de Eventos', 'Eventos']}
      newTitle="Novo Evento"
      editTitle={(record) => record?.nome || 'Editar Evento'}
      notFoundTitle="Evento não encontrado"
      load={(recordId) => repository.getById(recordId)}
      save={(input) => repository.save({ ...input, id })}
      messages={{
        created: 'Evento salvo!',
        updated: `Evento ${t('common.updated').toLowerCase()}!`,
      }}
    >
      {(props) => <EventoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default EventoForm;
