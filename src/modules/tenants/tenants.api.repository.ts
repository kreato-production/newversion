import { apiRequest } from '@/lib/api/http';

export type TenantApiItem = {
  id: string;
  nome: string;
  plano: 'Mensal' | 'Anual';
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  notas: string;
  createdAt: string;
  licencaFim?: string | null;
};

export type TenantApiInput = {
  id?: string;
  nome: string;
  plano: 'Mensal' | 'Anual';
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  notas: string;
};

export class ApiTenantsRepository {
  async list(): Promise<TenantApiItem[]> {
    return apiRequest<TenantApiItem[]>('/tenants');
  }

  async save(input: TenantApiInput): Promise<void> {
    const path = input.id ? `/tenants/${input.id}` : '/tenants';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/tenants/${id}`, {
      method: 'DELETE',
    });
  }
}
