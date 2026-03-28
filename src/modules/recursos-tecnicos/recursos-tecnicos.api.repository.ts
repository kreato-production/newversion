import { apiRequest } from '@/lib/api/http';
import type {
  RecursoTecnico,
  RecursoTecnicoInput,
  RecursoTecnicoOptionsResponse,
} from './recursos-tecnicos.types';

function normalizeRecursoTecnicoInput(input: RecursoTecnicoInput): RecursoTecnicoInput {
  return {
    ...input,
    codigoExterno: input.codigoExterno?.trim() || '',
    nome: input.nome?.trim() || '',
    funcaoOperador: input.funcaoOperador?.trim() || '',
    funcaoOperadorId: input.funcaoOperadorId?.trim() || undefined,
    tenantId: input.tenantId ?? null,
  };
}

export class ApiRecursosTecnicosRepository {
  async list(): Promise<RecursoTecnico[]> {
    const response = await apiRequest<{ data: RecursoTecnico[] }>('/recursos-tecnicos');
    return response.data;
  }

  async listOptions(): Promise<RecursoTecnicoOptionsResponse> {
    return apiRequest<RecursoTecnicoOptionsResponse>('/recursos-tecnicos/options');
  }

  async save(input: RecursoTecnicoInput): Promise<void> {
    const path = input.id ? `/recursos-tecnicos/${input.id}` : '/recursos-tecnicos';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(normalizeRecursoTecnicoInput(input)),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/recursos-tecnicos/${id}`, { method: 'DELETE' });
  }
}
