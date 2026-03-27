import { apiRequest } from '@/lib/api/http';
import type { UsuarioApiModel } from './usuarios.types';

export class ApiUsuariosRepository {
  async list(): Promise<UsuarioApiModel[]> {
    return apiRequest<UsuarioApiModel[]>('/users');
  }

  async save(data: UsuarioApiModel): Promise<void> {
    const path = data.id ? `/users/${data.id}` : '/users';
    const method = data.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(data),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}
