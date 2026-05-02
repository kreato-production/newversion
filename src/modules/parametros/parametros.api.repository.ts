import { apiRequest } from '@/lib/api/http';

export type ParametroApiItem = {
  id: string;
  codigo_externo: string;
  nome: string;
  descricao: string;
  cor?: string | null;
  created_at: string;
  created_by: string;
};

export type ParametroApiInput = {
  id?: string;
  codigoExterno?: string;
  nome: string;
  descricao?: string;
  cor?: string | null;
};

type PaginatedParametrosResponse = {
  total: number;
  data: ParametroApiItem[];
};

export class ApiParametrosRepository {
  async list(storageKey: string): Promise<ParametroApiItem[]> {
    const response = await apiRequest<PaginatedParametrosResponse>(`/parametros/${storageKey}`);
    return response.data;
  }

  async save(storageKey: string, input: ParametroApiInput): Promise<ParametroApiItem> {
    const path = input.id ? `/parametros/${storageKey}/${input.id}` : `/parametros/${storageKey}`;
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  async remove(storageKey: string, id: string): Promise<void> {
    await apiRequest(`/parametros/${storageKey}/${id}`, {
      method: 'DELETE',
    });
  }
}
