import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { GravacoesRepository } from './gravacoes.repository.js';

export const saveGravacaoSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  codigo: z.string().min(1),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  unidadeNegocioId: z.string().uuid().optional().nullable(),
  centroLucro: z.string().optional().nullable(),
  classificacao: z.string().optional().nullable(),
  tipoConteudo: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  dataPrevista: z.string().optional().nullable(),
  conteudoId: z.string().optional().nullable(),
  orcamento: z.number().optional(),
  programaId: z.string().uuid().optional().nullable(),
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
}
