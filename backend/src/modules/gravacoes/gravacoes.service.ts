import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { GravacoesRepository } from './gravacoes.repository.js';

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

export type SaveGravacaoDto = z.infer<typeof saveGravacaoSchema>;

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '';
}

export class GravacoesService {
  constructor(private readonly repository: GravacoesRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

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
        dataPrevista: formatDate(item.dataPrevista),
        dataCadastro: item.createdAt.toISOString(),
        conteudoId: item.conteudoId || '',
        orcamento: item.orcamento,
        programaId: item.programaId || '',
        programa: item.programaNome || '',
      })),
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
}
