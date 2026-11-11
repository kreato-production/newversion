import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { TemplateFormBody } from '@/components/producao/TemplateFormBody';
import {
  templatesRepository,
  type SaveTemplateInput,
  type Template,
} from '@/modules/templates/templates.api';
import { TEMPLATES_ROUTES } from '@/modules/templates/templates.navigation';

const TemplateForm = ({ id }: { id?: string }) => (
  <RecordFormPage<Template, SaveTemplateInput>
    id={id}
    routes={TEMPLATES_ROUTES}
    permission={['Produção', 'Templates']}
    newTitle="Novo Template"
    editTitle={(record) => record?.nome || 'Editar Template'}
    description={(isEditing) =>
      isEditing
        ? 'Edite os dados e etapas deste template de produção.'
        : 'Preencha os dados e defina as etapas do template de produção.'
    }
    notFoundTitle="Template não encontrado"
    load={(recordId) => templatesRepository.getById(recordId)}
    save={(input) => templatesRepository.save(input)}
    messages={{ created: 'Template criado.', updated: 'Template atualizado.' }}
  >
    {(props) => <TemplateFormBody {...props} />}
  </RecordFormPage>
);

export default TemplateForm;
