import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { ProgramaRecord, ProgramasRepository } from './programas.repository.js';

export const saveProgramaSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  cor: z.string().optional().nullable(),
  unidadeNegocioId: z.string().uuid().optional().nullable(),
});

export type SaveProgramaDto = z.infer<typeof saveProgramaSchema>;

function toProgramaDto(item: ProgramaRecord) {
  return {
    id: item.id,
    codigoExterno: item.codigoExterno || '',
    nome: item.nome,
    descricao: item.descricao || '',
    cor: item.cor || null,
    unidadeNegocioId: item.unidadeNegocioId || '',
    unidadeNegocio: item.unidadeNegocioNome || '',
    dataCadastro: item.createdAt.toISOString(),
  };
}

export class ProgramasService {
  constructor(private readonly repository: ProgramasRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);
    return {
      total,
      data: data.map(toProgramaDto),
    };
  }

  async getById(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      return null;
    }

    ensureSameTenant(actor, existing.tenantId);
    return toProgramaDto(existing);
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
      cor: input.cor,
      unidadeNegocioId: input.unidadeNegocioId,
      createdById: actor.id,
    });

    return toProgramaDto(item);
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
