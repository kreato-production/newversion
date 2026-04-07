import type { Equipe, EquipeInput, Membro, RecursoHumano } from './equipes.types';

type EquipeRow = {
  id: string;
  codigo: string;
  descricao: string;
  created_at: string | null;
  equipe_membros?: Array<{ id: string }> | null;
};

type RecursoHumanoRow = {
  id: string;
  nome: string;
  sobrenome: string;
  funcoes?: { nome: string | null } | null;
};

type MembroRow = {
  id: string;
  recurso_humano_id: string;
  created_at: string | null;
};

function formatDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '';
}

export function mapEquipeRow(row: EquipeRow): Equipe {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    membrosCount: row.equipe_membros?.length || 0,
    dataCadastro: formatDate(row.created_at),
  };
}

export function mapRecursoHumanoRow(row: RecursoHumanoRow): RecursoHumano {
  return {
    id: row.id,
    nome: row.nome,
    sobrenome: row.sobrenome,
    funcao_nome: row.funcoes?.nome || '',
  };
}

export function mapMembroRow(row: MembroRow): Membro {
  return {
    id: row.id,
    recursoHumanoId: row.recurso_humano_id,
    dataAssociacao: formatDate(row.created_at),
  };
}

export interface EquipesRepository {
  list(): Promise<Equipe[]>;
  create(input: EquipeInput): Promise<void>;
  update(id: string, input: EquipeInput): Promise<void>;
  remove(id: string): Promise<void>;
  listRecursosHumanosAtivos(): Promise<RecursoHumano[]>;
  listMembros(equipeId: string): Promise<{ membros: Membro[]; disponiveis: RecursoHumano[] }>;
  addMembro(equipeId: string, recursoHumanoId: string): Promise<Membro>;
  removeMembro(equipeId: string, membroId: string): Promise<void>;
}
