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

function mapEquipeRow(row: EquipeRow): Equipe {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    membrosCount: row.equipe_membros?.length || 0,
    dataCadastro: formatDate(row.created_at),
  };
}

function mapRecursoHumanoRow(row: RecursoHumanoRow): RecursoHumano {
  return {
    id: row.id,
    nome: row.nome,
    sobrenome: row.sobrenome,
    funcao_nome: row.funcoes?.nome || '',
  };
}

function mapMembroRow(row: MembroRow): Membro {
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

type LegacyClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

function createDisabledLegacyClient(): LegacyClient {
  return {
    from: () => {
      throw new Error(
        'O repositório legado de equipes via Supabase foi desativado. Use a API local.',
      );
    },
  };
}

export class SupabaseEquipesRepository implements EquipesRepository {
  constructor(private readonly client: LegacyClient = createDisabledLegacyClient()) {}

  async list(): Promise<Equipe[]> {
    const { data, error } = await this.client
      .from('equipes')
      .select('id, codigo, descricao, created_at, equipe_membros(id)')
      .order('codigo');

    if (error) throw error;
    return ((data || []) as EquipeRow[]).map(mapEquipeRow);
  }

  async create(input: EquipeInput): Promise<void> {
    const { error } = await this.client.from('equipes').insert({
      codigo: input.codigo,
      descricao: input.descricao,
    });

    if (error) throw error;
  }

  async update(id: string, input: EquipeInput): Promise<void> {
    const { error } = await this.client
      .from('equipes')
      .update({ codigo: input.codigo, descricao: input.descricao })
      .eq('id', id);

    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('equipes').delete().eq('id', id);
    if (error) throw error;
  }

  async listRecursosHumanosAtivos(): Promise<RecursoHumano[]> {
    const { data, error } = await this.client
      .from('recursos_humanos')
      .select('id, nome, sobrenome, funcoes(nome)')
      .eq('status', 'Ativo')
      .order('nome');

    if (error) throw error;
    return ((data || []) as RecursoHumanoRow[]).map(mapRecursoHumanoRow);
  }

  async listMembros(
    equipeId: string,
  ): Promise<{ membros: Membro[]; disponiveis: RecursoHumano[] }> {
    const [membrosResult, rhResult] = await Promise.all([
      this.client
        .from('equipe_membros')
        .select('id, recurso_humano_id, created_at')
        .eq('equipe_id', equipeId),
      this.client
        .from('recursos_humanos')
        .select('id, nome, sobrenome, funcoes(nome)')
        .eq('status', 'Ativo')
        .order('nome'),
    ]);

    if (membrosResult.error) throw membrosResult.error;
    if (rhResult.error) throw rhResult.error;

    return {
      membros: ((membrosResult.data || []) as MembroRow[]).map(mapMembroRow),
      disponiveis: ((rhResult.data || []) as RecursoHumanoRow[]).map(mapRecursoHumanoRow),
    };
  }

  async addMembro(equipeId: string, recursoHumanoId: string): Promise<Membro> {
    const { data, error } = await this.client
      .from('equipe_membros')
      .insert({ equipe_id: equipeId, recurso_humano_id: recursoHumanoId })
      .select('id, recurso_humano_id, created_at')
      .single();
    if (error) throw error;
    return mapMembroRow(data as MembroRow);
  }

  async removeMembro(_equipeId: string, membroId: string): Promise<void> {
    const { error } = await this.client.from('equipe_membros').delete().eq('id', membroId);
    if (error) throw error;
  }
}

export const equipesRepository = new SupabaseEquipesRepository();

export { mapEquipeRow, mapMembroRow, mapRecursoHumanoRow };
