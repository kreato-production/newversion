import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../auth/auth.types.js';
import type {
  DepartamentoFuncaoRecord,
  DepartamentoRecord,
  DepartamentosRepository,
  FuncaoOptionRecord,
  SaveDepartamentoInput,
} from './departamentos.repository.js';
import { DepartamentosService } from './departamentos.service.js';

class InMemoryDepartamentosRepository implements DepartamentosRepository {
  items = new Map<string, DepartamentoRecord>();

  async listByTenant(tenantId: string) {
    const data = [...this.items.values()].filter((item) => item.tenantId === tenantId);
    return { data, total: data.length };
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async save(input: SaveDepartamentoInput) {
    const item: DepartamentoRecord = {
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      codigoExterno: input.codigoExterno ?? null,
      nome: input.nome,
      descricao: input.descricao ?? null,
      createdAt: new Date('2026-04-09T11:20:00.000Z'),
      createdBy: input.createdBy ?? null,
    };
    this.items.set(item.id, item);
    return item;
  }

  async remove(id: string) {
    this.items.delete(id);
  }

  async listFuncoes(): Promise<FuncaoOptionRecord[]> {
    return [];
  }

  async listFuncoesAssociadas(): Promise<DepartamentoFuncaoRecord[]> {
    return [];
  }

  async addFuncao(): Promise<DepartamentoFuncaoRecord> {
    return {
      id: 'assoc-1',
      funcaoId: 'funcao-1',
      createdAt: new Date('2026-04-09T11:20:00.000Z'),
    };
  }

  async removeFuncao(): Promise<void> {
    return undefined;
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
  enabledModules: ['Dashboard', 'Recursos'],
  permissions: [],
};

describe('DepartamentosService', () => {
  it('permite criar departamento sem id', async () => {
    const repository = new InMemoryDepartamentosRepository();
    const service = new DepartamentosService(repository);

    const saved = await service.save(actor, {
      nome: 'Departamento Teste',
      codigoExterno: 'DEP-001',
      descricao: 'Descricao teste',
    });

    expect(saved.id).toBeTruthy();
    expect(saved.nome).toBe('Departamento Teste');
  });

  it('retorna 404 ao editar departamento inexistente', async () => {
    const repository = new InMemoryDepartamentosRepository();
    const service = new DepartamentosService(repository);

    await expect(
      service.save(actor, {
        id: 'dep-inexistente',
        nome: 'Departamento Teste',
      }),
    ).rejects.toMatchObject({
      message: 'Departamento nao encontrado',
      statusCode: 404,
    });
  });
});
