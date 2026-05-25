export interface Programa {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor?: string | null;
  unidadeNegocioId: string;
  unidadeNegocio: string;
  dataCadastro: string;
}

export interface ProgramaInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor?: string | null;
  unidadeNegocioId?: string | null;
}
