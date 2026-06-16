import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { EventosRepository, EventoExpositor, AgendaDia, OrcamentoEventoItem } from './gestao-eventos.repository.js';
import type { ContasPagarRepository } from '../contas-pagar/contas-pagar.repository.js';

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optionalString = z.preprocess(emptyToNull, z.string().optional().nullable());

const expositorItemSchema = z.object({
  id: z.string(),
  nome: z.string(),
  logo: z.string().nullable().optional(),
  tipoExpositorNome: z.string().optional().default(''),
});

const agendaAtividadeSchema = z.object({
  id: z.string(),
  horarioInicio: z.string().optional().default(''),
  horarioFim: z.string().optional().default(''),
  titulo: z.string(),
  descricao: z.string().optional().default(''),
  cor: z.string().optional().default('#3b82f6'),
  executada: z.boolean().optional().default(false),
});

const agendaDiaSchema = z.object({
  id: z.string(),
  data: z.string(),
  atividades: z.array(agendaAtividadeSchema).optional().default([]),
});

const orcamentoItemSchema = z.object({
  id: z.string(),
  fornecedorId: z.string(),
  fornecedorNome: z.string().optional().default(''),
  servicoIds: z.array(z.string()).optional().default([]),
  servicoNomes: z.array(z.string()).optional().default([]),
  centroLucroId: optionalString,
  centroLucroNome: optionalString,
  valor: z.number().nonnegative().optional().default(0),
  moeda: z.string().optional().default('BRL'),
  dataPagamento: optionalString,
});

export const saveEventoSchema = z.object({
  id: z.string().optional(),
  codigoExterno: optionalString,
  nome: z.string().min(1),
  tipoEventoId: optionalString,
  unidadeNegocioId: optionalString,
  descricao: optionalString,
  tags: z.array(z.string()).optional().default([]),
  inicioEvento: optionalString,
  fimEvento: optionalString,
  local: optionalString,
  latitude: optionalString,
  longitude: optionalString,
  publicoEstimado: optionalString,
  expositores: z.array(expositorItemSchema).optional().default([]),
  layoutArquivo: optionalString,
  layoutNome: optionalString,
  layoutTipo: optionalString,
  agenda: z.array(agendaDiaSchema).optional().default([]),
  orcamentoItens: z.array(orcamentoItemSchema).optional().default([]),
});

export type SaveEventoDto = z.infer<typeof saveEventoSchema>;

export class EventosService {
  constructor(
    private readonly repository: EventosRepository,
    private readonly contasPagarRepository?: ContasPagarRepository,
  ) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);
    return { total, data: data.map(mapEvento) };
  }

  async save(actor: SessionUser, input: SaveEventoDto) {
    const tenantId = resolveTenantId(actor, actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id, tenantId);
      if (existing) ensureSameTenant(actor, existing.tenantId);
    }

    const record = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      tipoEventoId: input.tipoEventoId,
      unidadeNegocioId: input.unidadeNegocioId,
      descricao: input.descricao,
      tags: input.tags,
      inicioEvento: input.inicioEvento,
      fimEvento: input.fimEvento,
      local: input.local,
      latitude: input.latitude,
      longitude: input.longitude,
      publicoEstimado: input.publicoEstimado,
      expositores: input.expositores as EventoExpositor[],
      layoutArquivo: input.layoutArquivo,
      layoutNome: input.layoutNome,
      layoutTipo: input.layoutTipo,
      agenda: input.agenda as AgendaDia[],
      orcamentoItens: input.orcamentoItens as OrcamentoEventoItem[],
      createdBy: actor.nome,
    });

    if (this.contasPagarRepository) {
      await this.contasPagarRepository.syncFromEventoOrcamento(
        tenantId,
        record.id,
        record.nome,
        (input.orcamentoItens as OrcamentoEventoItem[]).map((i) => ({
          id: i.id,
          fornecedorId: i.fornecedorId,
          fornecedorNome: i.fornecedorNome ?? '',
          servicoNomes: i.servicoNomes ?? [],
          centroLucroNome: i.centroLucroNome ?? null,
          valor: i.valor ?? 0,
          moeda: i.moeda ?? 'BRL',
          dataPagamento: i.dataPagamento ?? null,
        })),
        actor.nome,
      );
    }

    return mapEvento(record);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const existing = await this.repository.findById(id, tenantId);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    if (this.contasPagarRepository) {
      await this.contasPagarRepository.deleteByEventoId(tenantId, id);
    }
    await this.repository.remove(id, tenantId);
  }
}

function mapEvento(item: Awaited<ReturnType<EventosRepository['findById']>> extends infer T ? Exclude<T, null> : never) {
  return {
    id: item.id,
    codigoExterno: item.codigoExterno ?? '',
    nome: item.nome,
    tipoEventoId: item.tipoEventoId ?? null,
    unidadeNegocioId: item.unidadeNegocioId ?? null,
    descricao: item.descricao ?? '',
    tags: item.tags ?? [],
    inicioEvento: item.inicioEvento?.toISOString() ?? null,
    fimEvento: item.fimEvento?.toISOString() ?? null,
    local: item.local ?? '',
    latitude: item.latitude ?? '',
    longitude: item.longitude ?? '',
    publicoEstimado: item.publicoEstimado ?? '',
    expositores: item.expositores ?? [],
    layoutArquivo: item.layoutArquivo ?? null,
    layoutNome: item.layoutNome ?? null,
    layoutTipo: item.layoutTipo ?? null,
    agenda: item.agenda ?? [],
    orcamentoItens: item.orcamentoItens ?? [],
    createdAt: item.createdAt?.toISOString() ?? '',
    createdBy: item.createdBy ?? '',
  };
}
