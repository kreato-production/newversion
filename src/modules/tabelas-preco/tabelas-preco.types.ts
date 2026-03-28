export interface TabelaPrecoItem {
  id: string;
  codigoExterno: string;
  nome: string;
  status: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
  unidadeNegocioId: string;
  unidadeNegocioNome: string;
  moeda: string;
}

export interface TabelaPrecoInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  nome: string;
  status: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  descricao: string;
  unidadeNegocioId: string;
}

export interface UnidadeNegocioOption {
  id: string;
  nome: string;
  moeda: string;
}

export interface TabelaPrecoRecursoItem {
  id: string;
  tabelaPrecoId: string;
  recursoId: string;
  valorHora: number;
  recursoNome: string;
}

export interface RecursoOption {
  id: string;
  nome: string;
}
