import { apiRequest } from '@/lib/api/http';

export type DepartamentoApiItem = {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type DepartamentoApiInput = {
  id?: string;
  codigoExterno?: string;
  nome: string;
  descricao?: string;
};

export type FuncaoApiItem = {
  id: string;
  nome: string;
  codigoExterno: string;
  descricao: string;
};

export type DepartamentoFuncaoApiItem = {
  id: string;
  funcaoId: string;
  dataAssociacao: string;
};

type PaginatedDepartamentosResponse = {
  total: number;
  data: DepartamentoApiItem[];
};

type DepartamentoFuncoesResponse = {
  associadas: DepartamentoFuncaoApiItem[];
  cadastradas: FuncaoApiItem[];
};

export class ApiDepartamentosRepository {
  async list(): Promise<DepartamentoApiItem[]> {
    const response = await apiRequest<PaginatedDepartamentosResponse>('/departamentos');
    return response.data;
  }

  async save(input: DepartamentoApiInput): Promise<DepartamentoApiItem> {
    const path = input.id ? `/departamentos/${input.id}` : '/departamentos';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/departamentos/${id}`, {
      method: 'DELETE',
    });
  }

  async listFuncoes(departamentoId: string): Promise<DepartamentoFuncoesResponse> {
    return apiRequest(`/departamentos/${departamentoId}/funcoes`);
  }

  async addFuncao(departamentoId: string, funcaoId: string): Promise<DepartamentoFuncaoApiItem> {
    return apiRequest(`/departamentos/${departamentoId}/funcoes`, {
      method: 'POST',
      body: JSON.stringify({ funcaoId }),
    });
  }

  async removeFuncao(departamentoId: string, associacaoId: string): Promise<void> {
    await apiRequest(`/departamentos/${departamentoId}/funcoes/${associacaoId}`, {
      method: 'DELETE',
    });
  }
}
