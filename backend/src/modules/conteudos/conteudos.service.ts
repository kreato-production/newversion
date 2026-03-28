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

export const conteudoResourceTypeSchema = z.enum(['tecnico', 'fisico']);

export const saveConteudoResourceSchema = z.object({
  tabelaPrecoId: z.string().optional().nullable(),
  recursoId: z.string().min(1),
  valorHora: z.number().nonnegative().default(0),
  quantidade: z.number().int().min(1).default(1),
  quantidadeHoras: z.number().nonnegative().default(0),
  valorTotal: z.number().nonnegative().default(0),
  descontoPercentual: z.number().min(0).max(100).default(0),
  valorComDesconto: z.number().nonnegative().default(0),
});

export const updateConteudoResourceSchema = z.object({
  quantidade: z.number().int().min(1),
  quantidadeHoras: z.number().nonnegative(),
  valorTotal: z.number().nonnegative(),
  descontoPercentual: z.number().min(0).max(100),
  valorComDesconto: z.number().nonnegative(),
});

export const saveConteudoTerceiroSchema = z.object({
  servicoId: z.string().min(1),
  valorPrevisto: z.number().nonnegative().default(0),
});

export const updateConteudoTerceiroSchema = z.object({
  valorPrevisto: z.number().nonnegative(),
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

  async listResources(
    actor: SessionUser,
    conteudoId: string,
    tipo: z.infer<typeof conteudoResourceTypeSchema>,
    tabelaPrecoId?: string | null,
  ) {
    const existing = await this.repository.findById(conteudoId);
    if (!existing) {
      throw new Error('Conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.listResources(existing.tenantId ?? resolveTenantId(actor, actor.tenantId), conteudoId, tipo, tabelaPrecoId);
  }

  async addResource(
    actor: SessionUser,
    conteudoId: string,
    tipo: z.infer<typeof conteudoResourceTypeSchema>,
    input: z.infer<typeof saveConteudoResourceSchema>,
  ) {
    const existing = await this.repository.findById(conteudoId);
    if (!existing) {
      throw new Error('Conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.addResource({
      tenantId: existing.tenantId ?? resolveTenantId(actor, actor.tenantId),
      conteudoId,
      tabelaPrecoId: input.tabelaPrecoId,
      tipo,
      recursoId: input.recursoId,
      valorHora: input.valorHora,
      quantidade: input.quantidade,
      quantidadeHoras: input.quantidadeHoras,
      valorTotal: input.valorTotal,
      descontoPercentual: input.descontoPercentual,
      valorComDesconto: input.valorComDesconto,
    });
  }

  async updateResource(
    actor: SessionUser,
    itemId: string,
    tipo: z.infer<typeof conteudoResourceTypeSchema>,
    input: z.infer<typeof updateConteudoResourceSchema>,
  ) {
    const existing = await this.repository.findResourceById(itemId, tipo);
    if (!existing) {
      throw new Error('Recurso do conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.updateResource(
      {
        id: itemId,
        quantidade: input.quantidade,
        quantidadeHoras: input.quantidadeHoras,
        valorTotal: input.valorTotal,
        descontoPercentual: input.descontoPercentual,
        valorComDesconto: input.valorComDesconto,
      },
      tipo,
    );
  }

  async removeResource(actor: SessionUser, itemId: string, tipo: z.infer<typeof conteudoResourceTypeSchema>) {
    const existing = await this.repository.findResourceById(itemId, tipo);
    if (!existing) {
      throw new Error('Recurso do conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.removeResource(itemId, tipo);
  }

  async listTerceiros(actor: SessionUser, conteudoId: string) {
    const existing = await this.repository.findById(conteudoId);
    if (!existing) {
      throw new Error('Conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.listTerceiros(existing.tenantId ?? resolveTenantId(actor, actor.tenantId), conteudoId);
  }

  async addTerceiro(actor: SessionUser, conteudoId: string, input: z.infer<typeof saveConteudoTerceiroSchema>) {
    const existing = await this.repository.findById(conteudoId);
    if (!existing) {
      throw new Error('Conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.addTerceiro({
      tenantId: existing.tenantId ?? resolveTenantId(actor, actor.tenantId),
      conteudoId,
      servicoId: input.servicoId,
      valorPrevisto: input.valorPrevisto,
      createdBy: actor.id,
    });
  }

  async updateTerceiro(actor: SessionUser, itemId: string, input: z.infer<typeof updateConteudoTerceiroSchema>) {
    const existing = await this.repository.findTerceiroById(itemId);
    if (!existing) {
      throw new Error('Terceiro do conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.updateTerceiro({
      id: itemId,
      valorPrevisto: input.valorPrevisto,
    });
  }

  async removeTerceiro(actor: SessionUser, itemId: string) {
    const existing = await this.repository.findTerceiroById(itemId);
    if (!existing) {
      throw new Error('Terceiro do conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.removeTerceiro(itemId);
  }

  async generateGravacoes(actor: SessionUser, conteudoId: string) {
    const existing = await this.repository.findById(conteudoId);
    if (!existing) {
      throw new Error('Conteudo nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);

    const items = await this.repository.generateGravacoes({
      tenantId: existing.tenantId ?? resolveTenantId(actor, actor.tenantId),
      conteudoId,
      createdById: actor.id,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        codigoExterno: item.codigoExterno || '',
        nome: item.nome,
        status: item.status || '',
        dataPrevista: formatDate(item.dataPrevista).slice(0, 10),
        dataCadastro: item.createdAt.toISOString(),
      })),
    };
  }
}
