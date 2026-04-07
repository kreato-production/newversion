import { apiRequest } from '@/lib/api/http';

export type ContaPagar = {
  id: string;
  numeroDocumento: string;
  descricao: string;
  fornecedorId: string;
  fornecedorNome: string;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento: string;
  valor: number;
  valorPago: number | null;
  statusId: string;
  statusNome: string;
  statusCor: string;
  categoriaId: string;
  categoriaNome: string;
  formaPagamentoId: string;
  formaPagamentoNome: string;
  tipoDocumentoId: string;
  tipoDocumentoNome: string;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = { data: ContaPagar[]; total: number };

export type SaveContaPagarInput = {
  id?: string;
  numeroDocumento?: string | null;
  descricao: string;
  fornecedorId?: string | null;
  dataEmissao?: string | null;
  dataVencimento: string;
  dataPagamento?: string | null;
  valor: number | null;
  valorPago?: number | null;
  statusId?: string | null;
  categoriaId?: string | null;
  formaPagamentoId?: string | null;
  tipoDocumentoId?: string | null;
  observacoes?: string | null;
};

export class ApiContasPagarRepository {
  list(opts?: { limit?: number; offset?: number }): Promise<ListResponse> {
    const params = new URLSearchParams();
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    if (opts?.offset != null) params.set('offset', String(opts.offset));
    const qs = params.toString();
    return apiRequest(`/contas-pagar${qs ? `?${qs}` : ''}`);
  }

  save(input: SaveContaPagarInput): Promise<ContaPagar> {
    const path = input.id ? `/contas-pagar/${input.id}` : '/contas-pagar';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest(path, { method, body: JSON.stringify(input) });
  }

  remove(id: string): Promise<void> {
    return apiRequest(`/contas-pagar/${id}`, { method: 'DELETE' });
  }
}
