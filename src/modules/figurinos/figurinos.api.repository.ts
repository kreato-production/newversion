import { apiRequest } from '@/lib/api/http';
import type {
  Figurino,
  FigurinoInput,
  MaterialOption,
  TipoFigurinoOption,
} from './figurinos.types';

function normalizeInput(input: FigurinoInput): FigurinoInput {
  return {
    ...input,
    tenantId: input.tenantId ?? null,
    codigoExterno: input.codigoExterno?.trim() || '',
    codigoFigurino: input.codigoFigurino?.trim() || '',
    descricao: input.descricao?.trim() || '',
    tipoFigurino: input.tipoFigurino || '',
    tipoFigurinoId: input.tipoFigurinoId || '',
    material: input.material || '',
    materialId: input.materialId || '',
    tamanhoPeca: input.tamanhoPeca?.trim() || '',
    corPredominante: input.corPredominante || '',
    corSecundaria: input.corSecundaria || '',
    imagens: (input.imagens || []).map((imagem) => ({
      ...imagem,
      id: imagem.id || '',
      url: imagem.url || '',
      isPrincipal: Boolean(imagem.isPrincipal),
    })),
  };
}

export class ApiFigurinosRepository {
  async list(): Promise<Figurino[]> {
    const response = await apiRequest<{ data: Figurino[] }>('/figurinos');
    return response.data;
  }

  async listOptions(): Promise<{
    tiposFigurino: TipoFigurinoOption[];
    materiais: MaterialOption[];
  }> {
    return apiRequest<{ tiposFigurino: TipoFigurinoOption[]; materiais: MaterialOption[] }>(
      '/figurinos/options',
    );
  }

  async save(input: FigurinoInput): Promise<void> {
    const path = input.id ? `/figurinos/${input.id}` : '/figurinos';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(normalizeInput(input)),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/figurinos/${id}`, { method: 'DELETE' });
  }
}
