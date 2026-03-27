import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { EquipesRepository } from './equipes.repository.js';

export const saveEquipeSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  codigo: z.string().min(1),
  descricao: z.string().min(1),
});

export type SaveEquipeDto = z.infer<typeof saveEquipeSchema>;

export class EquipesService {
  constructor(private readonly repository: EquipesRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);
    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        descricao: item.descricao,
        membrosCount: 0,
        dataCadastro: item.createdAt.toISOString(),
      })),
    };
  }

  async save(actor: SessionUser, input: SaveEquipeDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Equipe nao encontrada');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigo: input.codigo,
      descricao: input.descricao,
    });

    return {
      id: item.id,
      codigo: item.codigo,
      descricao: item.descricao,
      membrosCount: 0,
      dataCadastro: item.createdAt.toISOString(),
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Equipe nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }
}
