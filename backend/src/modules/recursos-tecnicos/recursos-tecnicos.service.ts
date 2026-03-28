import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { RecursosTecnicosRepository } from './recursos-tecnicos.repository.js';

const optionalUuid = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().uuid().nullable().optional(),
);

export const saveRecursoTecnicoSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  funcaoOperadorId: optionalUuid,
});

export type SaveRecursoTecnicoDto = z.infer<typeof saveRecursoTecnicoSchema>;

export class RecursosTecnicosService {
  constructor(private readonly repository: RecursosTecnicosRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        nome: item.nome,
        funcaoOperador: item.funcaoOperadorNome || '',
        funcaoOperadorId: item.funcaoOperadorId || '',
        dataCadastro: item.createdAt?.toISOString() || '',
        usuarioCadastro: item.createdByNome || '',
      })),
    };
  }

  async listOptions(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const funcoes = await this.repository.listFuncoesOperador(tenantId);

    return {
      funcoes: funcoes.map((item) => ({
        id: item.id,
        nome: item.nome,
      })),
    };
  }

  async save(actor: SessionUser, input: SaveRecursoTecnicoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Recurso tecnico nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      funcaoOperadorId: input.funcaoOperadorId,
      createdBy: actor.id,
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      funcaoOperador: item.funcaoOperadorNome || '',
      funcaoOperadorId: item.funcaoOperadorId || '',
      dataCadastro: item.createdAt?.toISOString() || '',
      usuarioCadastro: item.createdByNome || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Recurso tecnico nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }
}
