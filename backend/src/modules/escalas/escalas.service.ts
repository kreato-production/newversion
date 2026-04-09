import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { EscalasRepository } from './escalas.repository.js';

export const saveEscalaSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  codigoExterno: z.string().trim().max(10).optional().nullable(),
  titulo: z.string().trim().min(1),
  grupoFuncaoId: z.string().min(1).optional().nullable(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
});

export const saveColaboradoresSchema = z.object({
  colaboradores: z.array(
    z.object({
      colaboradorId: z.string().min(1),
      turnoId: z.string().min(1).optional().nullable(),
      dias: z.record(z.string(), z.string().nullable()),
    }),
  ),
});

export type SaveEscalaDto = z.infer<typeof saveEscalaSchema>;
export type SaveColaboradoresDto = z.infer<typeof saveColaboradoresSchema>;

export class EscalasService {
  constructor(private readonly repository: EscalasRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        numerador: item.numerador,
        codigoExterno: item.codigoExterno ?? '',
        titulo: item.titulo,
        grupoFuncaoId: item.grupoFuncaoId ?? '',
        grupoFuncaoNome: item.grupoFuncaoNome ?? '',
        dataInicio: item.dataInicio,
        dataCadastro: item.createdAt.toISOString(),
        usuarioCadastro: item.createdBy ?? '',
      })),
    };
  }

  async save(actor: SessionUser, input: SaveEscalaDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Escala nao encontrada');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const duplicate = await this.repository.findByTitulo(tenantId, input.titulo.trim());
    if (duplicate && duplicate.id !== input.id) {
      throw new Error('Ja existe uma escala cadastrada com este titulo');
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno?.trim() || null,
      titulo: input.titulo.trim(),
      grupoFuncaoId: input.grupoFuncaoId ?? null,
      dataInicio: input.dataInicio,
      createdBy: actor.nome,
    });

    return {
      id: item.id,
      numerador: item.numerador,
      codigoExterno: item.codigoExterno ?? '',
      titulo: item.titulo,
      grupoFuncaoId: item.grupoFuncaoId ?? '',
      grupoFuncaoNome: item.grupoFuncaoNome ?? '',
      dataInicio: item.dataInicio,
      dataCadastro: item.createdAt.toISOString(),
      usuarioCadastro: item.createdBy ?? '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Escala nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async getColaboradores(actor: SessionUser, escalaId: string) {
    const existing = await this.repository.findById(escalaId);
    if (!existing) {
      throw new Error('Escala nao encontrada');
    }
    ensureSameTenant(actor, existing.tenantId);

    const colaboradores = await this.repository.listColaboradores(escalaId);
    return colaboradores.map((c) => ({
      id: c.id,
      colaboradorId: c.colaboradorId,
      colaboradorNome: c.colaboradorNome,
      colaboradorFuncao: c.colaboradorFuncao ?? '',
      turnoId: c.turnoId ?? '',
      turnoNome: c.turnoNome ?? '',
      turnoSigla: c.turnoSigla ?? '',
      turnoCor: c.turnoCor ?? '',
      dias: c.dias,
    }));
  }

  async saveColaboradores(actor: SessionUser, escalaId: string, input: SaveColaboradoresDto) {
    const existing = await this.repository.findById(escalaId);
    if (!existing) {
      throw new Error('Escala nao encontrada');
    }
    ensureSameTenant(actor, existing.tenantId);

    const colaboradores = await this.repository.saveColaboradores({
      escalaId,
      colaboradores: input.colaboradores.map((c) => ({
        colaboradorId: c.colaboradorId,
        turnoId: c.turnoId ?? null,
        dias: c.dias,
      })),
    });

    return colaboradores.map((c) => ({
      id: c.id,
      colaboradorId: c.colaboradorId,
      colaboradorNome: c.colaboradorNome,
      colaboradorFuncao: c.colaboradorFuncao ?? '',
      turnoId: c.turnoId ?? '',
      turnoNome: c.turnoNome ?? '',
      turnoSigla: c.turnoSigla ?? '',
      turnoCor: c.turnoCor ?? '',
      dias: c.dias,
    }));
  }

  async listFuncoes(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listFuncoes(tenantId);
  }

  async listColaboradoresByFuncao(actor: SessionUser, funcaoId: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listColaboradoresByFuncao(tenantId, funcaoId);
  }
}
