import { apiRequest } from '@/lib/api/http';
import type { Programa, ProgramaInput } from './programas.types';

export function normalizeProgramaInput(input: ProgramaInput): Omit<ProgramaInput, 'tenantId'> {
  const normalized: ProgramaInput = {
    ...input,
    codigoExterno: input.codigoExterno?.trim() || '',
    descricao: input.descricao?.trim() || '',
    cor: input.cor || null,
    unidadeNegocioId: input.unidadeNegocioId?.trim() || null,
  };
  delete normalized.tenantId;
  return normalized;
}

export class ApiProgramasRepository {
  async list(): Promise<Programa[]> {
    const response = await apiRequest<{ data: Programa[] }>('/programas');
    return response.data;
  }

  async save(input: ProgramaInput, _userId?: string): Promise<void> {
    const path = input.id ? `/programas/${input.id}` : '/programas';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(normalizeProgramaInput(input)),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/programas/${id}`, { method: 'DELETE' });
  }
}
