import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { DepartamentoFormBody } from '@/components/recursos/DepartamentoFormBody';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ApiDepartamentosRepository,
  type DepartamentoApiInput,
  type DepartamentoApiItem,
} from '@/modules/departamentos/departamentos.api.repository';
import { DEPARTAMENTOS_ROUTES } from '@/modules/departamentos/departamentos.navigation';

const repository = new ApiDepartamentosRepository();

const DepartamentoForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();

  return (
    <RecordFormPage<DepartamentoApiItem, DepartamentoApiInput>
      id={id}
      routes={DEPARTAMENTOS_ROUTES}
      permission={['Recursos', 'Departamentos']}
      newTitle="Novo Departamento"
      editTitle={(record) => record?.nome || 'Editar Departamento'}
      description={(isEditing) => `${isEditing ? 'Editar' : 'Cadastrar'} departamento.`}
      notFoundTitle="Departamento não encontrado"
      load={(recordId) => repository.getById(recordId)}
      save={(input) => repository.save(input)}
      messages={{
        created: 'Departamento salvo!',
        updated: `Departamento ${t('common.updated').toLowerCase()}!`,
      }}
    >
      {(props) => <DepartamentoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default DepartamentoForm;
