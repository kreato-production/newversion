import type { SessionUser } from '../auth/auth.types.js';
import { describe, expect, it } from 'vitest';
import type { ProgramasRepository, ProgramaRecord, SaveProgramaInput } from './programas.repository.js';
import { ProgramasService } from './programas.service.js';

class InMemoryProgramasRepository implements ProgramasRepository {
  items = new Map<string, ProgramaRecord>();

  async listByTenant(tenantId: string) {
    const data = [...this.items.values()].filter((item) => item.tenantId === tenantId);
    return { data, total: data.length };
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async save(input: SaveProgramaInput) {
    const item: ProgramaRecord = {
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      codigoExterno: input.codigoExterno ?? null,
      nome: input.nome,
      descricao: input.descricao ?? null,
      unidadeNegocioId: input.unidadeNegocioId ?? null,
      unidadeNegocioNome: input.unidadeNegocioId ? 'Unidade A' : null,
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

describe('ProgramasService', () => {
  it('lista apenas programas do tenant do ator', async () => {
    const repository = new InMemoryProgramasRepository();
    await repository.save({ tenantId: 'tenant-1', nome: 'Programa A' });
    await repository.save({ tenantId: 'tenant-2', nome: 'Programa B' });
    const service = new ProgramasService(repository);

    const result = await service.list(actor);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].nome).toBe('Programa A');
  });

  it('salva programa resolvendo tenant pelo ator', async () => {
    const repository = new InMemoryProgramasRepository();
    const service = new ProgramasService(repository);

    const result = await service.save(actor, { nome: 'Programa A', unidadeNegocioId: 'un-1' });

    expect(result.nome).toBe('Programa A');
    expect(result.unidadeNegocio).toBe('Unidade A');
  });
});

