import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { GravacaoFormBody } from '@/components/producao/GravacaoFormBody';
import { useAuth } from '@/contexts/AuthContext';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';
import { GRAVACOES_ROUTES } from '@/modules/gravacoes/gravacoes.navigation';
import type { Gravacao, GravacaoInput } from '@/modules/gravacoes/gravacoes.types';

const loadGravacao = async (id: string): Promise<Gravacao> => {
  const record = await gravacoesRepository.getById(id);
  if (!record) throw new Error('Gravação não encontrada');
  return record;
};

const GravacaoForm = ({ id }: { id?: string }) => {
  const { user } = useAuth();
  return (
    <RecordFormPage<Gravacao, GravacaoInput>
      id={id}
      routes={GRAVACOES_ROUTES}
      permission={['Produção', 'Gravação']}
      newTitle="Nova Gravação"
      editTitle={(record) => record?.nome || 'Editar Gravação'}
      notFoundTitle="Gravação não encontrada"
      load={loadGravacao}
      save={(data) => gravacoesRepository.save({ ...data, id }, user?.id)}
      messages={{ created: 'Gravação criada!', updated: 'Gravação atualizada!' }}
    >
      {(props) => <GravacaoFormBody {...props} />}
    </RecordFormPage>
  );
};

export default GravacaoForm;
