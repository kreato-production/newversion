import { apiRequest } from '@/lib/api/http';

export type CostRow = {
  mes: number;
  centroLucroId: string | null;
  centroLucroNome: string | null;
  unidadeId: string | null;
  unidadeNome: string | null;
  recursoNome: string;
  custo: number;
};

export type LookupItem = { id: string; nome: string };

export type ApropriacaoCustoResponse = {
  rows: CostRow[];
  centrosLucro: LookupItem[];
  unidades: LookupItem[];
};

export type ApropriacaoCustoParams = {
  ano: number;
  centroLucroId?: string | null;
  unidadeId?: string | null;
};

export class ApiApropriacoesCustoRepository {
  get(params: ApropriacaoCustoParams): Promise<ApropriacaoCustoResponse> {
    const qs = new URLSearchParams();
    qs.set('ano', String(params.ano));
    if (params.centroLucroId) qs.set('centroLucroId', params.centroLucroId);
    if (params.unidadeId) qs.set('unidadeId', params.unidadeId);
    return apiRequest(`/financeiro/apropriacoes-custo?${qs.toString()}`);
  }
}
