import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { ProgramaFormBody } from '@/components/producao/ProgramaFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { programasRepository } from '@/modules/programas/programas.repository.provider';
import { PROGRAMAS_ROUTES } from '@/modules/programas/programas.navigation';
import type { Programa, ProgramaInput } from '@/modules/programas/programas.types';

const ProgramaForm = ({ id }: { id?: string }) => {
  const { user } = useAuth();

  return (
    <RecordFormPage<Programa, ProgramaInput>
      id={id}
      routes={PROGRAMAS_ROUTES}
      permission={['Produção', 'Programas']}
      newTitle="Novo Programa"
      editTitle={(record) => record?.nome || 'Editar Programa'}
      description={(isEditing) => `${isEditing ? 'Editar' : 'Adicionar'} programa.`}
      notFoundTitle="Programa não encontrado"
      load={(recordId) => programasRepository.getById(recordId)}
      save={(input) =>
        programasRepository.save({ ...input, tenantId: user?.tenantId ?? null }, user?.id)
      }
      messages={{ created: 'Programa criado!', updated: 'Programa atualizado!' }}
    >
      {(props) => <ProgramaFormBody {...props} />}
    </RecordFormPage>
  );
};

export default ProgramaForm;
