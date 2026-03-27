export interface Programa {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
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
  unidadeNegocioId?: string | null;
}
