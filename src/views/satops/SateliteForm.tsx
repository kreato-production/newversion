import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { SateliteFormBody } from '@/components/satops/SateliteFormBody';
import { ApiSatOpsRepository } from '@/modules/satops/satops.api.repository';
import { SATELITES_ROUTES } from '@/modules/satops/satelites.navigation';
import type { SateliteItem } from '@/views/satops/Satelites';

const repository = new ApiSatOpsRepository();

const SateliteForm = ({ id }: { id?: string }) => (
  <RecordFormPage<SateliteItem, SateliteItem>
    id={id}
    routes={SATELITES_ROUTES}
    permission={['SatOps', 'Satélites']}
    newTitle="Novo Satélite"
    editTitle={(record) => record?.nome || 'Editar Satélite'}
    notFoundTitle="Satélite não encontrado"
    load={async (recordId) => (await repository.getSatelite(recordId)) as unknown as SateliteItem}
    save={(data) =>
      repository.saveSatelite({
        ...(id ? { id } : {}),
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        transponder: data.transponder,
        frequenciaUplink: data.frequenciaUplink,
        polarizacao: data.polarizacao,
        symbolRate: data.symbolRate,
        fec: data.fec,
        checklist: data.checklist,
        traducoes: data.traducoes,
      } as Parameters<ApiSatOpsRepository['saveSatelite']>[0])
    }
    messages={{ created: 'Satélite cadastrado!', updated: 'Satélite atualizado!' }}
  >
    {(props) => <SateliteFormBody {...props} />}
  </RecordFormPage>
);

export default SateliteForm;
