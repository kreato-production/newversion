import type { Programa, ProgramaInput } from './programas.types';

type ProgramaRow = {
  id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  unidade_negocio_id: string | null;
  created_at: string | null;
  unidade_negocio?: { nome: string } | null;
};

function formatDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '';
}

export function mapProgramaRow(row: ProgramaRow): Programa {
  return {
    id: row.id,
    codigoExterno: row.codigo_externo || '',
    nome: row.nome,
    descricao: row.descricao || '',
    unidadeNegocioId: row.unidade_negocio_id || '',
    unidadeNegocio: row.unidade_negocio?.nome || '',
    dataCadastro: formatDate(row.created_at),
  };
}

export interface ProgramasRepository {
  list(): Promise<Programa[]>;
  save(input: ProgramaInput, userId?: string): Promise<void>;
  remove(id: string): Promise<void>;
}
