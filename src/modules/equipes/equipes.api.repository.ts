import { apiRequest } from '@/lib/api/http';
import type { Equipe, EquipeInput, Membro, RecursoHumano } from './equipes.types';

export class ApiEquipesRepository {
  async list(): Promise<Equipe[]> {
    const response = await apiRequest<{ data: Equipe[] }>('/equipes');
    return response.data;
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
    throw new Error('Use listMembros para carregar usuarios disponiveis por equipe');
  }

  async listMembros(
    equipeId: string,
  ): Promise<{ membros: Membro[]; disponiveis: RecursoHumano[] }> {
    return apiRequest(`/equipes/${equipeId}/membros`);
  }

  async addMembro(equipeId: string, recursoHumanoId: string): Promise<Membro> {
    return apiRequest(`/equipes/${equipeId}/membros`, {
      method: 'POST',
      body: JSON.stringify({ targetId: recursoHumanoId }),
    });
  }

  async removeMembro(equipeId: string, membroId: string): Promise<void> {
    await apiRequest(`/equipes/${equipeId}/membros/${membroId}`, {
      method: 'DELETE',
    });
  }
}
