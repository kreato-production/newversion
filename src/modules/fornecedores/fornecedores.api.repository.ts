import { apiRequest } from '@/lib/api/http';
import type {
  CategoriaFornecedorOption,
  Fornecedor,
  FornecedorArquivo,
  FornecedorInput,
  FornecedorServico,
  ServicoOption,
} from './fornecedores.types';

function normalizeInput(input: FornecedorInput): FornecedorInput {
  return {
    ...input,
    tenantId: input.tenantId ?? null,
    codigoExterno: input.codigoExterno?.trim() || '',
    nome: input.nome?.trim() || '',
    categoria: input.categoria || '',
    categoriaId: input.categoriaId || '',
    email: input.email?.trim() || '',
    pais: input.pais?.trim() || '',
    identificacaoFiscal: input.identificacaoFiscal?.trim() || '',
    descricao: input.descricao?.trim() || '',
  };
}

export class ApiFornecedoresRepository {
  async list(): Promise<Fornecedor[]> {
    const response = await apiRequest<{ data: Fornecedor[] }>('/fornecedores');
    return response.data;
  }

  async listOptions(): Promise<{ categorias: CategoriaFornecedorOption[] }> {
    return apiRequest<{ categorias: CategoriaFornecedorOption[] }>('/fornecedores/options');
  }

  async save(input: FornecedorInput): Promise<void> {
    const path = input.id ? `/fornecedores/${input.id}` : '/fornecedores';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(normalizeInput(input)),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/fornecedores/${id}`, { method: 'DELETE' });
  }

  async listServicos(
    fornecedorId: string,
  ): Promise<{ items: FornecedorServico[]; servicos: ServicoOption[] }> {
    return apiRequest<{ items: FornecedorServico[]; servicos: ServicoOption[] }>(
      `/fornecedores/${fornecedorId}/servicos`,
    );
  }

  async addServico(
    fornecedorId: string,
    servicoId: string,
    valor?: number | null,
  ): Promise<{ items: FornecedorServico[]; servicos: ServicoOption[] }> {
    return apiRequest<{ items: FornecedorServico[]; servicos: ServicoOption[] }>(
      `/fornecedores/${fornecedorId}/servicos`,
      {
        method: 'POST',
        body: JSON.stringify({ servicoId, valor: valor ?? null }),
      },
    );
  }

  async updateServico(
    fornecedorId: string,
    itemId: string,
    valor?: number | null,
  ): Promise<{ items: FornecedorServico[]; servicos: ServicoOption[] }> {
    return apiRequest<{ items: FornecedorServico[]; servicos: ServicoOption[] }>(
      `/fornecedores/${fornecedorId}/servicos/${itemId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ valor: valor ?? null }),
      },
    );
  }

  async removeServico(fornecedorId: string, itemId: string): Promise<void> {
    await apiRequest(`/fornecedores/${fornecedorId}/servicos/${itemId}`, { method: 'DELETE' });
  }

  async listArquivos(fornecedorId: string): Promise<FornecedorArquivo[]> {
    return apiRequest<FornecedorArquivo[]>(`/fornecedores/${fornecedorId}/arquivos`);
  }

  async addArquivo(
    fornecedorId: string,
    input: { nome: string; url: string; tipo?: string; tamanho?: number | null },
  ): Promise<FornecedorArquivo> {
    return apiRequest<FornecedorArquivo>(`/fornecedores/${fornecedorId}/arquivos`, {
      method: 'POST',
      body: JSON.stringify({
        nome: input.nome,
        url: input.url,
        tipo: input.tipo || '',
        tamanho: input.tamanho ?? null,
      }),
    });
  }

  async removeArquivo(fornecedorId: string, arquivoId: string): Promise<void> {
    await apiRequest(`/fornecedores/${fornecedorId}/arquivos/${arquivoId}`, { method: 'DELETE' });
  }
}
