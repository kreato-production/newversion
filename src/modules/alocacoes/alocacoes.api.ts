import { apiRequest } from '@/lib/api/http';

export type RecursosTabAllocation = {
  id: string;
  anchorDbId: string;
  tipo: 'tecnico' | 'fisico';
  recursoId: string;
  recursoNome: string;
  funcaoOperador?: string;
  estoqueItemId?: string;
  estoqueItemNome?: string;
  horas: Record<string, number>;
  recursosHumanos: Record<
    string,
    Array<{
      id: string;
      recursoHumanoId: string;
      nome: string;
      horaInicio: string;
      horaFim: string;
    }>
  >;
  horarios: Record<string, { horaInicio: string; horaFim: string }>;
};

export type RecursosTabDataResponse = {
  gravacao: {
    id: string;
    nome: string;
    codigo: string;
    dataPrevista: string;
    conteudoId: string;
  };
  data: RecursosTabAllocation[];
};

export type AllocationConflictItem = {
  gravacaoId: string;
  gravacaoNome: string;
  dataPrevista: string | null;
};

export type OverviewAllocationRow = {
  id: string;
  gravacaoId: string;
  parentRecursoId: string | null;
  recursoTecnicoId: string | null;
  recursoTecnicoNome: string | null;
  recursoTecnicoFuncaoOperador: string | null;
  recursoFisicoId: string | null;
  recursoFisicoNome: string | null;
  recursoHumanoId: string | null;
  recursoHumanoNome: string | null;
  recursoHumanoSobrenome: string | null;
  estoqueItemId: string | null;
  estoqueItemNome: string | null;
  estoqueItemCodigo: string | null;
  estoqueItemNumerador: number | null;
  horaInicio: string | null;
  horaFim: string | null;
};

export type OverviewResponse = {
  alocacoes: OverviewAllocationRow[];
  terceiros: Array<{
    gravacaoId: string;
    valor: number | null;
  }>;
};

export class ApiAlocacoesRepository {
  listByGravacao(gravacaoId: string): Promise<RecursosTabDataResponse> {
    return apiRequest(`/gravacoes/${gravacaoId}/alocacoes`);
  }

  listConflicts(
    gravacaoId: string,
    tipo: 'tecnico' | 'fisico',
    recursoId: string,
  ): Promise<{ data: AllocationConflictItem[] }> {
    const query = new URLSearchParams({ tipo, recursoId }).toString();
    return apiRequest(`/gravacoes/${gravacaoId}/alocacoes/conflitos?${query}`);
  }

  addAnchor(
    gravacaoId: string,
    input: { tipo: 'tecnico' | 'fisico'; recursoId: string; estoqueItemId?: string | null },
  ): Promise<RecursosTabAllocation> {
    return apiRequest(`/gravacoes/${gravacaoId}/alocacoes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateHorario(
    gravacaoId: string,
    allocationId: string,
    input: { horaInicio: string | null; horaFim: string | null; estoqueItemId?: string | null },
  ): Promise<unknown> {
    return apiRequest(`/gravacoes/${gravacaoId}/alocacoes/${allocationId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  addColaborador(
    gravacaoId: string,
    allocationId: string,
    input: { recursoHumanoId: string; horaInicio: string; horaFim: string },
  ): Promise<{
    id: string;
    recursoHumanoId: string;
    nome: string;
    horaInicio: string;
    horaFim: string;
  }> {
    return apiRequest(`/gravacoes/${gravacaoId}/alocacoes/${allocationId}/colaboradores`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  removeAllocation(gravacaoId: string, allocationId: string): Promise<void> {
    return apiRequest(`/gravacoes/${gravacaoId}/alocacoes/${allocationId}`, {
      method: 'DELETE',
    });
  }

  listOverview(): Promise<OverviewResponse> {
    return apiRequest('/alocacoes/overview');
  }
}
