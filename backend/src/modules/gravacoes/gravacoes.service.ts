import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { GravacoesRepository } from './gravacoes.repository.js';
import type { ContasPagarRepository } from '../contas-pagar/contas-pagar.repository.js';

const emptyStringToNull = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  return value;
};

const optionalNullableString = z.preprocess(emptyStringToNull, z.string().optional().nullable());
const optionalNullableUuid = z.preprocess(emptyStringToNull, z.string().uuid().optional().nullable());

export const saveGravacaoSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  codigo: z.string().min(1),
  codigoExterno: optionalNullableString,
  nome: z.string().min(1),
  descricao: optionalNullableString,
  unidadeNegocioId: optionalNullableUuid,
  centroLucro: optionalNullableString,
  classificacao: optionalNullableString,
  tipoConteudo: optionalNullableString,
  status: optionalNullableString,
  dataPrevista: optionalNullableString,
  conteudoId: optionalNullableString,
  orcamento: z.number().optional(),
  programaId: optionalNullableUuid,
});

export const saveGravacaoFigurinoSchema = z.object({
  figurinoId: z.string().min(1),
  observacao: optionalNullableString,
  pessoaId: optionalNullableString,
});

export const updateGravacaoFigurinoSchema = z.object({
  observacao: optionalNullableString,
  pessoaId: optionalNullableString,
});

export const saveGravacaoTerceiroSchema = z.object({
  fornecedorId: z.string().min(1),
  servicoId: optionalNullableString,
  valor: z.number().optional().nullable(),
  observacao: optionalNullableString,
});

export const saveGravacaoConvidadoSchema = z.object({
  pessoaId: z.string().min(1),
  observacao: optionalNullableString,
});

export const saveGravacaoEspacoSchema = z.object({
  espacoId: z.string().min(1),
  descricao: optionalNullableString,
  horaInicio: optionalNullableString,
  horaFim: optionalNullableString,
  data: optionalNullableString,
});

export const updateGravacaoEspacoSchema = z.object({
  espacoId: z.string().min(1),
  descricao: optionalNullableString,
  horaInicio: optionalNullableString,
  horaFim: optionalNullableString,
  data: optionalNullableString,
});

export const gravacaoEspacoResourceTypeSchema = z.enum(['fisico', 'tecnico']);

export const saveGravacaoEspacoResourceSchema = z.object({
  recursoId: z.string().min(1),
  valorHora: z.number(),
  quantidade: z.number().int().min(1),
  horaInicio: optionalNullableString,
  horaFim: optionalNullableString,
  valorTotal: z.number(),
  descontoPercentual: z.number(),
  valorComDesconto: z.number(),
});

export const updateGravacaoEspacoResourceSchema = z.object({
  quantidade: z.number().int().min(1),
  horaInicio: optionalNullableString,
  horaFim: optionalNullableString,
  valorTotal: z.number(),
  descontoPercentual: z.number(),
  valorComDesconto: z.number(),
});

export const saveGravacaoDespesaSchema = z.object({
  titulo: z.string().min(1),
  numeroDocumento: optionalNullableString,
  descricao: optionalNullableString,
  status: optionalNullableString,
  tipoDocumento: optionalNullableString,
  categoria: optionalNullableString,
  dataVencimento: optionalNullableString,
  valor: z.number().optional().nullable(),
  fornecedorId: optionalNullableUuid,
  formaPagamento: optionalNullableString,
});

export type SaveGravacaoDto = z.infer<typeof saveGravacaoSchema>;

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '';
}

export class GravacoesService {
  constructor(
    private readonly repository: GravacoesRepository,
    private readonly contasPagarRepository?: ContasPagarRepository,
  ) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const [{ data, total }, statusCores] = await Promise.all([
      this.repository.listByTenant(tenantId, opts),
      this.repository.listStatusCores(tenantId),
    ]);

