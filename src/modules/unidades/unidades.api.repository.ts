import { apiRequest } from '@/lib/api/http';
import type { UnidadeNegocio } from './unidades.types';

export class ApiUnidadesRepository {
  async list(): Promise<UnidadeNegocio[]> {
    const response = await apiRequest<{ data: UnidadeNegocio[] }>('/unidades?limit=200&offset=0');
    return response.data;
  }

  async save(data: UnidadeNegocio): Promise<void> {
    const normalizedId = data.id || undefined;
    const payload = normalizedId ? data : { ...data, id: undefined };
    const path = normalizedId ? `/unidades/${normalizedId}` : '/unidades';
    const method = normalizedId ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(payload),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/unidades/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadLogo(): Promise<string | null> {
    return null;
  }
}
