import { apiRequest } from '@/lib/api/http';

export type EventoExpositor = {
  id: string;
  nome: string;
  logo: string | null;
  tipoExpositorNome: string;
};

export type AgendaAtividade = {
  id: string;
  horarioInicio: string;
  horarioFim: string;
  titulo: string;
  descricao: string;
  cor: string;
  executada: boolean;
};

export type AgendaDia = {
  id: string;
  data: string;
  atividades: AgendaAtividade[];
};

export type OrcamentoEventoItem = {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoIds: string[];
  servicoNomes: string[];
  centroLucroId: string | null;
  centroLucroNome: string | null;
  valor: number;
  moeda: string;
  dataPagamento: string | null;
};

export type Evento = {
  id: string;
  codigoExterno: string;
  nome: string;
  tipoEventoId: string | null;
  unidadeNegocioId: string | null;
  descricao: string;
  tags: string[];
  inicioEvento: string | null;
  fimEvento: string | null;
  local: string;
  latitude: string;
  longitude: string;
  publicoEstimado: string;
  expositores: EventoExpositor[];
  layoutArquivo: string | null;
  layoutNome: string | null;
  layoutTipo: string | null;
  agenda: AgendaDia[];
  orcamentoItens: OrcamentoEventoItem[];
  createdAt: string;
  createdBy: string;
};

export type SaveEventoInput = {
  id?: string;
  codigoExterno?: string | null;
  nome: string;
  tipoEventoId?: string | null;
  unidadeNegocioId?: string | null;
  descricao?: string | null;
  tags?: string[];
  inicioEvento?: string | null;
  fimEvento?: string | null;
  local?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  publicoEstimado?: string | null;
  expositores?: EventoExpositor[];
  layoutArquivo?: string | null;
  layoutNome?: string | null;
  layoutTipo?: string | null;
  agenda?: AgendaDia[];
  orcamentoItens?: OrcamentoEventoItem[];
};

type ListResponse = { total: number; data: Evento[] };

export class ApiEventosRepository {
  list(opts?: { limit?: number; offset?: number }): Promise<ListResponse> {
    const params = new URLSearchParams();
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    if (opts?.offset != null) params.set('offset', String(opts.offset));
    const qs = params.toString();
    return apiRequest(`/gestao-eventos${qs ? `?${qs}` : ''}`);
  }

  save(input: SaveEventoInput): Promise<Evento> {
    const path = input.id ? `/gestao-eventos/${input.id}` : '/gestao-eventos';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest(path, { method, body: JSON.stringify(input) });
  }

  remove(id: string): Promise<void> {
    return apiRequest(`/gestao-eventos/${id}`, { method: 'DELETE' });
  }
}
