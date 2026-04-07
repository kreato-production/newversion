import { apiRequest } from '@/lib/api/http';
import type { Feriado, FeriadoInput } from './feriados.types';

type PaginatedFeriadosResponse = {
  total: number;
  data: Feriado[];
};

export class ApiFeriadosRepository {
  async list(): Promise<Feriado[]> {
    const response = await apiRequest<PaginatedFeriadosResponse>('/feriados');
    return response.data;
  }

  async save(input: FeriadoInput): Promise<Feriado> {
    const path = input.id ? `/feriados/${input.id}` : '/feriados';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest<Feriado>(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/feriados/${id}`, {
      method: 'DELETE',
    });
  }
}
