export interface RecursoTecnico {
  id: string;
  codigoExterno: string;
  nome: string;
  funcaoOperador: string;
  funcaoOperadorId?: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

export interface RecursoTecnicoInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  nome: string;
  funcaoOperador: string;
  funcaoOperadorId?: string;
}

export interface RecursoTecnicoOption {
  id: string;
  nome: string;
}

export interface RecursoTecnicoOptionsResponse {
  funcoes: RecursoTecnicoOption[];
}
