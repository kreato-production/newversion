export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUrl: string;
}

export interface Ausencia {
  id: string;
  motivo: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
}

export interface Escala {
  id: string;
  dataInicio: string;
  horaInicio: string;
  dataFim: string;
  horaFim: string;
  diasSemana: number[];
}

export interface RecursoHumano {
  id: string;
  codigoExterno: string;
  nome: string;
  sobrenome: string;
  foto?: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  departamento: string;
  departamentoId?: string;
  funcao: string;
  funcaoId?: string;
  custoHora: number;
  dataContratacao: string;
  status: 'Ativo' | 'Inativo';
  dataCadastro: string;
  usuarioCadastro: string;
  anexos: Anexo[];
  ausencias: Ausencia[];
  escalas: Escala[];
}

export interface RecursoHumanoInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  nome: string;
  sobrenome: string;
  foto?: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  departamento: string;
  departamentoId?: string;
  funcao: string;
  funcaoId?: string;
  custoHora: number;
  dataContratacao: string;
  status: 'Ativo' | 'Inativo';
  anexos: Anexo[];
  ausencias: Ausencia[];
  escalas: Escala[];
}

export interface RecursoHumanoOptions {
  departamentos: Array<{ id: string; nome: string }>;
  funcoes: Array<{ id: string; nome: string }>;
  departamentoFuncoes: Array<{ departamentoId: string; funcaoId: string }>;
}

export interface RecursoHumanoOcupacao {
  recursoId: string;
  data: string;
  gravacaoId: string;
  gravacaoNome: string;
  horaInicio: string;
  horaFim: string;
}
