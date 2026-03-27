import { apiRequest } from '@/lib/api/http';
import type { Programa, ProgramaInput } from './programas.types';

export function normalizeProgramaInput(input: ProgramaInput): ProgramaInput {
  return {
    ...input,
    codigoExterno: input.codigoExterno?.trim() || '',
    descricao: input.descricao?.trim() || '',
    unidadeNegocioId: input.unidadeNegocioId?.trim() || null,
    tenantId: input.tenantId ?? null,
  };
}

export class ApiProgramasRepository {
  async list(): Promise<Programa[]> {
    return apiRequest<Programa[]>('/programas');
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

