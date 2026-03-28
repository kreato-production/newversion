import { apiRequest } from '@/lib/api/http';
import type { Gravacao, GravacaoInput } from './gravacoes.types';
import type { GravacoesRepository } from './gravacoes.repository';

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
  async list(): Promise<Gravacao[]> {
    const response = await apiRequest<{ data: Gravacao[] }>('/gravacoes?limit=200&offset=0');
    return response.data;
  }

  async save(input: GravacaoInput): Promise<void> {
    const path = input.id ? `/gravacoes/${input.id}` : '/gravacoes';
    const method = input.id ? 'PUT' : 'POST';
    const payload = sanitizeInput(input);

    await apiRequest(path, {
      method,
      body: JSON.stringify(payload),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/gravacoes/${id}`, { method: 'DELETE' });
  }
}
