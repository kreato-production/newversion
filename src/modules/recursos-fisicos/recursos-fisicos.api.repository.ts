import { apiRequest } from '@/lib/api/http';
import type { RecursoFisico, RecursoFisicoInput } from './recursos-fisicos.types';

function normalizeInput(input: RecursoFisicoInput): RecursoFisicoInput {
  return {
    ...input,
    tenantId: input.tenantId ?? null,
    codigoExterno: input.codigoExterno?.trim() || '',
    nome: input.nome?.trim() || '',
    custoHora: Number(input.custoHora || 0),
    faixasDisponibilidade: (input.faixasDisponibilidade || []).map((item) => ({
      ...item,
      diasSemana: item.diasSemana || [1, 2, 3, 4, 5],
    })),
    estoqueItens: (input.estoqueItens || []).map((item) => ({
      ...item,
      codigo: item.codigo?.trim() || '',
      nome: item.nome?.trim() || '',
      descricao: item.descricao?.trim() || '',
      imagemUrl: item.imagemUrl || '',
    })),
  };
}

export class ApiRecursosFisicosRepository {
  async list(): Promise<RecursoFisico[]> {
    const response = await apiRequest<{ data: RecursoFisico[] }>('/recursos-fisicos');
    return response.data;
  }

  async save(input: RecursoFisicoInput): Promise<void> {
    const path = input.id ? `/recursos-fisicos/${input.id}` : '/recursos-fisicos';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(normalizeInput(input)),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/recursos-fisicos/${id}`, { method: 'DELETE' });
  }
}
