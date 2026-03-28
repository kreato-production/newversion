import { apiRequest } from '@/lib/api/http';

export type ConteudoResourceType = 'tecnico' | 'fisico';

export type ConteudoResourceItem = {
  id: string;
  tenantId: string;
  conteudoId: string;
  tabelaPrecoId: string | null;
  recursoId: string;
  recursoNome: string;
  valorHora: number;
  quantidade: number;
  quantidadeHoras: number;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
};

export type ConteudoAvailableResource = {
  recursoId: string;
  recursoNome: string;
  valorHora: number;
};

export type ConteudoTerceiroItem = {
  id: string;
  tenantId: string;
  conteudoId: string;
  servicoId: string;
  servicoNome: string;
  valorPrevisto: number;
};

export type ConteudoTerceiroServico = {
  id: string;
  nome: string;
};

export const conteudosRelacionamentosApi = {
  listResources(conteudoId: string, tipo: ConteudoResourceType, tabelaPrecoId?: string) {
    const query = new URLSearchParams({ tipo });
    if (tabelaPrecoId) {
      query.set('tabelaPrecoId', tabelaPrecoId);
    }

    return apiRequest<{
      items: ConteudoResourceItem[];
      availableResources: ConteudoAvailableResource[];
    }>(`/conteudos/${conteudoId}/recursos?${query.toString()}`);
  },

  addResource(
    conteudoId: string,
    tipo: ConteudoResourceType,
    input: {
      tabelaPrecoId?: string | null;
      recursoId: string;
      valorHora: number;
      quantidade: number;
      quantidadeHoras: number;
      valorTotal: number;
      descontoPercentual: number;
      valorComDesconto: number;
    },
  ) {
    const query = new URLSearchParams({ tipo }).toString();
    return apiRequest<ConteudoResourceItem>(`/conteudos/${conteudoId}/recursos?${query}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateResource(
    conteudoId: string,
    itemId: string,
    tipo: ConteudoResourceType,
    input: {
      quantidade: number;
      quantidadeHoras: number;
      valorTotal: number;
      descontoPercentual: number;
      valorComDesconto: number;
    },
  ) {
    const query = new URLSearchParams({ tipo }).toString();
    return apiRequest<ConteudoResourceItem>(
      `/conteudos/${conteudoId}/recursos/${itemId}?${query}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
    );
  },

  removeResource(conteudoId: string, itemId: string, tipo: ConteudoResourceType) {
    const query = new URLSearchParams({ tipo }).toString();
    return apiRequest<void>(`/conteudos/${conteudoId}/recursos/${itemId}?${query}`, {
      method: 'DELETE',
    });
  },

  listTerceiros(conteudoId: string) {
    return apiRequest<{ items: ConteudoTerceiroItem[]; servicos: ConteudoTerceiroServico[] }>(
      `/conteudos/${conteudoId}/terceiros`,
    );
  },

  addTerceiro(conteudoId: string, input: { servicoId: string; valorPrevisto: number }) {
    return apiRequest<ConteudoTerceiroItem>(`/conteudos/${conteudoId}/terceiros`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateTerceiro(conteudoId: string, itemId: string, input: { valorPrevisto: number }) {
    return apiRequest<ConteudoTerceiroItem>(`/conteudos/${conteudoId}/terceiros/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  removeTerceiro(conteudoId: string, itemId: string) {
    return apiRequest<void>(`/conteudos/${conteudoId}/terceiros/${itemId}`, {
      method: 'DELETE',
    });
  },

  generateGravacoes(conteudoId: string) {
    return apiRequest<{
      items: Array<{
        id: string;
        codigo: string;
        codigoExterno: string;
        nome: string;
        status: string;
        dataPrevista: string;
        dataCadastro: string;
      }>;
    }>(`/conteudos/${conteudoId}/gerar-gravacoes`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
