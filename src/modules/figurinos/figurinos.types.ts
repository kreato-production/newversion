export interface FigurinoImagem {
  id: string;
  url: string;
  isPrincipal: boolean;
}

export interface Figurino {
  id: string;
  codigoExterno: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tipoFigurinoId?: string;
  material?: string;
  materialId?: string;
  tamanhoPeca?: string;
  corPredominante?: string;
  corSecundaria?: string;
  imagens: FigurinoImagem[];
  dataCadastro: string;
  usuarioCadastro: string;
}

export interface FigurinoInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tipoFigurinoId?: string;
  material?: string;
  materialId?: string;
  tamanhoPeca?: string;
  corPredominante?: string;
  corSecundaria?: string;
  imagens: FigurinoImagem[];
}

export interface TipoFigurinoOption {
  id: string;
  nome: string;
}

export interface MaterialOption {
  id: string;
  nome: string;
}
