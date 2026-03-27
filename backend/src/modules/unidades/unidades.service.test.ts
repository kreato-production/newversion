import type { SessionUser } from '../auth/auth.types.js';
import { describe, expect, it } from 'vitest';
import { UnidadesService } from './unidades.service.js';
import type { SaveUnidadeInput, UnidadeRecord, UnidadesRepository } from './unidades.repository.js';

class InMemoryUnidadesRepository implements UnidadesRepository {
  items = new Map<string, UnidadeRecord>();

  async listByTenant(tenantId: string) {
    const data = [...this.items.values()].filter((item) => item.tenantId === tenantId);
    return { data, total: data.length };
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async save(input: SaveUnidadeInput) {
    const item: UnidadeRecord = {
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      codigoExterno: input.codigoExterno ?? null,
      nome: input.nome,
      descricao: input.descricao ?? null,
      imagemUrl: input.imagemUrl ?? null,
      moeda: input.moeda ?? 'BRL',
      createdByName: input.createdByName ?? null,
      createdAt: new Date('2026-03-25T12:00:00.000Z'),
    };
    this.items.set(item.id, item);
    return item;
  }

  async remove(id: string) {
    this.items.delete(id);
  }
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

describe('UnidadesService', () => {
  it('preenche usuarioCadastro com o ator autenticado', async () => {
    const repository = new InMemoryUnidadesRepository();
    const service = new UnidadesService(repository);

    const result = await service.save(actor, { nome: 'Lisboa', codigoExterno: 'LIS', moeda: 'EUR' });

    expect(result.usuarioCadastro).toBe('Admin');
    expect(result.moeda).toBe('EUR');
  });

  it('lista apenas unidades do tenant do ator', async () => {
    const repository = new InMemoryUnidadesRepository();
    await repository.save({ tenantId: 'tenant-1', nome: 'Lisboa' });
    await repository.save({ tenantId: 'tenant-2', nome: 'Porto' });
    const service = new UnidadesService(repository);

    const result = await service.list(actor);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].nome).toBe('Lisboa');
  });
});

