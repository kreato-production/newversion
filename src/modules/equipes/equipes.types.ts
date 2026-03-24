export interface Equipe {
  id: string;
  codigo: string;
  descricao: string;
  membrosCount: number;
  dataCadastro: string;
}

export interface EquipeInput {
  id?: string;
  codigo: string;
  descricao: string;
}

export interface RecursoHumano {
  id: string;
  nome: string;
  sobrenome: string;
  funcao_nome?: string;
}

export interface Membro {
  id: string;
  recursoHumanoId: string;
  dataAssociacao: string;
}
