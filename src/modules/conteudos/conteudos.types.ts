export interface Conteudo {
  id: string;
  codigoExterno: string;
  descricao: string;
  quantidadeEpisodios: number;
  centroLucro: string;
  centroLucroId?: string;
  unidadeNegocio: string;
  unidadeNegocioId?: string;
  programaId?: string;
  programaNome?: string;
  tipoConteudo: string;
  tipoConteudoId?: string;
  classificacao: string;
  classificacaoId?: string;
  anoProducao: string;
  sinopse: string;
  usuarioCadastro: string;
  dataCadastro: string;
  tabelaPrecoId?: string;
  tabelaPrecoNome?: string;
  frequenciaDataInicio?: string;
  frequenciaDataFim?: string;
  frequenciaDiasSemana?: number[];
  orcamento?: number;
}

export interface ConteudoInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  descricao: string;
  quantidadeEpisodios: number;
  centroLucro: string;
  centroLucroId?: string;
  unidadeNegocio: string;
  unidadeNegocioId?: string;
  programaId?: string;
  tipoConteudo: string;
  tipoConteudoId?: string;
  classificacao: string;
  classificacaoId?: string;
  anoProducao: string;
  sinopse: string;
  tabelaPrecoId?: string;
  frequenciaDataInicio?: string;
  frequenciaDataFim?: string;
  frequenciaDiasSemana?: number[];
  orcamento?: number;
}

export interface ConteudoFormOptions {
  centrosLucro: Array<{ id: string; nome: string; parentId: string | null; status: string }>;
  statusList: Array<{ id: string; nome: string; cor: string }>;
  unidades: Array<{ id: string; nome: string; moeda?: string | null }>;
  tipos: Array<{ id: string; nome: string }>;
  classificacoes: Array<{ id: string; nome: string }>;
  centroLucroUnidades: Array<{ centroLucroId: string; unidadeNegocioId: string }>;
  tabelasPreco: Array<{ id: string; nome: string; unidadeNegocioId: string | null }>;
  programas: Array<{ id: string; nome: string; unidadeNegocioId: string | null }>;
}

export const generateCodigoConteudo = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `C${timestamp}`;
};
