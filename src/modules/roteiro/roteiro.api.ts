import { apiRequest } from '@/lib/api/http';

export type RoteiroCena = {
  id: string;
  ordem: number;
  capitulo: string;
  numeroCena: string;
  ambiente: string;
  tipoAmbiente: string;
  periodo: string;
  localGravacao: string;
  personagens: string[];
  figurantes: string[];
  tempoAproximado: string;
  ritmo: string;
  descricao: string;
};

export type RoteiroElenco = {
  id: string;
  pessoaId: string;
  nome: string;
  nomeTrabalho: string;
  personagem: string;
};

export type RoteiroFigurante = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string;
  status: string;
};

export const roteiroApi = {
  list(gravacaoId: string, conteudoId?: string) {
    const query = conteudoId ? `?conteudoId=${encodeURIComponent(conteudoId)}` : '';
    return apiRequest<{
      cenas: RoteiroCena[];
      elenco: RoteiroElenco[];
      figurantes: RoteiroFigurante[];
    }>(`/gravacoes/${gravacaoId}/roteiro${query}`);
  },

  saveCena(gravacaoId: string, cena: RoteiroCena) {
    const method = cena.id ? 'PUT' : 'POST';
    const path = cena.id
      ? `/gravacoes/${gravacaoId}/roteiro/cenas/${cena.id}`
      : `/gravacoes/${gravacaoId}/roteiro/cenas`;

    return apiRequest<RoteiroCena>(path, {
      method,
      body: JSON.stringify(cena),
    });
  },

  removeCena(gravacaoId: string, sceneId: string) {
    return apiRequest<void>(`/gravacoes/${gravacaoId}/roteiro/cenas/${sceneId}`, {
      method: 'DELETE',
    });
  },
};
