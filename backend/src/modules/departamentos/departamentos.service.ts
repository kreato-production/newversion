import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { AccessError, ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { DepartamentosRepository } from './departamentos.repository.js';

export const saveDepartamentoSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
});

export const saveDepartamentoFuncaoSchema = z.object({
  funcaoId: z.string().min(1),
});

export type SaveDepartamentoDto = z.infer<typeof saveDepartamentoSchema>;

export class DepartamentosService {
  constructor(private readonly repository: DepartamentosRepository) {}

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
        dataCadastro: item.createdAt.toISOString(),
        usuarioCadastro: item.createdBy || '',
      })),
    };
  }

  async save(actor: SessionUser, input: SaveDepartamentoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new AccessError('Departamento nao encontrado', 404);
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      descricao: input.descricao,
      createdBy: actor.nome,
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      descricao: item.descricao || '',
      dataCadastro: item.createdAt.toISOString(),
      usuarioCadastro: item.createdBy || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AccessError('Departamento nao encontrado', 404);
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async listFuncoes(actor: SessionUser, departamentoId: string) {
    const existing = await this.repository.findById(departamentoId);
    if (!existing) {
      throw new AccessError('Departamento nao encontrado', 404);
    }

    ensureSameTenant(actor, existing.tenantId);

    const [associadas, cadastradas] = await Promise.all([
      this.repository.listFuncoesAssociadas(departamentoId),
      this.repository.listFuncoes(existing.tenantId),
    ]);

    return {
      associadas: associadas.map((item) => ({
        id: item.id,
        funcaoId: item.funcaoId,
        dataAssociacao: item.createdAt.toISOString(),
      })),
      cadastradas: cadastradas.map((item) => ({
        id: item.id,
        nome: item.nome,
        codigoExterno: item.codigoExterno || '',
        descricao: item.descricao || '',
      })),
    };
  }

  async addFuncao(actor: SessionUser, departamentoId: string, funcaoId: string) {
    const existing = await this.repository.findById(departamentoId);
    if (!existing) {
      throw new AccessError('Departamento nao encontrado', 404);
    }

    ensureSameTenant(actor, existing.tenantId);

    const item = await this.repository.addFuncao({
      tenantId: existing.tenantId,
      departamentoId,
      funcaoId,
    });

    return {
      id: item.id,
      funcaoId: item.funcaoId,
      dataAssociacao: item.createdAt.toISOString(),
    };
  }

  async removeFuncao(actor: SessionUser, departamentoId: string, associacaoId: string) {
    const existing = await this.repository.findById(departamentoId);
    if (!existing) {
      throw new AccessError('Departamento nao encontrado', 404);
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.removeFuncao(associacaoId);
  }
}
