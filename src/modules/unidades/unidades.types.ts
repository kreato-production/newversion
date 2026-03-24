export interface UnidadeNegocio {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  imagem?: string;
  moeda?: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

export interface UnidadeNegocioInput extends UnidadeNegocio {}
