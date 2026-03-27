import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { ConteudosRepository } from './conteudos.repository.js';

export const saveConteudoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().uuid().optional(),
  codigoExterno: z.string().optional().nullable(),
  descricao: z.string().min(1),
  quantidadeEpisodios: z.number().int().optional().nullable(),
  centroLucroId: z.string().optional().nullable(),
  unidadeNegocioId: z.string().uuid().optional().nullable(),
  programaId: z.string().uuid().optional().nullable(),
  tipoConteudoId: z.string().optional().nullable(),
  classificacaoId: z.string().optional().nullable(),
  anoProducao: z.string().optional().nullable(),
  sinopse: z.string().optional().nullable(),
  orcamento: z.number().optional().nullable(),
  tabelaPrecoId: z.string().optional().nullable(),
  frequenciaDataInicio: z.string().optional().nullable(),
  frequenciaDataFim: z.string().optional().nullable(),
  frequenciaDiasSemana: z.array(z.number().int()).optional().nullable(),
});

export type SaveConteudoDto = z.infer<typeof saveConteudoSchema>;

function formatDate(date: Date | null): string {
  return date ? date.toISOString() : '';
}

export class ConteudosService {
  constructor(private readonly repository: ConteudosRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, {
      ...opts,
      unidadeIds: actor.unidadeIds,
    });

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        descricao: item.descricao,
        quantidadeEpisodios: item.quantidadeEpisodios || 0,
        centroLucroId: item.centroLucroId || '',
        centroLucro: item.centroLucroNome || '',
        unidadeNegocioId: item.unidadeNegocioId || '',
        unidadeNegocio: item.unidadeNegocioNome || '',
        programaId: item.programaId || '',
        programaNome: item.programaNome || '',
        tipoConteudoId: item.tipoConteudoId || '',
        tipoConteudo: item.tipoConteudoNome || '',
        classificacaoId: item.classificacaoId || '',
        classificacao: item.classificacaoNome || '',
        anoProducao: item.anoProducao || '',
        sinopse: item.sinopse || '',
        usuarioCadastro: item.createdBy || '',
        dataCadastro: formatDate(item.createdAt),
        tabelaPrecoId: item.tabelaPrecoId || '',
        tabelaPrecoNome: item.tabelaPrecoNome || '',
        frequenciaDataInicio: item.frequenciaDataInicio || '',
        frequenciaDataFim: item.frequenciaDataFim || '',
        frequenciaDiasSemana: item.frequenciaDiasSemana || [],
        orcamento: item.orcamento,
      })),
    };
  }

  async save(actor: SessionUser, input: SaveConteudoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (existing) {
        ensureSameTenant(actor, existing.tenantId);
      }
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      descricao: input.descricao,
      quantidadeEpisodios: input.quantidadeEpisodios,
      centroLucroId: input.centroLucroId,
      unidadeNegocioId: input.unidadeNegocioId,
      programaId: input.programaId,
      tipoConteudoId: input.tipoConteudoId,
      classificacaoId: input.classificacaoId,
      anoProducao: input.anoProducao,
      sinopse: input.sinopse,
      orcamento: input.orcamento,
      tabelaPrecoId: input.tabelaPrecoId,
      frequenciaDataInicio: input.frequenciaDataInicio,
      frequenciaDataFim: input.frequenciaDataFim,
      frequenciaDiasSemana: input.frequenciaDiasSemana,
      createdBy: actor.id,
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      descricao: item.descricao,
      quantidadeEpisodios: item.quantidadeEpisodios || 0,
      centroLucroId: item.centroLucroId || '',
      centroLucro: item.centroLucroNome || '',
      unidadeNegocioId: item.unidadeNegocioId || '',
      unidadeNegocio: item.unidadeNegocioNome || '',
      programaId: item.programaId || '',
      programaNome: item.programaNome || '',
      tipoConteudoId: item.tipoConteudoId || '',
      tipoConteudo: item.tipoConteudoNome || '',
      classificacaoId: item.classificacaoId || '',
      classificacao: item.classificacaoNome || '',
      anoProducao: item.anoProducao || '',
      sinopse: item.sinopse || '',
      usuarioCadastro: item.createdBy || '',
      dataCadastro: formatDate(item.createdAt),
      tabelaPrecoId: item.tabelaPrecoId || '',
      tabelaPrecoNome: item.tabelaPrecoNome || '',
      frequenciaDataInicio: item.frequenciaDataInicio || '',
      frequenciaDataFim: item.frequenciaDataFim || '',
      frequenciaDiasSemana: item.frequenciaDiasSemana || [],
      orcamento: item.orcamento,
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);

    if (await this.repository.hasLinkedGravacoes(id)) {
      throw new Error('Conteudo possui gravacoes vinculadas e nao pode ser excluido');
    }

    await this.repository.remove(id);
  }

  async listOptions(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listOptions(tenantId, actor.unidadeIds);
  }
}
