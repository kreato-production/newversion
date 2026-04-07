import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import type { TenantsRepository } from './tenants.repository.js';

export const saveTenantSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1),
  plano: z.string().optional().nullable(),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']),
  notas: z.string().optional().nullable(),
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
  constructor(private readonly repository: TenantsRepository) {}

  private async getTenant(id: string) {
    const tenant = await this.repository.findById(id);
    if (!tenant) {
      throw new Error('Tenant nao encontrado');
    }

    return tenant;
  }

  async list(_actor: SessionUser) {
    const data = await this.repository.list();
    return data.map((item) => ({
      id: item.id,
      nome: item.nome,
      plano: item.plano || 'Mensal',
      status: statusLabelMap[item.status],
      notas: item.notas || '',
      createdAt: item.createdAt.toISOString(),
      licencaFim: item.licencaFim?.toISOString() ?? null,
    }));
  }

  async save(_actor: SessionUser, input: SaveTenantDto) {
    const item = await this.repository.save({
      id: input.id,
      nome: input.nome,
      plano: input.plano,
      notas: input.notas,
      status: statusMap[input.status],
    });

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
