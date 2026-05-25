import { apiRequest } from '@/lib/api/http';

export type GrelhaProgramaItem = {
  id: string;
  tenantId: string;
  maestroId: string | null;
  apiId: string | null;
  // Campos na ordem do mapeamento Provys
  serie: string | null;
  idPrograma: string | null;
  programa: string | null;
  tipoRequisicao: string | null;
  genero: string | null;
  codigoProducao: string | null;
  tipoAquisicao: string | null;
  nome: string;
  tipoPrograma: string | null;
  categoria: string | null;
  canal: string | null;
  semana: string | null;
  tipoExibicao: string | null;
  episodio: string | null;
  dataExibicao: string | null;
  horarioInicio: string | null;
  duracao: string | null;
  statusGrelha: string | null;
  // Controlo
  statusPlaneamentoId: string | null;
  statusPlaneamentoNome: string | null;
  statusPlaneamentoCor: string | null;
  prevDataExibicao: string | null;
  prevHorarioInicio: string | null;
  prevDuracao: string | null;
  prevEpisodio: string | null;
  temAlteracao: boolean;
  gravacaoId: string | null;
  gravacaoNome: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ListGrelhaParams = {
  limit?: number;
  offset?: number;
  mes?: number;
  ano?: number;
  canal?: string;
};

export class ApiGrelhaProgramacaoRepository {
  list(params?: ListGrelhaParams): Promise<{ data: GrelhaProgramaItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.mes) query.set('mes', String(params.mes));
    if (params?.ano) query.set('ano', String(params.ano));
    if (params?.canal) query.set('canal', params.canal);
    const qs = query.toString();
    return apiRequest(`/grelha-programacao${qs ? `?${qs}` : ''}`);
  }

  getById(id: string): Promise<GrelhaProgramaItem> {
    return apiRequest(`/grelha-programacao/${id}`);
  }

  updateStatusPlaneamento(
    id: string,
    statusPlaneamentoId: string | null,
  ): Promise<GrelhaProgramaItem> {
    return apiRequest(`/grelha-programacao/${id}/status-planeamento`, {
      method: 'PATCH',
      body: JSON.stringify({ statusPlaneamentoId }),
    });
  }

  marcarAlteracaoVista(id: string): Promise<void> {
    return apiRequest(`/grelha-programacao/${id}/alteracao-vista`, { method: 'PATCH' });
  }

  linkGravacao(id: string, gravacaoId: string | null): Promise<GrelhaProgramaItem> {
    return apiRequest(`/grelha-programacao/${id}/gravacao`, {
      method: 'PATCH',
      body: JSON.stringify({ gravacaoId }),
    });
  }

  remove(id: string): Promise<void> {
    return apiRequest(`/grelha-programacao/${id}`, { method: 'DELETE' });
  }
}
