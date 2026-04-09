import { apiRequest } from '@/lib/api/http';
import type {
  Escala,
  EscalaInput,
  EscalaColaborador,
  EscalaColaboradorInput,
  FuncaoOption,
  ColaboradorOption,
} from './escalas.types';

type PaginatedEscalasResponse = {
  total: number;
  data: Escala[];
};

export class ApiEscalasRepository {
  async list(): Promise<Escala[]> {
    const response = await apiRequest<PaginatedEscalasResponse>('/escalas');
    return response.data;
  }

  async save(input: EscalaInput): Promise<Escala> {
    const path = input.id ? `/escalas/${input.id}` : '/escalas';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest<Escala>(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/escalas/${id}`, { method: 'DELETE' });
  }

  async getColaboradores(escalaId: string): Promise<EscalaColaborador[]> {
    return apiRequest<EscalaColaborador[]>(`/escalas/${escalaId}/colaboradores`);
  }

  async saveColaboradores(
    escalaId: string,
    colaboradores: EscalaColaboradorInput[],
  ): Promise<EscalaColaborador[]> {
    return apiRequest<EscalaColaborador[]>(`/escalas/${escalaId}/colaboradores`, {
      method: 'PUT',
      body: JSON.stringify({ colaboradores }),
    });
  }

  async listFuncoes(): Promise<FuncaoOption[]> {
    return apiRequest<FuncaoOption[]>('/escalas/opcoes/funcoes');
  }

  async listColaboradoresByFuncao(funcaoId: string): Promise<ColaboradorOption[]> {
    return apiRequest<ColaboradorOption[]>(
      `/escalas/opcoes/colaboradores?funcaoId=${encodeURIComponent(funcaoId)}`,
    );
  }
}
