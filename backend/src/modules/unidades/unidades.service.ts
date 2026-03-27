import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { UnidadesRepository } from './unidades.repository.js';

export const saveUnidadeSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  imagem: z.string().optional().nullable(),
  moeda: z.string().min(3).max(3).optional(),
});

export type SaveUnidadeDto = z.infer<typeof saveUnidadeSchema>;

export class UnidadesService {
  constructor(private readonly repository: UnidadesRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);
    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        nome: item.nome,
        descricao: item.descricao || '',
        imagem: item.imagemUrl || '',
        moeda: item.moeda,
        dataCadastro: item.createdAt.toISOString(),
        usuarioCadastro: item.createdByName || '',
      })),
    };
  }

  async save(actor: SessionUser, input: SaveUnidadeDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Unidade nao encontrada');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      descricao: input.descricao,
      imagemUrl: input.imagem,
      moeda: input.moeda,
      createdByName: actor.nome,
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      descricao: item.descricao || '',
      imagem: item.imagemUrl || '',
      moeda: item.moeda,
      dataCadastro: item.createdAt.toISOString(),
      usuarioCadastro: item.createdByName || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Unidade nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }
}
