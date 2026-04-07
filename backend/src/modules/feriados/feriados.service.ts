import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { FeriadosRepository } from './feriados.repository.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const saveFeriadoSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  data: z.string().regex(datePattern, 'Data invalida'),
  feriado: z.string().trim().min(1),
  observacoes: z.string().optional().nullable(),
});

export type SaveFeriadoDto = z.infer<typeof saveFeriadoSchema>;

export class FeriadosService {
  constructor(private readonly repository: FeriadosRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        data: item.data,
        feriado: item.feriado,
        observacoes: item.observacoes || '',
        dataCadastro: item.createdAt.toISOString(),
        usuarioCadastro: item.createdBy || '',
      })),
    };
  }

  async save(actor: SessionUser, input: SaveFeriadoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Feriado nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const duplicate = await this.repository.findByDate(tenantId, input.data);
    if (duplicate && duplicate.id !== input.id) {
      throw new Error('Ja existe um feriado cadastrado para esta data');
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      data: input.data,
      feriado: input.feriado.trim(),
      observacoes: input.observacoes?.trim() || null,
      createdBy: actor.nome,
    });

    return {
      id: item.id,
      data: item.data,
      feriado: item.feriado,
      observacoes: item.observacoes || '',
      dataCadastro: item.createdAt.toISOString(),
      usuarioCadastro: item.createdBy || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Feriado nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }
}
