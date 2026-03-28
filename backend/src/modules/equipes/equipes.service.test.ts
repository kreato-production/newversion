import type { SessionUser } from '../auth/auth.types.js';
import { describe, expect, it } from 'vitest';
import { EquipesService } from './equipes.service.js';
import type { EquipeRecord, EquipesRepository, SaveEquipeInput } from './equipes.repository.js';

class InMemoryEquipesRepository implements EquipesRepository {
  items = new Map<string, EquipeRecord>();

  async listByTenant(tenantId: string) {
    const data = [...this.items.values()].filter((item) => item.tenantId === tenantId);
    return { data, total: data.length };
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async save(input: SaveEquipeInput) {
    const item: EquipeRecord = {
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      codigo: input.codigo,
      descricao: input.descricao,
      createdAt: new Date('2026-03-25T12:00:00.000Z'),
    };
    this.items.set(item.id, item);
    return item;
  }

  async remove(id: string) {
    this.items.delete(id);
  }

  async listUsuariosAtivos() { return []; }
  async listMembros() { return []; }
  async addMembro() {
    return { id: 'member-1', recursoHumanoId: 'user-1', dataAssociacao: new Date('2026-03-25T12:00:00.000Z') };
  }
  async removeMembro() {}
}

const actor: SessionUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Admin',
  email: 'admin@kreato.app',
  usuario: 'admin',
  role: 'TENANT_ADMIN',
  perfil: 'Administrador Tenant',
  tipoAcesso: 'Operacional',
  unidadeIds: [],
  enabledModules: ['Dashboard', 'Produ��o', 'Recursos', 'Administra��o'],
  permissions: [],
};

describe('EquipesService', () => {
  it('lista equipes apenas do tenant do ator', async () => {
    const repository = new InMemoryEquipesRepository();
    await repository.save({ tenantId: 'tenant-1', codigo: 'EQ-1', descricao: 'Equipe 1' });
    await repository.save({ tenantId: 'tenant-2', codigo: 'EQ-2', descricao: 'Equipe 2' });
    const service = new EquipesService(repository);

    const result = await service.list(actor);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].codigo).toBe('EQ-1');
  });

  it('impede remover equipe de outro tenant', async () => {
    const repository = new InMemoryEquipesRepository();
    const saved = await repository.save({ tenantId: 'tenant-2', codigo: 'EQ-2', descricao: 'Equipe 2' });
    const service = new EquipesService(repository);

    await expect(service.remove(actor, saved.id)).rejects.toThrow('Operacao fora do tenant permitido');
  });
});
