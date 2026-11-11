import type { SessionUser } from '../auth/auth.types.js';
import { describe, expect, it } from 'vitest';
import { PASSWORD_POLICY_MESSAGE } from '../../lib/security/password-policy.js';
import { UsersService } from './users.service.js';
import type { SaveUserInput, UserRecord, UsersRepository } from './users.repository.js';

class InMemoryUsersRepository implements UsersRepository {
  items = new Map<string, UserRecord & { passwordHash?: string | null }>();
  userUnidades = new Map<string, Set<string>>();
  userProgramas = new Map<string, Set<string>>();
  userEquipes = new Map<string, Set<string>>();

  async listByTenant(tenantId?: string | null) {
    const data = [...this.items.values()]
      .filter((item) => tenantId == null || item.tenantId === tenantId)
      .map(({ passwordHash: _passwordHash, ...item }) => item);
    return { data, total: data.length };
  }

  async findById(id: string) {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  async findByEmail(email: string) {
    const item = [...this.items.values()].find((entry) => entry.email === email);
    return item ? { ...item } : null;
  }

  async findByUsername(usuario: string) {
    const item = [...this.items.values()].find((entry) => entry.usuario === usuario);
    return item ? { ...item } : null;
  }

  async save(input: SaveUserInput) {
    const item = {
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      codigoExterno: input.codigoExterno ?? null,
      nome: input.nome,
      email: input.email,
      usuario: input.usuario,
      fotoUrl: input.fotoUrl ?? null,
      perfil: input.perfil ?? null,
      descricao: input.descricao ?? null,
      status: input.status,
      tipoAcesso: input.tipoAcesso ?? 'Operacional',
      recursoHumanoId: input.recursoHumanoId ?? null,
      role: input.role ?? 'USER',
      createdAt: new Date('2026-03-25T12:00:00.000Z'),
      passwordHash: input.passwordHash ?? null,
    } as UserRecord & { passwordHash?: string | null };

    this.items.set(item.id, item);
    return { ...item };
  }

  async remove(id: string) {
    this.items.delete(id);
  }

  async findTenantAdmin(_tenantId: string) { return null; }

  async listAvailableUnidades() { return []; }
  async listUserUnidades() { return []; }
  async addUserUnidade() {}
  async removeUserUnidade() {}
  async listAvailableProgramas() { return []; }
  async listUserProgramas() { return []; }
  async addUserPrograma() {}
  async removeUserPrograma() {}
  async listAvailableEquipes() { return []; }
  async listUserEquipes() { return []; }
  async addUserEquipe() {}
  async removeUserEquipe() {}
}

const tenantAdmin: SessionUser = {
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
  tenantNome: null,
};

const globalAdmin: SessionUser = {
  id: 'global-1',
  tenantId: null,
  nome: 'Admin Global',
  email: 'global@kreato.app',
  usuario: 'admin_global',
  role: 'GLOBAL_ADMIN',
  perfil: 'Administrador Global',
  tipoAcesso: 'Global',
  unidadeIds: [],
  enabledModules: ['Dashboard', 'Produção', 'Recursos', 'Administração'],
  permissions: [],
  tenantNome: null,
};

describe('UsersService', () => {
  it('cria usuario no tenant do ator', async () => {
    const repository = new InMemoryUsersRepository();
    const service = new UsersService(repository);

    const result = await service.save(tenantAdmin, {
      nome: 'Ana',
      email: 'ana@kreato.app',
      usuario: 'ana',
      senha: 'Senha@123',
      status: 'Ativo',
    });

    expect(result.tenantId).toBe('tenant-1');
    expect(result.status).toBe('Ativo');
  });

  it('impede criar usuario global por admin de tenant', async () => {
    const repository = new InMemoryUsersRepository();
    const service = new UsersService(repository);

    await expect(service.save(tenantAdmin, {
      nome: 'Global',
      email: 'global@kreato.app',
      usuario: 'global',
      senha: 'Senha@123',
      status: 'Ativo',
      role: 'GLOBAL_ADMIN',
      tenantId: null,
    })).rejects.toThrow('Somente administradores globais podem criar usuarios globais');
  });

  it('permite admin de tenant editar um TENANT_ADMIN mantendo o role', async () => {
    const repository = new InMemoryUsersRepository();
    const service = new UsersService(repository);
    await repository.save({
      id: 'user-1', tenantId: 'tenant-1', nome: 'Admin', email: 'admin@kreato.app',
      usuario: 'admin', status: 'ATIVO', role: 'TENANT_ADMIN',
    });

    const result = await service.save(tenantAdmin, {
      id: 'user-1', nome: 'Admin Editado', email: 'admin@kreato.app', usuario: 'admin',
      status: 'Ativo', role: 'TENANT_ADMIN',
    });

    expect(result.nome).toBe('Admin Editado');
    expect(repository.items.get('user-1')?.role).toBe('TENANT_ADMIN');
  });

  it('impede admin de tenant promover ou rebaixar TENANT_ADMIN', async () => {
    const repository = new InMemoryUsersRepository();
    const service = new UsersService(repository);
    await repository.save({
      id: 'u-user', tenantId: 'tenant-1', nome: 'User', email: 'u@kreato.app',
      usuario: 'u', status: 'ATIVO', role: 'USER',
    });
    await repository.save({
      id: 'u-admin', tenantId: 'tenant-1', nome: 'Outro Admin', email: 'a@kreato.app',
      usuario: 'a', status: 'ATIVO', role: 'TENANT_ADMIN',
    });

    await expect(service.save(tenantAdmin, {
      id: 'u-user', nome: 'User', email: 'u@kreato.app', usuario: 'u', status: 'Ativo', role: 'TENANT_ADMIN',
    })).rejects.toThrow('Somente administradores globais podem atribuir role TENANT_ADMIN');

    await expect(service.save(tenantAdmin, {
      id: 'u-admin', nome: 'Outro Admin', email: 'a@kreato.app', usuario: 'a', status: 'Ativo', role: 'USER',
    })).rejects.toThrow('Somente administradores globais podem atribuir role TENANT_ADMIN');

    await expect(service.save(tenantAdmin, {
      nome: 'Novo', email: 'n@kreato.app', usuario: 'n', senha: 'Senha@123', status: 'Ativo', role: 'TENANT_ADMIN',
    })).rejects.toThrow('Somente administradores globais podem atribuir role TENANT_ADMIN');
  });

  it('rejeita senha fora da politica minima', async () => {
    const repository = new InMemoryUsersRepository();
    const service = new UsersService(repository);

    await expect(service.save(tenantAdmin, {
      nome: 'Ana',
      email: 'ana@kreato.app',
      usuario: 'ana',
      senha: '12345678',
      status: 'Ativo',
    })).rejects.toThrow(PASSWORD_POLICY_MESSAGE);
  });

  it('permite que admin global liste usuarios de todos os tenants', async () => {
    const repository = new InMemoryUsersRepository();
    const service = new UsersService(repository);

    repository.items.set('tenant-user-1', {
      id: 'tenant-user-1',
      tenantId: 'tenant-1',
      codigoExterno: null,
      nome: 'Usuario Tenant 1',
      email: 'tenant1@kreato.app',
      usuario: 'tenant1',
      fotoUrl: null,
      perfil: null,
      perfilId: null,
      descricao: null,
      status: 'ATIVO',
      tipoAcesso: 'Operacional',
      recursoHumanoId: null,
      role: 'USER',
      createdAt: new Date('2026-03-25T12:00:00.000Z'),
      passwordHash: null,
    });

    repository.items.set('tenant-user-2', {
      id: 'tenant-user-2',
      tenantId: 'tenant-2',
      codigoExterno: null,
      nome: 'Usuario Tenant 2',
      email: 'tenant2@kreato.app',
      usuario: 'tenant2',
      fotoUrl: null,
      perfil: null,
      perfilId: null,
      descricao: null,
      status: 'ATIVO',
      tipoAcesso: 'Operacional',
      recursoHumanoId: null,
      role: 'USER',
      createdAt: new Date('2026-03-25T12:00:00.000Z'),
      passwordHash: null,
    });

    const result = await service.list(globalAdmin);

    expect(result.total).toBe(2);
    expect(result.data.map((item) => item.id)).toEqual(
      expect.arrayContaining(['tenant-user-1', 'tenant-user-2']),
    );
  });
});
