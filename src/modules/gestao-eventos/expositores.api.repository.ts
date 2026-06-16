import { apiRequest } from '@/lib/api/http';

export type ExpositorProduto = {
  id: string;
  nome: string;
  descricao?: string | null;
  preco?: string | null;
};

export type Expositor = {
  id: string;
  codigoExterno: string;
  nome: string;
  logo: string | null;
  tipoExpositorId: string | null;
  tipoExpositorNome: string;
  descricao: string;
  tags: string[];
  contato: string;
  telefone: string;
  email: string;
  instagram: string;
  facebook: string;
  produtos: ExpositorProduto[];
  createdAt: string;
  createdBy: string;
};

export type SaveExpositorInput = {
  id?: string;
  codigoExterno?: string | null;
  nome: string;
  logo?: string | null;
  tipoExpositorId?: string | null;
  descricao?: string | null;
  tags?: string[];
  contato?: string | null;
  telefone?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  produtos?: ExpositorProduto[];
};

type ListResponse = { total: number; data: Expositor[] };

export class ApiExpositoresRepository {
  list(opts?: { limit?: number; offset?: number }): Promise<ListResponse> {
    const params = new URLSearchParams();
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    if (opts?.offset != null) params.set('offset', String(opts.offset));
    const qs = params.toString();
    return apiRequest(`/expositores${qs ? `?${qs}` : ''}`);
  }

  save(input: SaveExpositorInput): Promise<Expositor> {
    const path = input.id ? `/expositores/${input.id}` : '/expositores';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest(path, { method, body: JSON.stringify(input) });
  }

  remove(id: string): Promise<void> {
    return apiRequest(`/expositores/${id}`, { method: 'DELETE' });
  }
}
