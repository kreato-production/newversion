import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { CentroLucroFormBody, type CentroLucro } from '@/components/admin/CentroLucroFormBody';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { CENTROS_LUCRO_ROUTES } from '@/modules/parametrizacoes/centros-lucro.navigation';

const repository = new ApiParametrizacoesRepository();

const CentroLucroForm = ({ id }: { id?: string }) => (
  <RecordFormPage<CentroLucro, CentroLucro>
    id={id}
    routes={CENTROS_LUCRO_ROUTES}
    newTitle="Novo Centro de Custos"
    editTitle={(record) => record?.nome || 'Editar Centro de Custos'}
    description={(isEditing) =>
      `Preencha os campos para ${isEditing ? 'editar' : 'cadastrar'} o centro de custos.`
    }
    notFoundTitle="Centro de custos não encontrado"
    load={async (recordId) => (await repository.getCentroLucro(recordId)) as CentroLucro}
    save={(data) =>
      repository.saveCentroLucro({
        ...(id ? { id } : {}),
        codigoExterno: data.codigoExterno || '',
        nome: data.nome,
        descricao: data.descricao || '',
        status: data.status,
        parentId: data.parentId,
      })
    }
    messages={{ created: 'Centro de Custos cadastrado!', updated: 'Centro de Custos atualizado!' }}
  >
    {(props) => <CentroLucroFormBody {...props} />}
  </RecordFormPage>
);

export default CentroLucroForm;
