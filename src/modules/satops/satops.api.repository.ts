import { apiRequest } from '@/lib/api/http';

export type EstadoEventoApiItem = {
  id: string;
  codigoExterno: string;
  nome: string;
  cor: string;
  traducoes?: Record<string, string> | null;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type SateliteApiItem = {
  id: string;
  codigoExterno: string;
  nome: string;
  transponder: string;
  frequenciaUplink: string;
  polarizacao: string;
  symbolRate: string;
  fec: string;
  checklist?: unknown;
  traducoes?: Record<string, string> | null;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type JanelaResponsavel = {
  id: string;
  recursoTecnicoId: string;
  recursoTecnicoNome: string;
  recursoHumanoId: string;
  recursoHumanoNome: string;
  telefone: string;
  email: string;
  foto: string | null;
  disponibilidade: string;
};

export type JanelaApiItem = {
  id: string;
  sateliteId: string;
  sateliteNome: string;
  dataEvento: string;
  tipoEvento: string;
  canal: string;
  tituloEvento: string;
  programaId: string;
  programaNome: string;
  aberturaPrevia: string;
  aberturaReal: string;
  confirmacaoNocId: string;
  confirmacaoNocNome: string;
  fechoPrevisto: string;
  fechoReal: string;
  responsaveis: JanelaResponsavel[] | null;
  checklist: unknown | null;
  simulacao: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type AlertaApiItem = {
  id: string;
  nome: string;
  tempoParaAlerta: string;
  regra: string;
  campoReferencia: string;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type GrelhaPrograma = {
  id: string;
  nome: string;
  programa: string | null;
  idPrograma: string | null;
  episodio: string | null;
  horarioInicio: string | null;
};

type ListResponse<T> = {
  data: T[];
  total: number;
};

export class ApiSatOpsRepository {
  // ── Estados de Evento ──────────────────────────────────────────────────────

  listEstadosEvento(): Promise<ListResponse<EstadoEventoApiItem>> {
    return apiRequest('/satops/estados-evento');
  }

  saveEstadoEvento(
    input: Partial<EstadoEventoApiItem> & { nome: string },
  ): Promise<EstadoEventoApiItem> {
    const path = input.id ? `/satops/estados-evento/${input.id}` : '/satops/estados-evento';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest(path, { method, body: JSON.stringify(input) });
  }

  removeEstadoEvento(id: string): Promise<void> {
    return apiRequest(`/satops/estados-evento/${id}`, { method: 'DELETE' });
  }

  // ── Satélites ──────────────────────────────────────────────────────────────

  listSatelites(): Promise<ListResponse<SateliteApiItem>> {
    return apiRequest('/satops/satelites');
  }

  saveSatelite(input: Partial<SateliteApiItem> & { nome: string }): Promise<SateliteApiItem> {
    const path = input.id ? `/satops/satelites/${input.id}` : '/satops/satelites';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest(path, { method, body: JSON.stringify(input) });
  }

  removeSatelite(id: string): Promise<void> {
    return apiRequest(`/satops/satelites/${id}`, { method: 'DELETE' });
  }

  // ── Janelas ────────────────────────────────────────────────────────────────

  listJanelas(): Promise<ListResponse<JanelaApiItem>> {
    return apiRequest('/satops/janelas');
  }

  saveJanela(input: Partial<JanelaApiItem> & Record<string, unknown>): Promise<JanelaApiItem> {
    const path = input.id ? `/satops/janelas/${input.id}` : '/satops/janelas';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest(path, { method, body: JSON.stringify(input) });
  }

  removeJanela(id: string): Promise<void> {
    return apiRequest(`/satops/janelas/${id}`, { method: 'DELETE' });
  }

  // ── Alertas ────────────────────────────────────────────────────────────────

  listAlertas(): Promise<ListResponse<AlertaApiItem>> {
    return apiRequest('/satops/alertas');
  }

  saveAlerta(input: Partial<AlertaApiItem> & { nome: string }): Promise<AlertaApiItem> {
    const path = input.id ? `/satops/alertas/${input.id}` : '/satops/alertas';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest(path, { method, body: JSON.stringify(input) });
  }

  removeAlerta(id: string): Promise<void> {
    return apiRequest(`/satops/alertas/${id}`, { method: 'DELETE' });
  }

  listCanais(): Promise<string[]> {
    return apiRequest('/satops/janelas/canais');
  }

  listProgramas(canal: string, data: string): Promise<GrelhaPrograma[]> {
    const params = new URLSearchParams({ canal, data });
    return apiRequest(`/satops/janelas/programas?${params.toString()}`);
  }
}
