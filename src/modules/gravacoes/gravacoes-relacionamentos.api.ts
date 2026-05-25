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

export type GravacaoEspacoItem = {
  id: string;
  espacoId: string;
  espacoNome: string;
  descricao: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  data: string | null;
};

export type GravacaoEspacoResourceItem = {
  id: string;
  recursoId: string;
  recursoNome: string;
  valorHora: number;
  quantidade: number;
  horaInicio: string | null;
  horaFim: string | null;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
};

export type GravacaoEspacoAvailableResource = {
  recursoId: string;
  recursoNome: string;
  valorHora: number;
};

export type GravacaoCustoItem = {
  categoria: string;
  recurso: string;
  descricao: string;
  horas: number;
  custoUnitario: number;
  custoTotal: number;
};

export type GravacaoCustosResult = {
  moeda: string;
  itens: GravacaoCustoItem[];
};

export type GravacaoDespesaItem = {
  id: string;
  titulo: string;
  numeroDocumento: string;
  descricao: string;
  status: string;
  tipoDocumento: string;
  categoria: string;
  dataVencimento: string;
  valor: number;
  fornecedorId: string;
  fornecedorNome: string;
  formaPagamento: string;
};

export type GravacaoDespesaInput = {
  titulo: string;
  numeroDocumento?: string | null;
  descricao?: string | null;
  status?: string | null;
  tipoDocumento?: string | null;
  categoria?: string | null;
  dataVencimento?: string | null;
  valor?: number | null;
  fornecedorId?: string | null;
  formaPagamento?: string | null;
};

export type GravacaoDespesasResult = {
  items: GravacaoDespesaItem[];
};

export type EspacoRecursoSummaryItem = {
  tipo: 'tecnico' | 'fisico';
  recursoNome: string;
  espacoNome: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  quantidade: number;
  horas: number;
};

export type EspacoRecursosSummaryResult = {
  dataPrevista: string | null;
  items: EspacoRecursoSummaryItem[];
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

  listEspacos(gravacaoId: string) {
    return apiRequest<GravacaoEspacoItem[]>(`/gravacoes/${gravacaoId}/espacos`);
  },

  addEspaco(
    gravacaoId: string,
    data: {
      espacoId: string;
      descricao: string | null;
      horaInicio: string | null;
      horaFim: string | null;
      data: string | null;
    },
  ) {
    return apiRequest<GravacaoEspacoItem>(`/gravacoes/${gravacaoId}/espacos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateEspaco(
    gravacaoId: string,
    itemId: string,
    data: {
      espacoId: string;
      descricao: string | null;
      horaInicio: string | null;
      horaFim: string | null;
      data: string | null;
    },
  ) {
    return apiRequest<GravacaoEspacoItem>(`/gravacoes/${gravacaoId}/espacos/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  removeEspaco(gravacaoId: string, itemId: string) {
    return apiRequest<void>(`/gravacoes/${gravacaoId}/espacos/${itemId}`, { method: 'DELETE' });
  },

  listEspacoResources(gravacaoId: string, espacoItemId: string, tipo: 'fisico' | 'tecnico') {
    return apiRequest<{
      items: GravacaoEspacoResourceItem[];
      availableResources: GravacaoEspacoAvailableResource[];
    }>(`/gravacoes/${gravacaoId}/espacos/${espacoItemId}/recursos?tipo=${tipo}`);
  },

  addEspacoResource(
    gravacaoId: string,
    espacoItemId: string,
    tipo: 'fisico' | 'tecnico',
    input: {
      recursoId: string;
      valorHora: number;
      quantidade: number;
      horaInicio: string | null;
      horaFim: string | null;
      valorTotal: number;
      descontoPercentual: number;
      valorComDesconto: number;
    },
  ) {
    return apiRequest<GravacaoEspacoResourceItem>(
      `/gravacoes/${gravacaoId}/espacos/${espacoItemId}/recursos?tipo=${tipo}`,
      { method: 'POST', body: JSON.stringify(input) },
    );
  },

  updateEspacoResource(
    gravacaoId: string,
    espacoItemId: string,
    itemId: string,
    tipo: 'fisico' | 'tecnico',
    input: {
      quantidade: number;
      horaInicio: string | null;
      horaFim: string | null;
      valorTotal: number;
      descontoPercentual: number;
      valorComDesconto: number;
    },
  ) {
    return apiRequest<GravacaoEspacoResourceItem>(
      `/gravacoes/${gravacaoId}/espacos/${espacoItemId}/recursos/${itemId}?tipo=${tipo}`,
      { method: 'PUT', body: JSON.stringify(input) },
    );
  },

  removeEspacoResource(
    gravacaoId: string,
    espacoItemId: string,
    itemId: string,
    tipo: 'fisico' | 'tecnico',
  ) {
    return apiRequest<void>(
      `/gravacoes/${gravacaoId}/espacos/${espacoItemId}/recursos/${itemId}?tipo=${tipo}`,
      { method: 'DELETE' },
    );
  },

  getCustos(gravacaoId: string) {
    return apiRequest<GravacaoCustosResult>(`/gravacoes/${gravacaoId}/custos`);
  },

  listDespesas(gravacaoId: string) {
    return apiRequest<GravacaoDespesasResult>(`/gravacoes/${gravacaoId}/despesas`);
  },

  addDespesa(gravacaoId: string, input: GravacaoDespesaInput) {
    return apiRequest<GravacaoDespesaItem>(`/gravacoes/${gravacaoId}/despesas`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateDespesa(gravacaoId: string, itemId: string, input: GravacaoDespesaInput) {
    return apiRequest<GravacaoDespesaItem>(`/gravacoes/${gravacaoId}/despesas/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  removeDespesa(gravacaoId: string, itemId: string) {
    return apiRequest<void>(`/gravacoes/${gravacaoId}/despesas/${itemId}`, { method: 'DELETE' });
  },

  listEspacoRecursosSummary(gravacaoId: string) {
    return apiRequest<EspacoRecursosSummaryResult>(`/gravacoes/${gravacaoId}/recursos-espacos`);
  },
};
