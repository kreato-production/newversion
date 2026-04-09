import { apiRequest } from '@/lib/api/http';
import type { Turno, TurnoInput } from './turnos.types';

type PaginatedTurnosResponse = {
  total: number;
  data: Turno[];
};

export class ApiTurnosRepository {
  async list(): Promise<Turno[]> {
    const response = await apiRequest<PaginatedTurnosResponse>('/turnos');
    return response.data;
  }

  async save(input: TurnoInput): Promise<Turno> {
    const path = input.id ? `/turnos/${input.id}` : '/turnos';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest<Turno>(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/turnos/${id}`, {
      method: 'DELETE',
    });
  }
}
