import type { Conteudo, ConteudoFormOptions, ConteudoInput } from './conteudos.types';

type ConteudoRow = {
  id: string;
  codigo_externo: string | null;
  descricao: string;
  quantidade_episodios: number | null;
  centro_lucro_id: string | null;
  unidade_negocio_id: string | null;
  programa_id: string | null;
  tipo_conteudo_id: string | null;
  classificacao_id: string | null;
  ano_producao: string | null;
  sinopse: string | null;
  orcamento: number | null;
  tabela_preco_id: string | null;
  frequencia_data_inicio: string | null;
  frequencia_data_fim: string | null;
  frequencia_dias_semana: number[] | null;
  created_at: string | null;
  created_by: string | null;
  centros_lucro?: { nome: string } | null;
  unidades_negocio?: { nome: string } | null;
  tipos_gravacao?: { nome: string } | null;
  classificacoes?: { nome: string } | null;
  tabelas_preco?: { nome: string } | null;
  programas?: { nome: string } | null;
};

function formatDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '';
}

export function mapConteudoRow(row: ConteudoRow): Conteudo {
  return {
    id: row.id,
    codigoExterno: row.codigo_externo || '',
    descricao: row.descricao,
    quantidadeEpisodios: row.quantidade_episodios || 0,
    centroLucro: row.centros_lucro?.nome || '',
    centroLucroId: row.centro_lucro_id || undefined,
    unidadeNegocio: row.unidades_negocio?.nome || '',
    unidadeNegocioId: row.unidade_negocio_id || undefined,
    programaId: row.programa_id || undefined,
    programaNome: row.programas?.nome || '',
    tipoConteudo: row.tipos_gravacao?.nome || '',
    tipoConteudoId: row.tipo_conteudo_id || undefined,
    classificacao: row.classificacoes?.nome || '',
    classificacaoId: row.classificacao_id || undefined,
    anoProducao: row.ano_producao || '',
    sinopse: row.sinopse || '',
    usuarioCadastro: row.created_by || '',
    dataCadastro: formatDate(row.created_at),
    tabelaPrecoId: row.tabela_preco_id || undefined,
    tabelaPrecoNome: row.tabelas_preco?.nome || '',
    frequenciaDataInicio: row.frequencia_data_inicio || undefined,
    frequenciaDataFim: row.frequencia_data_fim || undefined,
    frequenciaDiasSemana: row.frequencia_dias_semana || undefined,
    orcamento: row.orcamento || 0,
  };
}

export interface ConteudosRepository {
  list(): Promise<Conteudo[]>;
  save(input: ConteudoInput, userId?: string): Promise<void>;
  remove(id: string): Promise<void>;
  listOptions(unidadeIds?: string[]): Promise<ConteudoFormOptions>;
}

type LegacyClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

function createDisabledLegacyClient(): LegacyClient {
  return {
    from: () => {
      throw new Error(
        'O repositório legado de conteúdos via Supabase foi desativado. Use a API local.',
      );
    },
  };
}

export class SupabaseConteudosRepository implements ConteudosRepository {
  constructor(private readonly client: LegacyClient = createDisabledLegacyClient()) {}

  async list(): Promise<Conteudo[]> {
    const { data, error } = await this.client
      .from('conteudos')
      .select(
        `
        *,
        centros_lucro:centro_lucro_id(nome),
        unidades_negocio:unidade_negocio_id(nome),
        tipos_gravacao:tipo_conteudo_id(nome),
        classificacoes:classificacao_id(nome),
        tabelas_preco:tabela_preco_id(nome),
        programas:programa_id(nome)
      `,
      )
      .order('descricao');

    if (error) throw error;
    return ((data || []) as ConteudoRow[]).map(mapConteudoRow);
  }

  async save(input: ConteudoInput, userId?: string): Promise<void> {
    const payload = {
      codigo_externo: input.codigoExterno || null,
      descricao: input.descricao,
      quantidade_episodios: input.quantidadeEpisodios || 0,
      centro_lucro_id: input.centroLucroId || null,
      unidade_negocio_id: input.unidadeNegocioId || null,
      programa_id: input.programaId || null,
      tipo_conteudo_id: input.tipoConteudoId || null,
      classificacao_id: input.classificacaoId || null,
      ano_producao: input.anoProducao || null,
      sinopse: input.sinopse || null,
      orcamento: input.orcamento || 0,
      tabela_preco_id: input.tabelaPrecoId || null,
      frequencia_data_inicio: input.frequenciaDataInicio || null,
      frequencia_data_fim: input.frequenciaDataFim || null,
      frequencia_dias_semana: input.frequenciaDiasSemana?.length
        ? input.frequenciaDiasSemana
        : null,
      created_by: userId || null,
    };

    if (input.id) {
      const { error } = await this.client.from('conteudos').update(payload).eq('id', input.id);
      if (error) throw error;
      return;
    }

    const { error } = await this.client.from('conteudos').insert(payload);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('conteudos').delete().eq('id', id);
    if (error) throw error;
  }

  async listOptions(unidadeIds?: string[]): Promise<ConteudoFormOptions> {
    const [
      centrosRes,
      statusRes,
      unidadesRes,
      tiposRes,
      classificacoesRes,
      centroLucroUnidadesRes,
      tabelasPrecoRes,
      programasRes,
    ] = await Promise.all([
      this.client
        .from('centros_lucro')
        .select('id, nome, parent_id, status')
        .eq('status', 'Ativo')
        .order('nome'),
      this.client.from('status_gravacao').select('id, nome, cor').order('nome'),
      (() => {
        let query = this.client.from('unidades_negocio').select('id, nome, moeda');
        if (unidadeIds && unidadeIds.length > 0) {
          query = query.in('id', unidadeIds);
        }
        return query.order('nome');
      })(),
      this.client.from('tipos_gravacao').select('id, nome').order('nome'),
      this.client.from('classificacoes').select('id, nome').order('nome'),
      this.client.from('centro_lucro_unidades').select('centro_lucro_id, unidade_negocio_id'),
      this.client
        .from('tabelas_preco')
        .select('id, nome, unidade_negocio_id')
        .eq('status', 'Ativo')
        .order('nome'),
      this.client.from('programas').select('id, nome, unidade_negocio_id').order('nome'),
    ]);

    return {
      centrosLucro: (centrosRes.data || []).map((item) => ({
        id: item.id,
        nome: item.nome,
        parentId: item.parent_id,
        status: item.status || 'Ativo',
      })),
      statusList: (statusRes.data || []).map((item) => ({
        id: item.id,
        nome: item.nome,
        cor: item.cor || '#888888',
      })),
      unidades: (unidadesRes.data || []).map((item) => ({
        id: item.id,
        nome: item.nome,
        moeda: item.moeda,
      })),
      tipos: tiposRes.data || [],
      classificacoes: classificacoesRes.data || [],
      centroLucroUnidades: (centroLucroUnidadesRes.data || []).map((item) => ({
        centroLucroId: item.centro_lucro_id,
        unidadeNegocioId: item.unidade_negocio_id,
      })),
      tabelasPreco: (
        (tabelasPrecoRes.data || []) as Array<{
          id: string;
          nome: string;
          unidade_negocio_id: string | null;
        }>
      ).map((item) => ({
        id: item.id,
        nome: item.nome,
        unidadeNegocioId: item.unidade_negocio_id,
      })),
      programas: (programasRes.data || []).map((item) => ({
        id: item.id,
        nome: item.nome,
        unidadeNegocioId: item.unidade_negocio_id,
      })),
    };
  }
}

export const conteudosSupabaseRepository = new SupabaseConteudosRepository();
