import { apiRequest } from '@/lib/api/http';

export type Tarefa = {
  id: string;
  gravacaoId: string;
  gravacaoNome?: string;
  recursoHumanoId: string;
  recursoHumanoNome?: string;
  recursoTecnicoId?: string;
  recursoTecnicoNome?: string;
  titulo: string;
  descricao: string;
  statusId: string;
  statusNome?: string;
  statusCor?: string;
  statusCodigo?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  dataInicio: string;
  dataFim: string;
  horaInicio?: string;
  horaFim?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  observacoes?: string;
};

export type TarefaStatus = {
  id: string;
  codigo: string;
  nome: string;
  cor?: string;
  is_inicial?: boolean;
};

export type TarefaGravacao = {
  id: string;
  nome: string;
};

export type TarefaRecursoHumano = {
  id: string;
  nome: string;
  status?: string | null;
  funcaoId?: string;
};

export type TarefaOptionsResponse = {
  statusList: TarefaStatus[];
  gravacoes: TarefaGravacao[];
  recursosHumanos: TarefaRecursoHumano[];
};

function sanitize(input: Partial<Tarefa>) {
  return {
    ...(input.id ? { id: input.id } : {}),
    gravacaoId: input.gravacaoId || null,
    recursoHumanoId: input.recursoHumanoId || null,
    recursoTecnicoId: input.recursoTecnicoId || null,
    titulo: input.titulo?.trim() || '',
    descricao: input.descricao?.trim() || null,
    statusId: input.statusId || null,
    prioridade: input.prioridade || 'media',
    dataInicio: input.dataInicio || null,
    dataFim: input.dataFim || null,
    horaInicio: input.horaInicio || null,
    horaFim: input.horaFim || null,
    observacoes: input.observacoes?.trim() || null,
  };
}

export class ApiTarefasRepository {
  async list(): Promise<Tarefa[]> {
    const response = await apiRequest<{ data: Tarefa[] }>('/tarefas?limit=200&offset=0');
    return response.data;
  }

  listOptions(): Promise<TarefaOptionsResponse> {
    return apiRequest('/tarefas/options');
  }

  async listByGravacao(gravacaoId: string): Promise<Tarefa[]> {
    const response = await apiRequest<{ data: Tarefa[] }>(`/gravacoes/${gravacaoId}/tarefas`);
    return response.data;
  }

  async save(input: Partial<Tarefa>): Promise<Tarefa> {
    const path = input.id ? `/tarefas/${input.id}` : '/tarefas';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest(path, {
      method,
      body: JSON.stringify(sanitize(input)),
    });
  }

  remove(id: string): Promise<void> {
    return apiRequest(`/tarefas/${id}`, { method: 'DELETE' });
  }
}
