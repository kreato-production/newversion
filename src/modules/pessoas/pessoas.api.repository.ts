import { apiRequest } from '@/lib/api/http';
import type {
  ClassificacaoPessoaOption,
  GravacaoParticipacao,
  Pessoa,
  PessoaInput,
} from './pessoas.types';

function normalizeInput(input: PessoaInput): PessoaInput {
  return {
    ...input,
    tenantId: input.tenantId ?? null,
    codigoExterno: input.codigoExterno?.trim() || '',
    nome: input.nome?.trim() || '',
    sobrenome: input.sobrenome?.trim() || '',
    nomeTrabalho: input.nomeTrabalho?.trim() || '',
    foto: input.foto || '',
    dataNascimento: input.dataNascimento || '',
    sexo: input.sexo || '',
    telefone: input.telefone?.trim() || '',
    email: input.email?.trim() || '',
    classificacao: input.classificacao || '',
    classificacaoId: input.classificacaoId || '',
    documento: input.documento?.trim() || '',
    endereco: input.endereco?.trim() || '',
    cidade: input.cidade?.trim() || '',
    estado: input.estado?.trim() || '',
    cep: input.cep?.trim() || '',
    observacoes: input.observacoes?.trim() || '',
    status: input.status || 'Ativo',
  };
}

export class ApiPessoasRepository {
  async list(): Promise<Pessoa[]> {
    const response = await apiRequest<{ data: Pessoa[] }>('/pessoas');
    return response.data;
  }

  async listOptions(): Promise<{ classificacoes: ClassificacaoPessoaOption[] }> {
    return apiRequest<{ classificacoes: ClassificacaoPessoaOption[] }>('/pessoas/options');
  }

  async save(input: PessoaInput): Promise<void> {
    const path = input.id ? `/pessoas/${input.id}` : '/pessoas';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(normalizeInput(input)),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/pessoas/${id}`, { method: 'DELETE' });
  }

  async listGravacoes(pessoaId: string): Promise<GravacaoParticipacao[]> {
    return apiRequest<GravacaoParticipacao[]>(`/pessoas/${pessoaId}/gravacoes`);
  }
}
