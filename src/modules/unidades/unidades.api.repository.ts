import { apiRequest } from '@/lib/api/http';
import type { UnidadeNegocio } from './unidades.types';

export class ApiUnidadesRepository {
  async list(): Promise<UnidadeNegocio[]> {
    return apiRequest<UnidadeNegocio[]>('/unidades');
  }

  async save(data: UnidadeNegocio): Promise<void> {
    const path = data.id ? `/unidades/${data.id}` : '/unidades';
    const method = data.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(data),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/unidades/${id}`, {
      method: 'DELETE',
    });
  }
}
