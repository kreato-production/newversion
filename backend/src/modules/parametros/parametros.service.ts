import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { ParametrosRepository } from './parametros.repository.js';

export const saveParametroSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
});

export type SaveParametroDto = z.infer<typeof saveParametroSchema>;

export class ParametrosService {
  constructor(private readonly repository: ParametrosRepository) {}

  async list(actor: SessionUser, storageKey: string, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(storageKey, tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigo_externo: item.codigoExterno || '',
        nome: item.nome,
        descricao: item.descricao || '',
        created_at: item.createdAt?.toISOString() ?? '',
        created_by: item.createdBy || '',
      })),
    };
  }

  async save(actor: SessionUser, storageKey: string, input: SaveParametroDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(storageKey, input.id);
      if (!existing) {
        throw new Error('Parametro nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save(storageKey, {
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      descricao: input.descricao,
      createdBy: actor.id,
    });

    return {
      id: item.id,
      codigo_externo: item.codigoExterno || '',
      nome: item.nome,
      descricao: item.descricao || '',
      created_at: item.createdAt?.toISOString() ?? '',
      created_by: item.createdBy || '',
    };
  }

  async remove(actor: SessionUser, storageKey: string, id: string) {
    const existing = await this.repository.findById(storageKey, id);
    if (!existing) {
      throw new Error('Parametro nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(storageKey, id);
  }
}
