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

export type TenantLicenseApiItem = {
  id: string;
  dataInicio: string;
  dataFim: string;
};

export type TenantUnidadeApiItem = {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  moeda: string;
};

export type TenantUnidadeApiInput = {
  codigoExterno?: string;
  nome: string;
  descricao?: string;
  imagem?: string;
  moeda?: string;
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

  async listLicencas(tenantId: string): Promise<TenantLicenseApiItem[]> {
    return apiRequest(`/tenants/${tenantId}/licencas`);
  }

  async addLicenca(
    tenantId: string,
    input: { dataInicio: string; dataFim: string },
  ): Promise<TenantLicenseApiItem> {
    return apiRequest(`/tenants/${tenantId}/licencas`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async removeLicenca(tenantId: string, licencaId: string): Promise<void> {
    await apiRequest(`/tenants/${tenantId}/licencas/${licencaId}`, {
      method: 'DELETE',
    });
  }

  async listModulos(tenantId: string): Promise<string[]> {
    return apiRequest(`/tenants/${tenantId}/modulos`);
  }

  async setModulo(tenantId: string, input: { modulo: string; enabled: boolean }): Promise<void> {
    await apiRequest(`/tenants/${tenantId}/modulos`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async listUnidades(tenantId: string): Promise<TenantUnidadeApiItem[]> {
    return apiRequest(`/tenants/${tenantId}/unidades`);
  }

  async createUnidade(
    tenantId: string,
    input: TenantUnidadeApiInput,
  ): Promise<TenantUnidadeApiItem> {
    return apiRequest(`/tenants/${tenantId}/unidades`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateUnidade(
    tenantId: string,
    unidadeId: string,
    input: TenantUnidadeApiInput,
  ): Promise<TenantUnidadeApiItem> {
    return apiRequest(`/tenants/${tenantId}/unidades/${unidadeId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async removeUnidade(tenantId: string, unidadeId: string): Promise<void> {
    await apiRequest(`/tenants/${tenantId}/unidades/${unidadeId}`, {
      method: 'DELETE',
    });
  }
}
