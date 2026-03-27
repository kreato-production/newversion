import { apiRequest } from '@/lib/api/http';
import type { Equipe, EquipeInput, Membro, RecursoHumano } from './equipes.types';

export class ApiEquipesRepository {
  async list(): Promise<Equipe[]> {
    return apiRequest<Equipe[]>('/equipes');
  }

  async create(input: EquipeInput): Promise<void> {
    await apiRequest('/equipes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async update(id: string, input: EquipeInput): Promise<void> {
    await apiRequest(`/equipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/equipes/${id}`, {
      method: 'DELETE',
    });
  }

  async listRecursosHumanosAtivos(): Promise<RecursoHumano[]> {
    throw new Error('Operacao ainda nao migrada para a API propria');
  }

  async listMembros(_equipeId: string): Promise<Membro[]> {
    throw new Error('Operacao ainda nao migrada para a API propria');
  }

  async addMembro(_equipeId: string, _recursoHumanoId: string): Promise<Membro> {
    throw new Error('Operacao ainda nao migrada para a API propria');
  }

  async removeMembro(_membroId: string): Promise<void> {
    throw new Error('Operacao ainda nao migrada para a API propria');
  }
}
