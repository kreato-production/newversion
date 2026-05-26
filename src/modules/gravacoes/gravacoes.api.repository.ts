import { apiRequest } from '@/lib/api/http';
import type { Gravacao, GravacaoInput } from './gravacoes.types';
import type { GravacoesRepository } from './gravacoes.repository';

export type TemplateResourceItem = {
  recursoId: string;
  quantidade: number;
  data?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
};

export type TemplateEspacoItem = {
  espacoId: string;
  data?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
};

export type TemplateAtividadeConfig = {
  nome?: string;
  espacos: TemplateEspacoItem[];
  recursosTecnicos: TemplateResourceItem[];
  equipamentos: TemplateResourceItem[];
};

export type CreateFromTemplateInput = {
  gravacao: GravacaoInput;
  atividades: TemplateAtividadeConfig[];
};

function toNullableString(value?: string): string | null {
  return value && value.trim() ? value.trim() : null;
}

function sanitizeInput(input: GravacaoInput) {
  return {
    ...(input.id ? { id: input.id } : {}),
    codigo: input.codigo.trim(),
    codigoExterno: toNullableString(input.codigoExterno),
    nome: input.nome.trim(),
    unidadeNegocioId: toNullableString(input.unidadeNegocioId),
    centroLucro: toNullableString(input.centroLucro),
    classificacao: toNullableString(input.classificacao),
    tipoConteudo: toNullableString(input.tipoConteudo),
    descricao: toNullableString(input.descricao),
    status: toNullableString(input.status),
    dataPrevista: toNullableString(input.dataPrevista),
    conteudoId: toNullableString(input.conteudoId),
    orcamento: input.orcamento ?? 0,
    programaId: toNullableString(input.programaId),
  };
}

export class ApiGravacoesRepository implements GravacoesRepository {
  async list(_unidadeIds?: string[]): Promise<Gravacao[]> {
    const response = await apiRequest<{ data: Gravacao[] }>('/gravacoes?limit=200&offset=0');
    return response.data;
  }

  async getById(id: string): Promise<Gravacao | null> {
    return apiRequest<Gravacao>(`/gravacoes/${id}`).catch((): null => null);
  }

  async save(input: GravacaoInput, _userId?: string): Promise<Gravacao> {
    const path = input.id ? `/gravacoes/${input.id}` : '/gravacoes';
    const method = input.id ? 'PUT' : 'POST';
    const payload = sanitizeInput(input);

    return apiRequest<Gravacao>(path, {
      method,
      body: JSON.stringify(payload),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/gravacoes/${id}`, { method: 'DELETE' });
  }

  async createFromTemplate(input: CreateFromTemplateInput): Promise<Gravacao> {
    return apiRequest<Gravacao>('/gravacoes/from-template', {
      method: 'POST',
      body: JSON.stringify({
        gravacao: sanitizeInput(input.gravacao),
        atividades: input.atividades,
      }),
    });
  }
}
