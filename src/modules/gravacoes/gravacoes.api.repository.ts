import { apiRequest } from '@/lib/api/http';
import type { Gravacao, GravacaoInput } from './gravacoes.types';
import type { GravacoesRepository } from './gravacoes.repository';

export class ApiGravacoesRepository implements GravacoesRepository {
  async list(): Promise<Gravacao[]> {
    return apiRequest<Gravacao[]>('/gravacoes');
  }

  async save(input: GravacaoInput): Promise<void> {
    const path = input.id ? `/gravacoes/${input.id}` : '/gravacoes';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/gravacoes/${id}`, { method: 'DELETE' });
  }
}
