import { apiRequest } from '@/lib/api/http';
import type { UsuarioApiModel } from './usuarios.types';

export class ApiUsuariosRepository {
  async list(): Promise<UsuarioApiModel[]> {
    const response = await apiRequest<{ data: UsuarioApiModel[] }>('/users');
    return response.data;
  }

  async save(data: UsuarioApiModel): Promise<void> {
    const normalizedId = data.id || undefined;
    const payload = normalizedId ? data : { ...data, id: undefined };
    const path = normalizedId ? `/users/${normalizedId}` : '/users';
    const method = normalizedId ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(payload),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async listUnidades(
    userId: string,
  ): Promise<{
    vinculadas: { id: string; nome: string }[];
    disponiveis: { id: string; nome: string }[];
  }> {
    return apiRequest(`/users/${userId}/unidades`);
  }

  async addUnidade(userId: string, unidadeId: string): Promise<void> {
    await apiRequest(`/users/${userId}/unidades`, {
      method: 'POST',
      body: JSON.stringify({ targetId: unidadeId }),
    });
  }

  async removeUnidade(userId: string, unidadeId: string): Promise<void> {
    await apiRequest(`/users/${userId}/unidades/${unidadeId}`, {
      method: 'DELETE',
    });
  }

  async listProgramas(
    userId: string,
  ): Promise<{
    vinculados: { id: string; nome: string }[];
    disponiveis: { id: string; nome: string }[];
  }> {
    return apiRequest(`/users/${userId}/programas`);
  }

  async addPrograma(userId: string, programaId: string): Promise<void> {
    await apiRequest(`/users/${userId}/programas`, {
      method: 'POST',
      body: JSON.stringify({ targetId: programaId }),
    });
  }

  async removePrograma(userId: string, programaId: string): Promise<void> {
    await apiRequest(`/users/${userId}/programas/${programaId}`, {
      method: 'DELETE',
    });
  }

  async listEquipes(
    userId: string,
  ): Promise<{
    vinculadas: { id: string; codigo: string; descricao: string }[];
    disponiveis: { id: string; codigo: string; descricao: string }[];
  }> {
    return apiRequest(`/users/${userId}/equipes`);
  }

  async addEquipe(userId: string, equipeId: string): Promise<void> {
    await apiRequest(`/users/${userId}/equipes`, {
      method: 'POST',
      body: JSON.stringify({ targetId: equipeId }),
    });
  }

  async removeEquipe(userId: string, equipeId: string): Promise<void> {
    await apiRequest(`/users/${userId}/equipes/${equipeId}`, {
      method: 'DELETE',
    });
  }
}
