import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Gravacao, GravacaoInput } from './gravacoes.types';

type GravacaoRow = {
  id: string;
  codigo: string;
  codigo_externo: string | null;
  nome: string;
  unidade_negocio_id: string | null;
  descricao: string | null;
  centro_lucro?: { nome: string } | null;
  classificacao?: { nome: string } | null;
  tipo_conteudo?: { nome: string } | null;
  status_gravacao?: { nome: string } | null;
  unidade_negocio?: { nome: string } | null;
  programa?: { nome: string } | null;
  data_prevista: string | null;
  created_at: string | null;
  conteudo_id: string | null;
  orcamento: number | null;
  programa_id: string | null;
};

export interface GravacoesRepository {
  list(unidadeIds?: string[]): Promise<Gravacao[]>;
  save(input: GravacaoInput, userId?: string): Promise<void>;
  remove(id: string): Promise<void>;
}

function formatDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '';
}

function mapRow(row: GravacaoRow): Gravacao {
  return {
    id: row.id,
    codigo: row.codigo,
    codigoExterno: row.codigo_externo || '',
    nome: row.nome,
    unidadeNegocioId: row.unidade_negocio_id || '',
    unidadeNegocio: row.unidade_negocio?.nome || '',
    centroLucro: row.centro_lucro?.nome || '',
    classificacao: row.classificacao?.nome || '',
    tipoConteudo: row.tipo_conteudo?.nome || '',
    descricao: row.descricao || '',
    status: row.status_gravacao?.nome || '',
    dataPrevista: row.data_prevista || '',
    dataCadastro: formatDate(row.created_at),
    conteudoId: row.conteudo_id || '',
    orcamento: row.orcamento || 0,
    programaId: row.programa_id || '',
    programa: row.programa?.nome || '',
  };
}

export class SupabaseGravacoesRepository implements GravacoesRepository {
  constructor(private readonly client: SupabaseClient = supabase) {}

  async list(unidadeIds?: string[]): Promise<Gravacao[]> {
    let query = this.client
      .from('gravacoes')
      .select(`
        *,
        unidade_negocio:unidade_negocio_id(nome),
        centro_lucro:centro_lucro_id(nome),
        classificacao:classificacao_id(nome),
        tipo_conteudo:tipo_conteudo_id(nome),
        status_gravacao:status_id(nome),
        programa:programa_id(nome)
      `)
      .order('created_at', { ascending: false });

    if (unidadeIds && unidadeIds.length > 0) {
      query = query.in('unidade_negocio_id', unidadeIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data || []) as GravacaoRow[]).map(mapRow);
  }

  async save(input: GravacaoInput, userId?: string): Promise<void> {
    const payload = {
      codigo: input.codigo,
      codigo_externo: input.codigoExterno || null,
      nome: input.nome,
      descricao: input.descricao || null,
      data_prevista: input.dataPrevista || null,
      conteudo_id: input.conteudoId || null,
      orcamento: input.orcamento || 0,
      programa_id: input.programaId || null,
      created_by: userId || null,
    };

    if (input.id) {
      const { error } = await this.client.from('gravacoes').update(payload).eq('id', input.id);
      if (error) throw error;
      return;
    }

    const { error } = await this.client.from('gravacoes').insert(payload);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('gravacoes').delete().eq('id', id);
    if (error) throw error;
  }
}

export const gravacoesSupabaseRepository = new SupabaseGravacoesRepository();
