import { apiRequest } from '@/lib/api/http';
import type { Espaco, EspacoInput } from './espacos.types';

function normalizeInput(input: EspacoInput): EspacoInput {
  return {
    ...input,
    tenantId: input.tenantId ?? null,
    codigoExterno: input.codigoExterno?.trim() || '',
    titulo: input.titulo?.trim() || '',
    descricao: input.descricao?.trim() || '',
    faixasDisponibilidade: (input.faixasDisponibilidade || []).map((item) => ({
      ...item,
      diasSemana: item.diasSemana || [1, 2, 3, 4, 5],
    })),
  };
}

export class ApiEspacosRepository {
  async list(): Promise<Espaco[]> {
    const response = await apiRequest<{ data: Espaco[] }>('/espacos');
    return response.data;
  }

  async save(input: EspacoInput): Promise<void> {
    const path = input.id ? `/espacos/${input.id}` : '/espacos';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(normalizeInput(input)),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/espacos/${id}`, { method: 'DELETE' });
  }
}
