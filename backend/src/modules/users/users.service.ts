import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { hashPassword } from '../../lib/security/password.js';
import { AccessError, ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { UsersRepository } from './users.repository.js';

export const saveUserSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  email: z.string().email(),
  usuario: z.string().min(1),
  senha: z.string().min(6).optional(),
  foto: z.string().optional().nullable(),
  perfil: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']).default('Ativo'),
  tipoAcesso: z.string().optional(),
  recursoHumanoId: z.string().optional().nullable(),
  role: z.enum(['GLOBAL_ADMIN', 'TENANT_ADMIN', 'USER']).optional(),
});

export type SaveUserDto = z.infer<typeof saveUserSchema>;

export const saveUserRelationSchema = z.object({
  targetId: z.string().min(1),
});

function mapStatus(status: 'Ativo' | 'Inativo' | 'Bloqueado'): 'ATIVO' | 'INATIVO' | 'BLOQUEADO' {
  if (status === 'Inativo') return 'INATIVO';
  if (status === 'Bloqueado') return 'BLOQUEADO';
  return 'ATIVO';
}

function mapStatusToView(status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'): 'Ativo' | 'Inativo' | 'Bloqueado' {
  if (status === 'INATIVO') return 'Inativo';
  if (status === 'BLOQUEADO') return 'Bloqueado';
  return 'Ativo';
}

export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  private async getTargetUser(actor: SessionUser, userId: string) {
    const existing = await this.repository.findById(userId);
    if (!existing) {
      throw new Error('Usuario nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    return existing;
  }

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = actor.role === 'GLOBAL_ADMIN' ? actor.tenantId ?? null : resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);
    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        nome: item.nome,
        email: item.email,
        usuario: item.usuario,
        senha: '',
        foto: item.fotoUrl || '',
        perfil: item.perfil || '',
        descricao: item.descricao || '',
        status: mapStatusToView(item.status),
        tipoAcesso: item.tipoAcesso,
        recursoHumanoId: item.recursoHumanoId || undefined,
        dataCadastro: item.createdAt.toISOString(),
        usuarioCadastro: '',
        tenantId: item.tenantId,
        role: item.role,
      })),
    };
  }

  async save(actor: SessionUser, input: SaveUserDto) {
    const targetTenantId = input.role === 'GLOBAL_ADMIN' ? null : resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.role === 'GLOBAL_ADMIN' && actor.role !== 'GLOBAL_ADMIN') {
      throw new AccessError('Somente administradores globais podem criar usuarios globais');
    }

    if (!input.id) {
      const existingByEmail = await this.repository.findByEmail(input.email);
      if (existingByEmail) {
        throw new Error('Ja existe um usuario com este email');
      }

      const existingByUsername = await this.repository.findByUsername(input.usuario);
      if (existingByUsername) {
        throw new Error('Ja existe um usuario com este usuario');
      }
    } else {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Usuario nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId: targetTenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      email: input.email,
      usuario: input.usuario,
      passwordHash: input.senha ? hashPassword(input.senha) : undefined,
      fotoUrl: input.foto,
      perfil: input.perfil,
      descricao: input.descricao,
      status: mapStatus(input.status),
      tipoAcesso: input.tipoAcesso,
      recursoHumanoId: input.recursoHumanoId,
      role: input.role ?? (actor.role === 'GLOBAL_ADMIN' ? 'TENANT_ADMIN' : 'USER'),
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      email: item.email,
      usuario: item.usuario,
      senha: '',
      foto: item.fotoUrl || '',
      perfil: item.perfil || '',
      descricao: item.descricao || '',
      status: mapStatusToView(item.status),
      tipoAcesso: item.tipoAcesso,
      recursoHumanoId: item.recursoHumanoId || undefined,
      dataCadastro: item.createdAt.toISOString(),
      usuarioCadastro: '',
      tenantId: item.tenantId,
      role: item.role,
    };
  }

  async remove(actor: SessionUser, id: string) {
    await this.getTargetUser(actor, id);
    await this.repository.remove(id);
  }

  async listUnidades(actor: SessionUser, userId: string) {
    const user = await this.getTargetUser(actor, userId);
    return {
      vinculadas: await this.repository.listUserUnidades(user.id),
      disponiveis: user.tenantId ? await this.repository.listAvailableUnidades(user.tenantId) : [],
    };
  }

  async addUnidade(actor: SessionUser, userId: string, unidadeId: string) {
    const user = await this.getTargetUser(actor, userId);
    if (!user.tenantId) {
      throw new Error('Usuario sem tenant associado');
    }

    const available = await this.repository.listAvailableUnidades(user.tenantId);
    if (!available.some((item) => item.id === unidadeId)) {
      throw new Error('Unidade nao encontrada para o tenant do usuario');
    }

    await this.repository.addUserUnidade(user.id, unidadeId);
  }

  async removeUnidade(actor: SessionUser, userId: string, unidadeId: string) {
    const user = await this.getTargetUser(actor, userId);
    await this.repository.removeUserUnidade(user.id, unidadeId);
  }

  async listProgramas(actor: SessionUser, userId: string) {
    const user = await this.getTargetUser(actor, userId);
    return {
      vinculados: await this.repository.listUserProgramas(user.id),
      disponiveis: user.tenantId ? await this.repository.listAvailableProgramas(user.tenantId) : [],
    };
  }

  async addPrograma(actor: SessionUser, userId: string, programaId: string) {
    const user = await this.getTargetUser(actor, userId);
    if (!user.tenantId) {
      throw new Error('Usuario sem tenant associado');
    }

    const available = await this.repository.listAvailableProgramas(user.tenantId);
    if (!available.some((item) => item.id === programaId)) {
      throw new Error('Programa nao encontrado para o tenant do usuario');
    }

    await this.repository.addUserPrograma({ tenantId: user.tenantId, userId: user.id, programaId });
  }

  async removePrograma(actor: SessionUser, userId: string, programaId: string) {
    const user = await this.getTargetUser(actor, userId);
    await this.repository.removeUserPrograma(user.id, programaId);
  }

  async listEquipes(actor: SessionUser, userId: string) {
    const user = await this.getTargetUser(actor, userId);
    return {
      vinculadas: await this.repository.listUserEquipes(user.id),
      disponiveis: user.tenantId ? await this.repository.listAvailableEquipes(user.tenantId) : [],
    };
  }

  async addEquipe(actor: SessionUser, userId: string, equipeId: string) {
    const user = await this.getTargetUser(actor, userId);
    if (!user.tenantId) {
      throw new Error('Usuario sem tenant associado');
    }

    const available = await this.repository.listAvailableEquipes(user.tenantId);
    if (!available.some((item) => item.id === equipeId)) {
      throw new Error('Equipe nao encontrada para o tenant do usuario');
    }

    await this.repository.addUserEquipe({ tenantId: user.tenantId, userId: user.id, equipeId });
  }

  async removeEquipe(actor: SessionUser, userId: string, equipeId: string) {
    const user = await this.getTargetUser(actor, userId);
    await this.repository.removeUserEquipe(user.id, equipeId);
  }
}
