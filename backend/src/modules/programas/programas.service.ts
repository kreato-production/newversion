import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { ProgramasRepository } from './programas.repository.js';

export const saveProgramaSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  unidadeNegocioId: z.string().uuid().optional().nullable(),
});

export type SaveProgramaDto = z.infer<typeof saveProgramaSchema>;

export class ProgramasService {
  constructor(private readonly repository: ProgramasRepository) {}

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
        unidadeNegocioId: item.unidadeNegocioId || '',
        unidadeNegocio: item.unidadeNegocioNome || '',
        dataCadastro: item.createdAt.toISOString(),
      })),
    };
  }

  async save(actor: SessionUser, input: SaveProgramaDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Programa nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      descricao: input.descricao,
      unidadeNegocioId: input.unidadeNegocioId,
      createdById: actor.id,
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      descricao: item.descricao || '',
      unidadeNegocioId: item.unidadeNegocioId || '',
      unidadeNegocio: item.unidadeNegocioNome || '',
      dataCadastro: item.createdAt.toISOString(),
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Programa nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }
}
