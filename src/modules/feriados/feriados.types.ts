export type Feriado = {
  id: string;
  data: string;
  feriado: string;
  observacoes: string;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type FeriadoInput = {
  id?: string;
  data: string;
  feriado: string;
  observacoes?: string;
};
