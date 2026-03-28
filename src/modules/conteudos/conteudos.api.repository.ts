import { apiRequest } from '@/lib/api/http';
import type { Conteudo, ConteudoFormOptions, ConteudoInput } from './conteudos.types';
import type { ConteudosRepository } from './conteudos.repository';

export class ApiConteudosRepository implements ConteudosRepository {
  async list(): Promise<Conteudo[]> {
    const response = await apiRequest<{ data: Conteudo[] }>('/conteudos');
    return response.data;
  }

  async save(input: ConteudoInput, _userId?: string): Promise<void> {
    const path = input.id ? `/conteudos/${input.id}` : '/conteudos';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/conteudos/${id}`, { method: 'DELETE' });
  }

  async listOptions(_unidadeIds?: string[]): Promise<ConteudoFormOptions> {
    return apiRequest<ConteudoFormOptions>('/conteudos/options');
  }
}
