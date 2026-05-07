export interface FaixaDisponibilidade {
  id: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[];
}

export interface Espaco {
  id: string;
  codigoExterno: string;
  titulo: string;
  descricao: string;
  faixasDisponibilidade: FaixaDisponibilidade[];
  dataCadastro: string;
  usuarioCadastro: string;
  usuarioCadastroId?: string;
}

export interface EspacoInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno?: string | null;
  titulo: string;
  descricao?: string | null;
  faixasDisponibilidade: FaixaDisponibilidade[];
}
