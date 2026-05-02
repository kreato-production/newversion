import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { hashPassword } from '../../lib/security/password.js';
import { isValidPasswordPolicy, PASSWORD_POLICY_MESSAGE } from '../../lib/security/password-policy.js';
import { AccessError } from '../common/access.js';
import type { TenantsRepository } from './tenants.repository.js';
import type { UsersRepository } from '../users/users.repository.js';

export const saveTenantSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1),
  plano: z.string().optional().nullable(),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']),
  notas: z.string().optional().nullable(),
  adminNome: z.string().min(1).optional(),
  adminUsuario: z.string().min(1).optional(),
  adminSenha: z.string().optional(),
});

export type SaveTenantDto = z.infer<typeof saveTenantSchema>;

export const saveTenantLicencaSchema = z.object({
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
});

export const saveTenantModuloSchema = z.object({
  modulo: z.string().min(1),
  enabled: z.boolean(),
});

export const saveTenantUnidadeSchema = z.object({
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  imagem: z.string().optional().nullable(),
  moeda: z.string().optional().nullable(),
});

const statusMap = {
  Ativo: 'ATIVO',
  Inativo: 'INATIVO',
  Bloqueado: 'BLOQUEADO',
} as const;

const statusLabelMap = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
} as const;

export class TenantsService {
  constructor(
    private readonly repository: TenantsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  private async getTenant(id: string) {
    const tenant = await this.repository.findById(id);
    if (!tenant) {
      throw new Error('Tenant nao encontrado');
    }

    return tenant;
  }

  async list(_actor: SessionUser) {
    const data = await this.repository.list();
    const results = await Promise.all(
      data.map(async (item) => {
        const admin = await this.usersRepository.findTenantAdmin(item.id);
        return {
          id: item.id,
          nome: item.nome,
          plano: item.plano || 'Mensal',
          status: statusLabelMap[item.status],
          notas: item.notas || '',
          createdAt: item.createdAt.toISOString(),
          licencaFim: item.licencaFim?.toISOString() ?? null,
          adminNome: admin?.nome ?? null,
          adminUsuario: admin?.usuario ?? null,
        };
      }),
    );
    return results;
  }

  async save(_actor: SessionUser, input: SaveTenantDto) {
    const isNew = !input.id;

    // Validate admin fields: required when creating, password policy when provided
    if (isNew) {
      if (!input.adminNome || !input.adminUsuario || !input.adminSenha) {
        throw new AccessError('adminNome, adminUsuario e adminSenha sao obrigatorios ao criar um tenant', 400);
      }
    }
    if (input.adminSenha && !isValidPasswordPolicy(input.adminSenha)) {
      throw new AccessError(PASSWORD_POLICY_MESSAGE, 400);
    }

    // Check username uniqueness before saving the tenant
    if (input.adminUsuario) {
      const existingUser = await this.usersRepository.findByUsername(input.adminUsuario);
      // On create, any match is a conflict. On update, only conflict if it belongs to a different tenant.
      if (existingUser && (isNew || existingUser.tenantId !== input.id)) {
        throw new AccessError('Ja existe um usuario com este nome de usuario', 409);
      }
    }

    const item = await this.repository.save({
      id: input.id,
      nome: input.nome,
      plano: input.plano,
      notas: input.notas,
      status: statusMap[input.status],
    });

    // Create or update the TENANT_ADMIN user
    if (input.adminNome && input.adminUsuario) {
      const existingAdmin = await this.usersRepository.findTenantAdmin(item.id);

      await this.usersRepository.save({
        id: existingAdmin?.id,
        tenantId: item.id,
        nome: input.adminNome,
        email: `${input.adminUsuario}@kreato.internal`,
        usuario: input.adminUsuario,
        passwordHash: input.adminSenha ? hashPassword(input.adminSenha) : undefined,
        status: 'ATIVO',
        tipoAcesso: 'Administração',
        role: 'TENANT_ADMIN',
      });
    }

    return {
      id: item.id,
      nome: item.nome,
      plano: item.plano || 'Mensal',
      status: statusLabelMap[item.status],
      notas: item.notas || '',
      createdAt: item.createdAt.toISOString(),
      licencaFim: item.licencaFim?.toISOString() ?? null,
    };
  }

  async remove(_actor: SessionUser, id: string) {
    await this.getTenant(id);
    await this.repository.remove(id);
  }

  async listLicencas(_actor: SessionUser, tenantId: string) {
    await this.getTenant(tenantId);
    const items = await this.repository.listLicencas(tenantId);
    return items.map((item) => ({
      id: item.id,
      dataInicio: item.dataInicio.toISOString(),
      dataFim: item.dataFim.toISOString(),
    }));
  }

  async addLicenca(_actor: SessionUser, tenantId: string, input: z.infer<typeof saveTenantLicencaSchema>) {
    await this.getTenant(tenantId);

    if (input.dataFim < input.dataInicio) {
      throw new Error('Data fim deve ser maior que a data de inicio');
    }

    const item = await this.repository.addLicenca({
      tenantId,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
    });

    return {
      id: item.id,
      dataInicio: item.dataInicio.toISOString(),
      dataFim: item.dataFim.toISOString(),
    };
  }

  async removeLicenca(_actor: SessionUser, tenantId: string, licencaId: string) {
    await this.getTenant(tenantId);
    await this.repository.removeLicenca(tenantId, licencaId);
  }

  async listModulos(_actor: SessionUser, tenantId: string) {
    await this.getTenant(tenantId);
    const items = await this.repository.listModulos(tenantId);
    return items.map((item) => item.modulo);
  }

  async setModulo(_actor: SessionUser, tenantId: string, input: z.infer<typeof saveTenantModuloSchema>) {
    await this.getTenant(tenantId);
    await this.repository.setModulo({ tenantId, modulo: input.modulo, enabled: input.enabled });
  }

  async listUnidades(_actor: SessionUser, tenantId: string) {
    await this.getTenant(tenantId);
    const items = await this.repository.listUnidades(tenantId);
    return items.map((item) => ({
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      descricao: item.descricao || '',
      moeda: item.moeda,
    }));
  }

  async createUnidade(actor: SessionUser, tenantId: string, input: z.infer<typeof saveTenantUnidadeSchema>) {
    await this.getTenant(tenantId);
    const item = await this.repository.createUnidade({
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      descricao: input.descricao,
      imagemUrl: input.imagem,
      moeda: input.moeda,
      createdByName: actor.nome,
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      descricao: item.descricao || '',
      moeda: item.moeda,
    };
  }

  async updateUnidade(
    actor: SessionUser,
    tenantId: string,
    unidadeId: string,
    input: z.infer<typeof saveTenantUnidadeSchema>,
  ) {
    await this.getTenant(tenantId);

    const unidade = await this.repository.findUnidadeById(tenantId, unidadeId);
    if (!unidade) {
      throw new Error('Unidade de negocio nao encontrada');
    }

    const item = await this.repository.updateUnidade(unidadeId, {
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      descricao: input.descricao,
      imagemUrl: input.imagem,
      moeda: input.moeda,
      createdByName: actor.nome,
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      descricao: item.descricao || '',
      moeda: item.moeda,
    };
  }

  async removeUnidade(_actor: SessionUser, tenantId: string, unidadeId: string) {
    await this.getTenant(tenantId);

    const unidade = await this.repository.findUnidadeById(tenantId, unidadeId);
    if (!unidade) {
      throw new Error('Unidade de negocio nao encontrada');
    }

    await this.repository.removeUnidade(tenantId, unidadeId);
  }
}
