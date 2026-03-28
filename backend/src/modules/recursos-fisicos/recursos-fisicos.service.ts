import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { RecursosFisicosRepository } from './recursos-fisicos.repository.js';

const estoqueItemSchema = z.object({
  id: z.string().optional(),
  numerador: z.coerce.number().int().min(1),
  codigo: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  imagemUrl: z.string().optional().nullable(),
});

const faixaDisponibilidadeSchema = z.object({
  id: z.string().optional(),
  dataInicio: z.string().min(1),
  dataFim: z.string().min(1),
  horaInicio: z.string().min(1),
  horaFim: z.string().min(1),
  diasSemana: z.array(z.coerce.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
});

export const saveRecursoFisicoSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  custoHora: z.coerce.number().min(0).default(0),
  faixasDisponibilidade: z.array(faixaDisponibilidadeSchema).default([]),
  estoqueItens: z.array(estoqueItemSchema).default([]),
});

export type SaveRecursoFisicoDto = z.infer<typeof saveRecursoFisicoSchema>;

export class RecursosFisicosService {
  constructor(private readonly repository: RecursosFisicosRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        nome: item.nome,
        custoHora: item.custoHora,
        faixasDisponibilidade: item.faixasDisponibilidade,
        estoqueItens: item.estoqueItens.map((stockItem) => ({
          id: stockItem.id,
          numerador: stockItem.numerador,
          codigo: stockItem.codigo || '',
          nome: stockItem.nome,
          descricao: stockItem.descricao || '',
          imagemUrl: stockItem.imagemUrl || '',
        })),
        estoqueCount: item.estoqueItens.length,
        dataCadastro: item.createdAt?.toISOString() || '',
        usuarioCadastro: item.createdByNome || '',
        usuarioCadastroId: item.createdBy || '',
      })),
    };
  }

  async save(actor: SessionUser, input: SaveRecursoFisicoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Recurso fisico nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      custoHora: input.custoHora,
      createdBy: actor.id,
      faixasDisponibilidade: input.faixasDisponibilidade.map((faixa) => ({
        id: faixa.id || '',
        dataInicio: faixa.dataInicio,
        dataFim: faixa.dataFim,
        horaInicio: faixa.horaInicio,
        horaFim: faixa.horaFim,
        diasSemana: faixa.diasSemana,
      })),
      estoqueItens: input.estoqueItens.map((stockItem) => ({
        id: stockItem.id || '',
        numerador: stockItem.numerador,
        codigo: stockItem.codigo || null,
        nome: stockItem.nome,
        descricao: stockItem.descricao || null,
        imagemUrl: stockItem.imagemUrl || null,
      })),
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      custoHora: item.custoHora,
      faixasDisponibilidade: item.faixasDisponibilidade,
      estoqueItens: item.estoqueItens.map((stockItem) => ({
        id: stockItem.id,
        numerador: stockItem.numerador,
        codigo: stockItem.codigo || '',
        nome: stockItem.nome,
        descricao: stockItem.descricao || '',
        imagemUrl: stockItem.imagemUrl || '',
      })),
      estoqueCount: item.estoqueItens.length,
      dataCadastro: item.createdAt?.toISOString() || '',
      usuarioCadastro: item.createdByNome || '',
      usuarioCadastroId: item.createdBy || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Recurso fisico nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async listOcupacoes(actor: SessionUser, dataInicio: string, dataFim: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listOcupacoes(tenantId, dataInicio, dataFim);
  }
}
