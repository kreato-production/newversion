import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { JanelaFormBody } from '@/components/satops/JanelaFormBody';
import { ApiSatOpsRepository, type JanelaApiItem } from '@/modules/satops/satops.api.repository';
import { JANELAS_ROUTES } from '@/modules/satops/janelas.navigation';

const repository = new ApiSatOpsRepository();

const JanelaForm = ({ id }: { id?: string }) => (
  <RecordFormPage<JanelaApiItem, JanelaApiItem>
    id={id}
    routes={JANELAS_ROUTES}
    permission={['SatOps', 'Janelas']}
    newTitle="Nova Janela"
    editTitle={(record) => record?.tituloEvento || record?.sateliteNome || 'Editar Janela'}
    description={() => 'Configure os parâmetros da janela de transmissão via satélite.'}
    notFoundTitle="Janela não encontrada"
    load={(recordId) => repository.getJanela(recordId)}
    save={(data) =>
      repository.saveJanela({
        ...(id ? { id } : {}),
        sateliteId: data.sateliteId,
        sateliteNome: data.sateliteNome,
        dataEvento: data.dataEvento,
        tipoEvento: data.tipoEvento,
        canal: data.canal,
        tituloEvento: data.tituloEvento,
        programaId: data.programaId,
        programaNome: data.programaNome,
        aberturaPrevia: data.aberturaPrevia,
        aberturaReal: data.aberturaReal,
        confirmacaoNocId: data.confirmacaoNocId,
        confirmacaoNocNome: data.confirmacaoNocNome,
        fechoPrevisto: data.fechoPrevisto,
        fechoReal: data.fechoReal,
        responsaveis: data.responsaveis,
        simulacao: data.simulacao,
      })
    }
    messages={{ created: 'Janela cadastrada!', updated: 'Janela atualizada!' }}
  >
    {(props) => <JanelaFormBody {...props} />}
  </RecordFormPage>
);

export default JanelaForm;
