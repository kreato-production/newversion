export interface EstoqueItem {
  id: string;
  numerador: number;
  codigo: string;
  nome: string;
  descricao: string;
  imagemUrl?: string;
}

export interface FaixaDisponibilidade {
  id: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[];
}

export interface RecursoFisico {
  id: string;
  codigoExterno: string;
  nome: string;
  custoHora: number;
  faixasDisponibilidade: FaixaDisponibilidade[];
  estoqueItens?: EstoqueItem[];
  estoqueCount?: number;
  dataCadastro: string;
  usuarioCadastro: string;
  usuarioCadastroId?: string;
}

export interface RecursoFisicoInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  nome: string;
  custoHora: number;
  faixasDisponibilidade: FaixaDisponibilidade[];
  estoqueItens: EstoqueItem[];
}
