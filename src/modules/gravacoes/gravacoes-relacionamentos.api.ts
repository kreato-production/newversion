import { apiRequest } from '@/lib/api/http';

export type GravacaoFigurinoOption = {
  id: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino: string;
  tamanhoPeca: string;
  imagens: Array<{ url: string; isPrincipal: boolean }>;
};

export type GravacaoFigurinoItem = {
  id: string;
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino: string;
  tamanhoPeca: string;
  imagemPrincipal: string;
  observacao: string;
  pessoaId: string;
};

export type GravacaoTerceiroFornecedor = {
  id: string;
  nome: string;
  categoria: string;
};

export type GravacaoTerceiroServico = {
  id: string;
  fornecedorId: string;
  nome: string;
  descricao: string;
  valor: number;
};

export type GravacaoTerceiroItem = {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoId: string;
  servicoNome: string;
  custo: number;
  observacao: string;
};

export type GravacaoConvidadoPessoa = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string;
  foto: string;
  telefone: string;
  email: string;
  status: string;
};

export type GravacaoConvidadoItem = {
  id: string;
  pessoaId: string;
  nome: string;
  nomeTrabalho: string;
  foto: string;
  telefone: string;
  email: string;
  observacoes: string;
};

export const gravacoesRelacionamentosApi = {
  listFigurinos(gravacaoId: string) {
    return apiRequest<{ figurinos: GravacaoFigurinoOption[]; items: GravacaoFigurinoItem[] }>(
      `/gravacoes/${gravacaoId}/figurinos`,
    );
  },

  addFigurino(gravacaoId: string, input: { figurinoId: string; observacao?: string }) {
    return apiRequest<GravacaoFigurinoItem>(`/gravacoes/${gravacaoId}/figurinos`, {
      method: 'POST',
      body: JSON.stringify({
        figurinoId: input.figurinoId,
        observacao: input.observacao?.trim() || null,
      }),
    });
  },

  updateFigurino(gravacaoId: string, itemId: string, input: { observacao?: string }) {
    return apiRequest<GravacaoFigurinoItem>(`/gravacoes/${gravacaoId}/figurinos/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        observacao: input.observacao?.trim() || null,
      }),
    });
  },

  removeFigurino(gravacaoId: string, itemId: string) {
    return apiRequest<void>(`/gravacoes/${gravacaoId}/figurinos/${itemId}`, {
      method: 'DELETE',
    });
  },

  listTerceiros(gravacaoId: string) {
    return apiRequest<{
      moeda: string;
      fornecedores: GravacaoTerceiroFornecedor[];
      servicos: GravacaoTerceiroServico[];
      items: GravacaoTerceiroItem[];
    }>(`/gravacoes/${gravacaoId}/terceiros`);
  },

  addTerceiro(
    gravacaoId: string,
    input: { fornecedorId: string; servicoId: string; valor?: number; observacao?: string },
  ) {
    return apiRequest<GravacaoTerceiroItem>(`/gravacoes/${gravacaoId}/terceiros`, {
      method: 'POST',
      body: JSON.stringify({
        fornecedorId: input.fornecedorId,
        servicoId: input.servicoId || null,
        valor: input.valor ?? 0,
        observacao: input.observacao?.trim() || null,
      }),
    });
  },

  removeTerceiro(gravacaoId: string, itemId: string) {
    return apiRequest<void>(`/gravacoes/${gravacaoId}/terceiros/${itemId}`, {
      method: 'DELETE',
    });
  },

  listConvidados(gravacaoId: string) {
    return apiRequest<{ pessoas: GravacaoConvidadoPessoa[]; items: GravacaoConvidadoItem[] }>(
      `/gravacoes/${gravacaoId}/convidados`,
    );
  },

  addConvidado(gravacaoId: string, input: { pessoaId: string; observacao?: string }) {
    return apiRequest<GravacaoConvidadoItem>(`/gravacoes/${gravacaoId}/convidados`, {
      method: 'POST',
      body: JSON.stringify({
        pessoaId: input.pessoaId,
        observacao: input.observacao?.trim() || null,
      }),
    });
  },

  removeConvidado(gravacaoId: string, itemId: string) {
    return apiRequest<void>(`/gravacoes/${gravacaoId}/convidados/${itemId}`, {
      method: 'DELETE',
    });
  },
};