    const corByNome = new Map(statusCores.map((s) => [s.nome, s.cor ?? '']));

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        codigoExterno: item.codigoExterno || '',
        nome: item.nome,
        unidadeNegocioId: item.unidadeNegocioId || '',
        unidadeNegocio: item.unidadeNegocioNome || '',
        centroLucro: item.centroLucro || '',
        classificacao: item.classificacao || '',
        tipoConteudo: item.tipoConteudo || '',
        descricao: item.descricao || '',
        status: item.status || '',
        statusCor: item.status ? (corByNome.get(item.status) ?? '') : '',
        dataPrevista: formatDate(item.dataPrevista),
        dataCadastro: item.createdAt.toISOString(),
        conteudoId: item.conteudoId || '',
        orcamento: item.orcamento,
        programaId: item.programaId || '',
        programa: item.programaNome || '',
      })),
    };
  }

  async getById(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const [statusCores, item] = await Promise.all([
      this.repository.listStatusCores(tenantId),
      this.repository.findById(id),
    ]);
    if (!item || item.tenantId !== tenantId) return null;
    const corByNome = new Map(statusCores.map((s) => [s.nome, s.cor ?? '']));
    return {
      id: item.id,
      codigo: item.codigo,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      unidadeNegocioId: item.unidadeNegocioId || '',
      unidadeNegocio: item.unidadeNegocioNome || '',
      centroLucro: item.centroLucro || '',
      classificacao: item.classificacao || '',
      tipoConteudo: item.tipoConteudo || '',
      descricao: item.descricao || '',
      status: item.status || '',
      statusCor: item.status ? (corByNome.get(item.status) ?? '') : '',
      dataPrevista: formatDate(item.dataPrevista),
      dataCadastro: item.createdAt.toISOString(),
      conteudoId: item.conteudoId || '',
      orcamento: item.orcamento,
      programaId: item.programaId || '',
      programa: item.programaNome || '',
    };
  }

  async save(actor: SessionUser, input: SaveGravacaoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Gravacao nao encontrada');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigo: input.codigo,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      descricao: input.descricao,
      unidadeNegocioId: input.unidadeNegocioId,
      centroLucro: input.centroLucro,
      classificacao: input.classificacao,
      tipoConteudo: input.tipoConteudo,
      status: input.status,
      dataPrevista: input.dataPrevista ? new Date(`${input.dataPrevista}T00:00:00.000Z`) : null,
      conteudoId: input.conteudoId,
      orcamento: input.orcamento ?? 0,
      programaId: input.programaId,
      createdById: actor.id,
    });

    return {
      id: item.id,
      codigo: item.codigo,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      unidadeNegocioId: item.unidadeNegocioId || '',
      unidadeNegocio: item.unidadeNegocioNome || '',
      centroLucro: item.centroLucro || '',
      classificacao: item.classificacao || '',
      tipoConteudo: item.tipoConteudo || '',
      descricao: item.descricao || '',
      status: item.status || '',
      dataPrevista: formatDate(item.dataPrevista),
      dataCadastro: item.createdAt.toISOString(),
      conteudoId: item.conteudoId || '',
      orcamento: item.orcamento,
      programaId: item.programaId || '',
      programa: item.programaNome || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async listFigurinos(actor: SessionUser, gravacaoId: string) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const data = await this.repository.listFigurinos(gravacao.tenantId, gravacaoId);

    return {
      figurinos: data.figurinos.map((item) => ({
        id: item.id,
        codigoFigurino: item.codigoFigurino,
        descricao: item.descricao,
        tipoFigurino: item.tipoFigurino || '',
        tamanhoPeca: item.tamanhoPeca || '',
        imagens: item.imagens.map((imagem) => ({
          url: imagem.url,
          isPrincipal: imagem.isPrincipal,
        })),
      })),
      items: data.items.map((item) => ({
        id: item.id,
        figurinoId: item.figurinoId,
        codigoFigurino: item.codigoFigurino,
        descricao: item.descricao,
        tipoFigurino: item.tipoFigurino || '',
        tamanhoPeca: item.tamanhoPeca || '',
        imagemPrincipal: item.imagemPrincipal || '',
        observacao: item.observacao || '',
        pessoaId: item.pessoaId || '',
      })),
    };
  }

  async addFigurino(actor: SessionUser, gravacaoId: string, input: z.infer<typeof saveGravacaoFigurinoSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const item = await this.repository.addFigurino({
      tenantId: gravacao.tenantId,
      gravacaoId,
      figurinoId: input.figurinoId,
      observacao: input.observacao,
      pessoaId: input.pessoaId,
    });

    return {
      id: item.id,
      figurinoId: item.figurinoId,
      codigoFigurino: item.codigoFigurino,
      descricao: item.descricao,
      tipoFigurino: item.tipoFigurino || '',
      tamanhoPeca: item.tamanhoPeca || '',
      imagemPrincipal: item.imagemPrincipal || '',
      observacao: item.observacao || '',
      pessoaId: item.pessoaId || '',
    };
  }

  async updateFigurino(
    actor: SessionUser,
    gravacaoId: string,
    itemId: string,
    input: z.infer<typeof updateGravacaoFigurinoSchema>,
  ) {
    const item = await this.repository.findFigurinoAllocationById(itemId);
    if (!item || item.gravacaoId !== gravacaoId) {
      throw new Error('Figurino da gravacao nao encontrado');
    }

    ensureSameTenant(actor, item.tenantId);

    const updated = await this.repository.updateFigurino({
      id: itemId,
      observacao: input.observacao,
      pessoaId: input.pessoaId,
    });

    if (!updated) {
      throw new Error('Figurino da gravacao nao encontrado');
    }

    return {
      id: updated.id,
      figurinoId: updated.figurinoId,
      codigoFigurino: updated.codigoFigurino,
      descricao: updated.descricao,
      tipoFigurino: updated.tipoFigurino || '',
      tamanhoPeca: updated.tamanhoPeca || '',
      imagemPrincipal: updated.imagemPrincipal || '',
      observacao: updated.observacao || '',
      pessoaId: updated.pessoaId || '',
    };
  }

  async removeFigurino(actor: SessionUser, gravacaoId: string, itemId: string) {
    const item = await this.repository.findFigurinoAllocationById(itemId);
    if (!item || item.gravacaoId !== gravacaoId) {
      throw new Error('Figurino da gravacao nao encontrado');
    }

    ensureSameTenant(actor, item.tenantId);
    await this.repository.removeFigurino(itemId);
  }

  async listTerceiros(actor: SessionUser, gravacaoId: string) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const data = await this.repository.listTerceiros(gravacao.tenantId, gravacaoId);

    return {
      moeda: data.moeda,
      fornecedores: data.fornecedores.map((item) => ({
        id: item.id,
        nome: item.nome,
        categoria: item.categoria || '',
      })),
      servicos: data.servicos.map((item) => ({
        id: item.id,
        fornecedorId: item.fornecedorId,
        nome: item.nome,
        descricao: item.descricao || '',
        valor: item.valor ?? 0,
      })),
      items: data.items.map((item) => ({
        id: item.id,
        fornecedorId: item.fornecedorId,
        fornecedorNome: item.fornecedorNome,
        servicoId: item.servicoId || '',
        servicoNome: item.servicoNome || '',
        custo: item.valor ?? 0,
        observacao: item.observacao || '',
      })),
    };
  }

  async addTerceiro(actor: SessionUser, gravacaoId: string, input: z.infer<typeof saveGravacaoTerceiroSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const item = await this.repository.addTerceiro({
      tenantId: gravacao.tenantId,
      gravacaoId,
      fornecedorId: input.fornecedorId,
      servicoId: input.servicoId,
      valor: input.valor,
      observacao: input.observacao,
    });

    return {
      id: item.id,
      fornecedorId: item.fornecedorId,
      fornecedorNome: item.fornecedorNome,
      servicoId: item.servicoId || '',
      servicoNome: item.servicoNome || '',
      custo: item.valor ?? 0,
      observacao: item.observacao || '',
    };
  }

  async removeTerceiro(actor: SessionUser, gravacaoId: string, itemId: string) {
    const item = await this.repository.findTerceiroById(itemId);
    if (!item || item.gravacaoId !== gravacaoId) {
      throw new Error('Terceiro da gravacao nao encontrado');
    }

    ensureSameTenant(actor, item.tenantId);
    await this.repository.removeTerceiro(itemId);
  }

  async listConvidados(actor: SessionUser, gravacaoId: string) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);
    const data = await this.repository.listConvidados(gravacao.tenantId, gravacaoId);

    return {
      pessoas: data.pessoas.map((item) => ({
        id: item.id,
        nome: item.nome,
        sobrenome: item.sobrenome,
        nomeTrabalho: item.nomeTrabalho || '',
        foto: item.foto || '',
        telefone: item.telefone || '',
        email: item.email || '',
        status: item.status || 'Ativo',
      })),
      items: data.items.map((item) => ({
        id: item.id,
        pessoaId: item.pessoaId,
        nome: `${item.nome} ${item.sobrenome}`.trim(),
        nomeTrabalho: item.nomeTrabalho || '',
        foto: item.foto || '',
        telefone: item.telefone || '',
        email: item.email || '',
        observacoes: item.observacao || '',
      })),
    };
  }

  async addConvidado(actor: SessionUser, gravacaoId: string, input: z.infer<typeof saveGravacaoConvidadoSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);
    const item = await this.repository.addConvidado({
      tenantId: gravacao.tenantId,
      gravacaoId,
      pessoaId: input.pessoaId,
      observacao: input.observacao,
    });

    return {
      id: item.id,
      pessoaId: item.pessoaId,
      nome: `${item.nome} ${item.sobrenome}`.trim(),
      nomeTrabalho: item.nomeTrabalho || '',
      foto: item.foto || '',
      telefone: item.telefone || '',
      email: item.email || '',
      observacoes: item.observacao || '',
    };
  }

  async removeConvidado(actor: SessionUser, gravacaoId: string, itemId: string) {
    const item = await this.repository.findConvidadoById(itemId);
    if (!item || item.gravacaoId !== gravacaoId) {
      throw new Error('Convidado da gravacao nao encontrado');
    }

    ensureSameTenant(actor, item.tenantId);
    await this.repository.removeConvidado(itemId);
  }

  async listEspacos(actor: SessionUser, gravacaoId: string) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    const items = await this.repository.listEspacos(gravacao.tenantId, gravacaoId);
    return items.map((item) => this.mapEspaco(item));
  }

  async addEspaco(actor: SessionUser, gravacaoId: string, input: z.infer<typeof saveGravacaoEspacoSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    const item = await this.repository.addEspaco({
      tenantId: gravacao.tenantId,
      gravacaoId,
      espacoId: input.espacoId,
      descricao: input.descricao,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
      data: input.data,
      createdBy: actor.id,
    });
    return this.mapEspaco(item);
  }

  async updateEspaco(actor: SessionUser, gravacaoId: string, itemId: string, input: z.infer<typeof updateGravacaoEspacoSchema>) {
    const existing = await this.repository.findEspacoById(itemId);
    if (!existing || existing.gravacaoId !== gravacaoId) throw new Error('Espaco da gravacao nao encontrado');
    ensureSameTenant(actor, existing.tenantId);
    const updated = await this.repository.updateEspaco({ id: itemId, espacoId: input.espacoId, descricao: input.descricao, horaInicio: input.horaInicio, horaFim: input.horaFim, data: input.data });
    if (!updated) throw new Error('Espaco da gravacao nao encontrado');
    return this.mapEspaco(updated);
  }

  async removeEspaco(actor: SessionUser, gravacaoId: string, itemId: string) {
    const existing = await this.repository.findEspacoById(itemId);
    if (!existing || existing.gravacaoId !== gravacaoId) throw new Error('Espaco da gravacao nao encontrado');
    ensureSameTenant(actor, existing.tenantId);
    await this.repository.removeEspaco(itemId);
  }

  async listEspacoResources(actor: SessionUser, gravacaoId: string, espacoItemId: string, tipo: z.infer<typeof gravacaoEspacoResourceTypeSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    return this.repository.listEspacoResources(gravacao.tenantId, espacoItemId, tipo);
  }

  async addEspacoResource(actor: SessionUser, gravacaoId: string, espacoItemId: string, tipo: z.infer<typeof gravacaoEspacoResourceTypeSchema>, input: z.infer<typeof saveGravacaoEspacoResourceSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    return this.repository.addEspacoResource({
      tenantId: gravacao.tenantId,
      gravacaoEspacoId: espacoItemId,
      tipo,
      recursoId: input.recursoId,
      valorHora: input.valorHora,
      quantidade: input.quantidade,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
      valorTotal: input.valorTotal,
      descontoPercentual: input.descontoPercentual,
      valorComDesconto: input.valorComDesconto,
    });
  }

  async updateEspacoResource(actor: SessionUser, gravacaoId: string, _espacoItemId: string, resourceItemId: string, tipo: z.infer<typeof gravacaoEspacoResourceTypeSchema>, input: z.infer<typeof updateGravacaoEspacoResourceSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    return this.repository.updateEspacoResource({
      id: resourceItemId,
      quantidade: input.quantidade,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
      valorTotal: input.valorTotal,
      descontoPercentual: input.descontoPercentual,
      valorComDesconto: input.valorComDesconto,
    }, tipo);
  }

  async removeEspacoResource(actor: SessionUser, gravacaoId: string, _espacoItemId: string, resourceItemId: string, tipo: z.infer<typeof gravacaoEspacoResourceTypeSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    await this.repository.removeEspacoResource(resourceItemId, tipo);
  }

  async getCustos(actor: SessionUser, gravacaoId: string) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    return this.repository.getCustos(gravacao.tenantId, gravacaoId);
  }

  async listEspacoRecursosSummary(actor: SessionUser, gravacaoId: string) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    return this.repository.listEspacoRecursosSummary(gravacao.tenantId, gravacaoId);
  }

  async listDespesas(actor: SessionUser, gravacaoId: string) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    const items = await this.repository.listDespesas(gravacao.tenantId, gravacaoId);
    return {
      items: items.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        numeroDocumento: item.numeroDocumento || '',
        descricao: item.descricao || '',
        status: item.status || '',
        tipoDocumento: item.tipoDocumento || '',
        categoria: item.categoria || '',
        dataVencimento: item.dataVencimento || '',
        valor: item.valor ?? 0,
        fornecedorId: item.fornecedorId || '',
        fornecedorNome: item.fornecedorNome || '',
        formaPagamento: item.formaPagamento || '',
      })),
    };
  }

  async addDespesa(actor: SessionUser, gravacaoId: string, input: z.infer<typeof saveGravacaoDespesaSchema>) {
    const gravacao = await this.repository.findById(gravacaoId);
    if (!gravacao) throw new Error('Gravacao nao encontrada');
    ensureSameTenant(actor, gravacao.tenantId);
    const item = await this.repository.addDespesa({
      tenantId: gravacao.tenantId,
      gravacaoId,
      titulo: input.titulo,
      numeroDocumento: input.numeroDocumento,
      descricao: input.descricao,
      status: input.status,
      tipoDocumento: input.tipoDocumento,
      categoria: input.categoria,
      dataVencimento: input.dataVencimento,
      valor: input.valor,
      fornecedorId: input.fornecedorId,
      formaPagamento: input.formaPagamento,
    });

    if (this.contasPagarRepository) {
      await this.contasPagarRepository.saveLinkedToGravacaoDespesa({
        gravacaoDespesaId: item.id,
        tenantId: gravacao.tenantId,
        createdBy: actor.id,
        titulo: item.titulo,
        numeroDocumento: item.numeroDocumento,
        descricao: item.descricao,
        dataVencimento: item.dataVencimento,
        valor: item.valor,
        fornecedorId: item.fornecedorId,
        statusTitulo: item.status,
        categoriaTitulo: item.categoria,
        tipoDocumentoTitulo: item.tipoDocumento,
        formaPagamentoTitulo: item.formaPagamento,
      }).catch(() => {});
    }

    return {
      id: item.id,
      titulo: item.titulo,
      numeroDocumento: item.numeroDocumento || '',
      descricao: item.descricao || '',
      status: item.status || '',
      tipoDocumento: item.tipoDocumento || '',
      categoria: item.categoria || '',
      dataVencimento: item.dataVencimento || '',
      valor: item.valor ?? 0,
      fornecedorId: item.fornecedorId || '',
      fornecedorNome: item.fornecedorNome || '',
      formaPagamento: item.formaPagamento || '',
    };
  }

  async updateDespesa(actor: SessionUser, gravacaoId: string, itemId: string, input: z.infer<typeof saveGravacaoDespesaSchema>) {
    const existing = await this.repository.findDespesaById(itemId);
    if (!existing || existing.gravacaoId !== gravacaoId) throw new Error('Despesa da gravacao nao encontrada');
    ensureSameTenant(actor, existing.tenantId);
    const item = await this.repository.updateDespesa({
      id: itemId,
      titulo: input.titulo,
      numeroDocumento: input.numeroDocumento,
      descricao: input.descricao,
      status: input.status,
      tipoDocumento: input.tipoDocumento,
      categoria: input.categoria,
      dataVencimento: input.dataVencimento,
      valor: input.valor,
      fornecedorId: input.fornecedorId,
      formaPagamento: input.formaPagamento,
    });
    if (!item) throw new Error('Despesa da gravacao nao encontrada');

    if (this.contasPagarRepository) {
      await this.contasPagarRepository.updateLinkedToGravacaoDespesa({
        gravacaoDespesaId: itemId,
        tenantId: existing.tenantId,
        createdBy: actor.id,
        titulo: item.titulo,
        numeroDocumento: item.numeroDocumento,
        descricao: item.descricao,
        dataVencimento: item.dataVencimento,
        valor: item.valor,
        fornecedorId: item.fornecedorId,
        statusTitulo: item.status,
        categoriaTitulo: item.categoria,
        tipoDocumentoTitulo: item.tipoDocumento,
        formaPagamentoTitulo: item.formaPagamento,
      }).catch(() => {});
    }

    return {
      id: item.id,
      titulo: item.titulo,
      numeroDocumento: item.numeroDocumento || '',
      descricao: item.descricao || '',
      status: item.status || '',
      tipoDocumento: item.tipoDocumento || '',
      categoria: item.categoria || '',
      dataVencimento: item.dataVencimento || '',
      valor: item.valor ?? 0,
      fornecedorId: item.fornecedorId || '',
      fornecedorNome: item.fornecedorNome || '',
      formaPagamento: item.formaPagamento || '',
    };
  }

  async removeDespesa(actor: SessionUser, gravacaoId: string, itemId: string) {
    const item = await this.repository.findDespesaById(itemId);
    if (!item || item.gravacaoId !== gravacaoId) throw new Error('Despesa da gravacao nao encontrada');
    ensureSameTenant(actor, item.tenantId);
    await this.repository.removeDespesa(itemId);
    if (this.contasPagarRepository) {
      await this.contasPagarRepository.deleteByGravacaoDespesaId(item.tenantId, itemId).catch(() => {});
    }
  }

  private mapEspaco(item: import('./gravacoes.repository.js').GravacaoEspacoRecord) {
    return {
      id: item.id,
      espacoId: item.espacoId || '',
      espacoNome: item.espacoNome,
      descricao: item.descricao || '',
      horaInicio: item.horaInicio || null,
      horaFim: item.horaFim || null,
    };
  }
}
