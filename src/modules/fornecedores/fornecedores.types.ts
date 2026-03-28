export interface Fornecedor {
  id: string;
  codigoExterno: string;
  nome: string;
  categoria: string;
  categoriaId?: string;
  email: string;
  pais: string;
  identificacaoFiscal: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

export interface FornecedorInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  nome: string;
  categoria: string;
  categoriaId?: string;
  email: string;
  pais: string;
  identificacaoFiscal: string;
  descricao: string;
}

export interface CategoriaFornecedorOption {
  id: string;
  nome: string;
}

export interface ServicoOption {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface FornecedorServico {
  id: string;
  servicoId: string | null;
  nome: string;
  descricao: string | null;
  valor: number | null;
}

export interface FornecedorArquivo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number | null;
  createdAt: string;
}
