export type EscalaColaborador = {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorFuncao: string;
  turnoId: string;
  turnoNome: string;
  turnoSigla: string;
  turnoCor: string;
  dias: Record<string, string | null>;
};

export type EscalaColaboradorInput = {
  colaboradorId: string;
  turnoId: string | null;
  dias: Record<string, string | null>;
};

export type Escala = {
  id: string;
  numerador: number;
  codigoExterno: string;
  titulo: string;
  grupoFuncaoId: string;
  grupoFuncaoNome: string;
  dataInicio: string;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type EscalaInput = {
  id?: string;
  codigoExterno?: string;
  titulo: string;
  grupoFuncaoId?: string | null;
  dataInicio: string;
};

export type FuncaoOption = {
  id: string;
  nome: string;
};

export type ColaboradorOption = {
  id: string;
  nome: string;
  funcaoId: string | null;
  funcaoNome: string | null;
};
