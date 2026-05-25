import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { TemplatesRepository } from './templates.repository.js';

const alocacaoSchema = z.object({
  recursoId: z.string().min(1),
  quantidade: z.coerce.number().int().min(1).default(1),
  de: z.string().default(''),
  ate: z.string().default(''),
});

const atividadeSchema = z.object({
  nome: z.string().min(1),
  horaInicio: z.string().min(1),
  horaFim: z.string().min(1),
  duracaoMinutos: z.coerce.number().int().min(0).default(0),
  recursosTecnicos: z.array(alocacaoSchema).default([]),
  equipamentos: z.array(alocacaoSchema).default([]),
  espacos: z.array(alocacaoSchema).default([]),
});

const etapaSchema = z.object({
  nome: z.string().min(1),
  cor: z.string().min(1).default('#6366f1'),
  atividades: z.array(atividadeSchema).default([]),
});

export const saveTemplateSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  etapas: z.array(etapaSchema).default([]),
});

export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;

export class TemplatesService {
  constructor(private readonly repository: TemplatesRepository) {}

  async list(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listByTenant(tenantId);
  }

  async findById(actor: SessionUser, id: string) {
    const item = await this.repository.findById(id);
    if (!item) return null;
    ensureSameTenant(actor, item.tenantId);
    return item;
  }

  async save(actor: SessionUser, input: SaveTemplateInput) {
    const tenantId = resolveTenantId(actor, actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (existing) ensureSameTenant(actor, existing.tenantId);
    }

    return this.repository.save({
      id: input.id,
      tenantId,
      nome: input.nome,
      descricao: input.descricao ?? null,
      etapas: input.etapas.map((e, ei) => ({
        nome: e.nome,
        cor: e.cor,
        ordem: ei,
        atividades: e.atividades.map((a, ai) => ({
          nome: a.nome,
          horaInicio: a.horaInicio,
          horaFim: a.horaFim,
          duracaoMinutos: a.duracaoMinutos,
          recursosTecnicos: a.recursosTecnicos,
          equipamentos: a.equipamentos,
          espacos: a.espacos,
          ordem: ai,
        })),
      })),
    });
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }
}
