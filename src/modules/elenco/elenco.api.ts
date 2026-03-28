import { apiRequest } from '@/lib/api/http';

export type ElencoEntityType = 'gravacao' | 'conteudo';

export type ElencoPessoa = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string;
  foto: string;
  classificacao: string;
  telefone: string;
  email: string;
  status: string;
};

export type ElencoFigurino = {
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  imagemPrincipal: string;
};

export type ElencoFigurinoOption = {
  id: string;
  codigoFigurino: string;
  descricao: string;
  imagens: Array<{ id: string; url: string; isPrincipal: boolean }>;
};

export type ElencoMembro = {
  id: string;
  pessoaId: string;
  nome: string;
  nomeTrabalho: string;
  foto: string;
  classificacao: string;
  personagem: string;
  descricaoPersonagem: string;
  figurinos: ElencoFigurino[];
};

export const elencoApi = {
  list(entityType: ElencoEntityType, entityId: string) {
    return apiRequest<{
      pessoas: ElencoPessoa[];
      figurinos: ElencoFigurinoOption[];
      items: ElencoMembro[];
    }>(`/elenco/${entityType}/${entityId}`);
  },

  add(
    entityType: ElencoEntityType,
    entityId: string,
    input: {
      pessoaId: string;
      personagem: string;
      descricaoPersonagem?: string;
      figurinoIds?: string[];
    },
  ) {
    return apiRequest<ElencoMembro>(`/elenco/${entityType}/${entityId}`, {
      method: 'POST',
      body: JSON.stringify({
        pessoaId: input.pessoaId,
        personagem: input.personagem.trim(),
        descricaoPersonagem: input.descricaoPersonagem?.trim() || null,
        figurinoIds: input.figurinoIds ?? [],
      }),
    });
  },

  update(
    entityType: ElencoEntityType,
    entityId: string,
    itemId: string,
    input: { personagem: string; descricaoPersonagem?: string; figurinoIds?: string[] },
  ) {
    return apiRequest<ElencoMembro>(`/elenco/${entityType}/${entityId}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        personagem: input.personagem.trim(),
        descricaoPersonagem: input.descricaoPersonagem?.trim() || null,
        figurinoIds: input.figurinoIds ?? [],
      }),
    });
  },

  remove(entityType: ElencoEntityType, entityId: string, itemId: string) {
    return apiRequest<void>(`/elenco/${entityType}/${entityId}/${itemId}`, {
      method: 'DELETE',
    });
  },
};
