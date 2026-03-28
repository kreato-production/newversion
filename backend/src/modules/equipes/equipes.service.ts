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

export const saveEquipeMembroSchema = z.object({
  targetId: z.string().min(1),
});

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

  private async getEquipe(actor: SessionUser, equipeId: string) {
    const equipe = await this.repository.findById(equipeId);
    if (!equipe) {
      throw new Error('Equipe nao encontrada');
    }

    ensureSameTenant(actor, equipe.tenantId);
    return equipe;
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
    const existing = await this.getEquipe(actor, id);
    await this.repository.remove(id);
  }

  async listMembros(actor: SessionUser, equipeId: string) {
    const equipe = await this.getEquipe(actor, equipeId);
    const [membros, disponiveis] = await Promise.all([
      this.repository.listMembros(equipe.id),
      this.repository.listUsuariosAtivos(equipe.tenantId),
    ]);

    return {
      membros: membros.map((item) => ({
        id: item.id,
        recursoHumanoId: item.recursoHumanoId,
        dataAssociacao: item.dataAssociacao.toISOString(),
      })),
      disponiveis: disponiveis.map((item) => ({
        id: item.id,
        nome: item.nome,
        sobrenome: item.sobrenome,
        funcao_nome: item.funcaoNome,
      })),
    };
  }

  async addMembro(actor: SessionUser, equipeId: string, userId: string) {
    const equipe = await this.getEquipe(actor, equipeId);
    const available = await this.repository.listUsuariosAtivos(equipe.tenantId);
    if (!available.some((item) => item.id === userId)) {
      throw new Error('Usuario nao encontrado para o tenant da equipe');
    }

    const item = await this.repository.addMembro({ tenantId: equipe.tenantId, equipeId: equipe.id, userId });

    return {
      id: item.id,
      recursoHumanoId: item.recursoHumanoId,
      dataAssociacao: item.dataAssociacao.toISOString(),
    };
  }

  async removeMembro(actor: SessionUser, equipeId: string, userId: string) {
    const equipe = await this.getEquipe(actor, equipeId);
    await this.repository.removeMembro(equipe.id, userId);
  }
}
