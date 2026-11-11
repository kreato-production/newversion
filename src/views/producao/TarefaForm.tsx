import { useRouter } from 'next/navigation';
import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { TarefaFormBody } from '@/components/producao/TarefaFormBody';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { ApiTarefasRepository, type Tarefa } from '@/modules/tarefas/tarefas.api';
import { TAREFAS_ROUTES } from '@/modules/tarefas/tarefas.navigation';

const repository = new ApiTarefasRepository();

const TarefaForm = ({ id }: { id?: string }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { canExcluir } = usePermissions();

  const handleDelete =
    id && canExcluir('Produção', 'Tarefas')
      ? async () => {
          try {
            await repository.remove(id);
            toast({ title: t('common.deleted') });
            router.push(TAREFAS_ROUTES.basePath);
          } catch (error) {
            console.error('Error deleting tarefa:', error);
            toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' });
          }
        }
      : undefined;

  return (
    <RecordFormPage<Tarefa, Tarefa>
      id={id}
      routes={TAREFAS_ROUTES}
      permission={['Produção', 'Tarefas']}
      newTitle={t('tasks.new')}
      editTitle={(record) => record?.titulo || t('tasks.edit')}
      description={() => t('tasks.formDescription')}
      notFoundTitle="Tarefa não encontrada"
      load={(recordId) => repository.getById(recordId)}
      save={(input) => repository.save({ ...input, id })}
      messages={{ created: t('tasks.created'), updated: t('tasks.updated') }}
    >
      {(props) => <TarefaFormBody {...props} onDelete={handleDelete} />}
    </RecordFormPage>
  );
};

export default TarefaForm;
