export interface Gravacao {
  id: string;
  codigo: string;
  codigoExterno: string;
  nome: string;
  unidadeNegocioId: string;
  unidadeNegocio: string;
  centroLucro: string;
  classificacao: string;
  tipoConteudo: string;
  descricao: string;
  status: string;
  dataPrevista: string;
  dataCadastro: string;
  conteudoId?: string;
  orcamento?: number;
  programaId?: string;
  programa?: string;
}

export interface GravacaoInput {
  id?: string;
  codigo: string;
  codigoExterno: string;
  nome: string;
  unidadeNegocioId?: string;
  centroLucro: string;
  classificacao: string;
  tipoConteudo: string;
  descricao: string;
  status: string;
  dataPrevista: string;
  conteudoId?: string;
  orcamento?: number;
  programaId?: string;
}
