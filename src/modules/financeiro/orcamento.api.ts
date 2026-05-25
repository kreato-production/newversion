import { apiRequest } from '@/lib/api/http';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrcamentoItem = {
  id: string;
  orcamentoId: string;
  categoria: 'recursos_tecnicos' | 'equipamentos' | 'despesas';
  itemNome: string;
  recursoId: string | null;
  jan: number;
  fev: number;
  mar: number;
  abr: number;
  mai: number;
  jun: number;
  jul: number;
  ago: number;
  set: number;
  out: number;
  nov: number;
  dez: number;
};

export type Orcamento = {
  id: string;
  ano: number;
  centroLucroId: string;
  centroLucroNome: string;
  descricao: string;
  total: number;
};

export type OrcamentoComItens = Orcamento & { itens: OrcamentoItem[] };

export type SaveOrcamentoInput = {
  id?: string;
  ano: number;
  centroLucroId: string;
  descricao?: string;
};

export type SaveOrcamentoItemInput = {
  id?: string;
  categoria: 'recursos_tecnicos' | 'equipamentos' | 'despesas';
  itemNome: string;
  recursoId?: string | null;
  jan?: number;
  fev?: number;
  mar?: number;
  abr?: number;
  mai?: number;
  jun?: number;
  jul?: number;
  ago?: number;
  set?: number;
  out?: number;
  nov?: number;
  dez?: number;
};

export type OrcamentoListResponse = { data: Orcamento[]; total: number };

export type OrcamentoTotalPorCentro = {
  centroLucroId: string;
  jan: number;
  fev: number;
  mar: number;
  abr: number;
  mai: number;
  jun: number;
  jul: number;
  ago: number;
  set: number;
  out: number;
  nov: number;
  dez: number;
  total: number;
};

export type OrcamentoItemResumo = {
  centroLucroId: string;
  itemNome: string;
  jan: number;
  fev: number;
  mar: number;
  abr: number;
  mai: number;
  jun: number;
  jul: number;
  ago: number;
  set: number;
  out: number;
  nov: number;
  dez: number;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export class ApiOrcamentoRepository {
  list(opts?: { limit?: number; offset?: number }): Promise<OrcamentoListResponse> {
    const qs = new URLSearchParams();
    if (opts?.limit) qs.set('limit', String(opts.limit));
    if (opts?.offset) qs.set('offset', String(opts.offset));
    return apiRequest(`/orcamento?${qs.toString()}`);
  }

  listByAno(ano: number): Promise<Orcamento[]> {
    return apiRequest(`/orcamento/por-ano?ano=${ano}`);
  }

  listTotaisPorAno(ano: number): Promise<OrcamentoTotalPorCentro[]> {
    return apiRequest(`/orcamento/totais-por-ano?ano=${ano}`);
  }

  listItensPorAno(ano: number): Promise<OrcamentoItemResumo[]> {
    return apiRequest(`/orcamento/itens-por-ano?ano=${ano}`);
  }

  getById(id: string): Promise<OrcamentoComItens> {
    return apiRequest(`/orcamento/${id}`);
  }

  save(input: SaveOrcamentoInput): Promise<Orcamento> {
    if (input.id) {
      return apiRequest(`/orcamento/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    }
    return apiRequest('/orcamento', { method: 'POST', body: JSON.stringify(input) });
  }

  remove(id: string): Promise<void> {
    return apiRequest(`/orcamento/${id}`, { method: 'DELETE' });
  }

  listItens(orcamentoId: string): Promise<OrcamentoItem[]> {
    return apiRequest(`/orcamento/${orcamentoId}/itens`);
  }

  saveItem(orcamentoId: string, input: SaveOrcamentoItemInput): Promise<OrcamentoItem> {
    if (input.id) {
      return apiRequest(`/orcamento/${orcamentoId}/itens/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    }
    return apiRequest(`/orcamento/${orcamentoId}/itens`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  removeItem(orcamentoId: string, itemId: string): Promise<void> {
    return apiRequest(`/orcamento/${orcamentoId}/itens/${itemId}`, { method: 'DELETE' });
  }
}
