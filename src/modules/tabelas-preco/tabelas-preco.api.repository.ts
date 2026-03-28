import { apiRequest } from '@/lib/api/http';
import type {
  RecursoOption,
  TabelaPrecoInput,
  TabelaPrecoItem,
  TabelaPrecoRecursoItem,
  UnidadeNegocioOption,
} from './tabelas-preco.types';

export class ApiTabelasPrecoRepository {
  async list(): Promise<TabelaPrecoItem[]> {
    const response = await apiRequest<{ data: TabelaPrecoItem[] }>('/tabelas-preco');
    return response.data;
  }

  async listOptions(): Promise<{ unidades: UnidadeNegocioOption[] }> {
    return apiRequest<{ unidades: UnidadeNegocioOption[] }>('/tabelas-preco/options');
  }

  async save(input: TabelaPrecoInput): Promise<TabelaPrecoItem> {
    const path = input.id ? `/tabelas-preco/${input.id}` : '/tabelas-preco';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest<TabelaPrecoItem>(path, {
      method,
      body: JSON.stringify({
        ...input,
        codigoExterno: input.codigoExterno?.trim() || '',
        descricao: input.descricao?.trim() || '',
        unidadeNegocioId: input.unidadeNegocioId?.trim() || null,
        tenantId: input.tenantId ?? null,
        vigenciaInicio: input.vigenciaInicio || null,
        vigenciaFim: input.vigenciaFim || null,
      }),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/tabelas-preco/${id}`, { method: 'DELETE' });
  }

  async listRecursos(
    tabelaPrecoId: string,
    tipo: 'tecnico' | 'fisico',
  ): Promise<{ items: TabelaPrecoRecursoItem[]; recursos: RecursoOption[] }> {
    return apiRequest<{ items: TabelaPrecoRecursoItem[]; recursos: RecursoOption[] }>(
      `/tabelas-preco/${tabelaPrecoId}/recursos/${tipo}`,
    );
  }

  async addRecurso(
    tabelaPrecoId: string,
    tipo: 'tecnico' | 'fisico',
    recursoId: string,
    valorHora: number,
  ): Promise<{ items: TabelaPrecoRecursoItem[]; recursos: RecursoOption[] }> {
    return apiRequest<{ items: TabelaPrecoRecursoItem[]; recursos: RecursoOption[] }>(
      `/tabelas-preco/${tabelaPrecoId}/recursos/${tipo}`,
      {
        method: 'POST',
        body: JSON.stringify({ recursoId, valorHora }),
      },
    );
  }

  async removeRecurso(
    tabelaPrecoId: string,
    tipo: 'tecnico' | 'fisico',
    itemId: string,
  ): Promise<void> {
    await apiRequest(`/tabelas-preco/${tabelaPrecoId}/recursos/${tipo}/${itemId}`, {
      method: 'DELETE',
    });
  }
}
