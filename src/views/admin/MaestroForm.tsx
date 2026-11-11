import { useState } from 'react';
import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { MaestroFormBody } from '@/components/admin/MaestroFormBody';
import { ExecResultDialog, type ExecResultPayload } from '@/components/admin/ExecResultDialog';
import { useToast } from '@/hooks/use-toast';
import {
  ApiMaestroRepository,
  type Maestro,
  type SaveMaestroInput,
} from '@/modules/maestro/maestro.api';
import { MAESTRO_ROUTES } from '@/modules/maestro/maestro.navigation';

const repository = new ApiMaestroRepository();

const MaestroForm = ({ id }: { id?: string }) => {
  const { toast } = useToast();
  const [execResult, setExecResult] = useState<ExecResultPayload | null>(null);

  const handleExecute = async (recordId: string): Promise<ExecResultPayload> => {
    try {
      const res = await repository.execute(recordId);
      const payload: ExecResultPayload = {
        resultado: res.resultado,
        erro: res.erro,
        ultimaExecucao: res.maestro.ultimaExecucao,
        sincronizados: res.sincronizados,
      };
      setExecResult(payload);
      return payload;
    } catch (err) {
      toast({
        title: 'Erro',
        description: `Erro ao executar: ${(err as Error).message}`,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return (
    <>
      <RecordFormPage<Maestro, SaveMaestroInput>
        id={id}
        routes={MAESTRO_ROUTES}
        newTitle="Novo Maestro"
        editTitle={(record) => record?.nome || 'Editar Maestro'}
        notFoundTitle="Tarefa não encontrada"
        load={(recordId) => repository.getById(recordId)}
        save={(input) => repository.save(input)}
        messages={{ created: 'Tarefa criada!', updated: 'Tarefa actualizada!' }}
        createLabel="Cadastrar"
      >
        {(props) => <MaestroFormBody {...props} onExecute={handleExecute} />}
      </RecordFormPage>

      <ExecResultDialog
        isOpen={!!execResult}
        onClose={() => setExecResult(null)}
        result={execResult}
      />
    </>
  );
};

export default MaestroForm;
