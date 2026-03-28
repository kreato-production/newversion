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

type LegacyClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

function createDisabledLegacyClient(): LegacyClient {
  return {
    from: () => {
      throw new Error(
        'O repositório legado de programas via Supabase foi desativado. Use a API local.',
      );
    },
  };
}

export class SupabaseProgramasRepository implements ProgramasRepository {
  constructor(private readonly client: LegacyClient = createDisabledLegacyClient()) {}

  async list(): Promise<Programa[]> {
    const { data, error } = await this.client
      .from('programas')
      .select('*, unidade_negocio:unidade_negocio_id(nome)')
      .order('nome');

    if (error) throw error;
    return ((data || []) as ProgramaRow[]).map(mapProgramaRow);
  }

  async save(input: ProgramaInput, userId?: string): Promise<void> {
    const payload = {
      codigo_externo: input.codigoExterno || null,
      nome: input.nome,
      descricao: input.descricao || null,
      unidade_negocio_id: input.unidadeNegocioId || null,
      created_by: userId || null,
    };

    if (input.id) {
      const { error } = await this.client.from('programas').update(payload).eq('id', input.id);
      if (error) throw error;
      return;
    }

    const { error } = await this.client.from('programas').insert(payload);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('programas').delete().eq('id', id);
    if (error) throw error;
  }
}

export const programasSupabaseRepository = new SupabaseProgramasRepository();
