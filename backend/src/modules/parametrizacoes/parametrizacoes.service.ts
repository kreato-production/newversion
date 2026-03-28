import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import { PrismaParametrizacoesRepository } from './parametrizacoes.repository.js';

export const saveStatusGravacaoSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  cor: z.string().optional().nullable(),
  isInicial: z.boolean().optional(),
});

export const saveStatusTarefaSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  codigo: z.string().min(1),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  cor: z.string().optional().nullable(),
  isInicial: z.boolean().optional(),
});

export const saveTituloSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  codigoExterno: z.string().optional().nullable(),
  titulo: z.string().min(1),
  descricao: z.string().optional().nullable(),
  cor: z.string().optional().nullable(),
});

export const saveClassificacaoSchema = saveTituloSchema.extend({
  categoriaIncidenciaId: z.string().min(1).optional(),
});

export const saveCentroLucroSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  status: z.enum(['Ativo', 'Inativo']).optional(),
  parentId: z.string().optional().nullable(),
});

export const toggleInicialSchema = z.object({
  value: z.boolean(),
});

export const saveCentroLucroUnidadesSchema = z.object({
  unidadeIds: z.array(z.string()).default([]),
});

function mapStatusGravacao(row: Awaited<ReturnType<PrismaParametrizacoesRepository['findStatusGravacao']>>) {
  if (!row) return null;

  return {
    id: row.id,
    codigoExterno: row.codigo_externo || '',
    nome: row.nome,
    descricao: row.descricao || '',
    cor: row.cor || '#888888',
    isInicial: row.is_inicial || false,
    dataCadastro: row.created_at?.toISOString() ?? '',
    usuarioCadastro: row.created_by || '',
  };
}

function mapStatusTarefa(row: Awaited<ReturnType<PrismaParametrizacoesRepository['findStatusTarefa']>>) {
  if (!row) return null;

  return {
    id: row.id,
    codigo: row.codigo || row.codigo_externo || '',
    nome: row.nome,
    descricao: row.descricao || '',
    cor: row.cor || '#888888',
    isInicial: row.is_inicial || false,
    dataCadastro: row.created_at?.toISOString() ?? '',
    usuarioCadastro: row.created_by || '',
  };
}

function mapTitulo(row: { id: string; codigo_externo: string | null; titulo: string; descricao: string | null; created_at: Date | null; created_by: string | null; cor?: string | null; }) {
  return {
    id: row.id,
    codigo_externo: row.codigo_externo || '',
    titulo: row.titulo,
    descricao: row.descricao || '',
    cor: row.cor || null,
    created_at: row.created_at?.toISOString() ?? '',
    created_by: row.created_by || '',
  };
}

function mapCentro(row: Awaited<ReturnType<PrismaParametrizacoesRepository['findCentroLucro']>>) {
  if (!row) return null;

  return {
    id: row.id,
    codigoExterno: row.codigo_externo || '',
    nome: row.nome,
    descricao: row.descricao || '',
    status: (row.status as 'Ativo' | 'Inativo') || 'Ativo',
    parentId: row.parent_id || null,
    dataCadastro: row.created_at?.toISOString() ?? '',
    usuarioCadastro: row.created_by || '',
  };
}

export class ParametrizacoesService {
  constructor(private readonly repository: PrismaParametrizacoesRepository) {}

  async listStatusGravacao(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const rows = await this.repository.listStatusGravacao(tenantId);
    return { data: rows.map((row) => mapStatusGravacao(row)!) };
  }

  async saveStatusGravacao(actor: SessionUser, input: z.infer<typeof saveStatusGravacaoSchema>) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);
    if (input.id) {
      const existing = await this.repository.findStatusGravacao(input.id);
      if (!existing) throw new Error('Status de gravacao nao encontrado');
      ensureSameTenant(actor, existing.tenant_id);
    }

    const row = await this.repository.saveStatusGravacao({
      ...input,
      tenantId,
      createdBy: actor.nome,
    });

    return mapStatusGravacao(row)!;
  }

  async toggleStatusGravacaoInicial(actor: SessionUser, id: string, value: boolean) {
    const existing = await this.repository.findStatusGravacao(id);
    if (!existing) throw new Error('Status de gravacao nao encontrado');
    ensureSameTenant(actor, existing.tenant_id);
    const row = await this.repository.setStatusGravacaoInicial(existing.tenant_id, id, value);
    return mapStatusGravacao(row)!;
  }

  async removeStatusGravacao(actor: SessionUser, id: string) {
    const existing = await this.repository.findStatusGravacao(id);
    if (!existing) throw new Error('Status de gravacao nao encontrado');
    ensureSameTenant(actor, existing.tenant_id);
    await this.repository.removeStatusGravacao(id);
  }

  async listStatusTarefa(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const rows = await this.repository.listStatusTarefa(tenantId);
    return { data: rows.map((row) => mapStatusTarefa(row)!) };
  }

  async saveStatusTarefa(actor: SessionUser, input: z.infer<typeof saveStatusTarefaSchema>) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);
    if (input.id) {
      const existing = await this.repository.findStatusTarefa(input.id);
      if (!existing) throw new Error('Status de tarefa nao encontrado');
      ensureSameTenant(actor, existing.tenant_id);
    }

    const row = await this.repository.saveStatusTarefa({
      ...input,
      tenantId,
      createdBy: actor.nome,
    });

    return mapStatusTarefa(row)!;
  }

  async toggleStatusTarefaInicial(actor: SessionUser, id: string, value: boolean) {
    const existing = await this.repository.findStatusTarefa(id);
    if (!existing) throw new Error('Status de tarefa nao encontrado');
    ensureSameTenant(actor, existing.tenant_id);
    const row = await this.repository.setStatusTarefaInicial(existing.tenant_id, id, value);
    return mapStatusTarefa(row)!;
  }

  async removeStatusTarefa(actor: SessionUser, id: string) {
    const existing = await this.repository.findStatusTarefa(id);
    if (!existing) throw new Error('Status de tarefa nao encontrado');
    ensureSameTenant(actor, existing.tenant_id);
    await this.repository.removeStatusTarefa(id);
  }

  async listCategoriasIncidencia(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const rows = await this.repository.listCategoriasIncidencia(tenantId);
    return { data: rows.map(mapTitulo) };
  }

  async saveCategoriaIncidencia(actor: SessionUser, input: z.infer<typeof saveTituloSchema>) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);
    if (input.id) {
      const existing = await this.repository.findCategoriaIncidencia(input.id);
      if (!existing) throw new Error('Categoria de incidencia nao encontrada');
      ensureSameTenant(actor, existing.tenant_id);
    }

    return mapTitulo(await this.repository.saveCategoriaIncidencia({
      ...input,
      tenantId,
      createdBy: actor.nome,
    }));
  }

  async removeCategoriaIncidencia(actor: SessionUser, id: string) {
    const existing = await this.repository.findCategoriaIncidencia(id);
    if (!existing) throw new Error('Categoria de incidencia nao encontrada');
    ensureSameTenant(actor, existing.tenant_id);
    await this.repository.removeCategoriaIncidencia(id);
  }

  async listClassificacoesIncidencia(actor: SessionUser, categoriaId: string) {
    const categoria = await this.repository.findCategoriaIncidencia(categoriaId);
    if (!categoria) throw new Error('Categoria de incidencia nao encontrada');
    ensureSameTenant(actor, categoria.tenant_id);
    const rows = await this.repository.listClassificacoesIncidencia(categoriaId);
    return { data: rows.map(mapTitulo) };
  }

  async saveClassificacaoIncidencia(actor: SessionUser, categoriaId: string, input: z.infer<typeof saveClassificacaoSchema>) {
    const categoria = await this.repository.findCategoriaIncidencia(categoriaId);
    if (!categoria) throw new Error('Categoria de incidencia nao encontrada');
    ensureSameTenant(actor, categoria.tenant_id);

    if (input.id) {
      const existing = await this.repository.findClassificacaoIncidencia(input.id);
      if (!existing) throw new Error('Classificacao de incidencia nao encontrada');
      ensureSameTenant(actor, existing.tenant_id);
    }

    return mapTitulo(await this.repository.saveClassificacaoIncidencia({
      ...input,
      categoriaIncidenciaId: categoriaId,
      tenantId: categoria.tenant_id,
      createdBy: actor.nome,
    }));
  }

  async removeClassificacaoIncidencia(actor: SessionUser, categoriaId: string, classificacaoId: string) {
    const categoria = await this.repository.findCategoriaIncidencia(categoriaId);
    if (!categoria) throw new Error('Categoria de incidencia nao encontrada');
    ensureSameTenant(actor, categoria.tenant_id);

    const existing = await this.repository.findClassificacaoIncidencia(classificacaoId);
    if (!existing) throw new Error('Classificacao de incidencia nao encontrada');
    ensureSameTenant(actor, existing.tenant_id);
    await this.repository.removeClassificacaoIncidencia(classificacaoId);
  }

  async listSeveridadesIncidencia(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const rows = await this.repository.listSeveridadesIncidencia(tenantId);
    return { data: rows.map(mapTitulo) };
  }

  async saveSeveridadeIncidencia(actor: SessionUser, input: z.infer<typeof saveTituloSchema>) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);
    if (input.id) {
      const existing = await this.repository.findSeveridadeIncidencia(input.id);
      if (!existing) throw new Error('Severidade de incidencia nao encontrada');
      ensureSameTenant(actor, existing.tenant_id);
    }

    return mapTitulo(await this.repository.saveSeveridadeIncidencia({
      ...input,
      tenantId,
      createdBy: actor.nome,
    }));
  }

  async removeSeveridadeIncidencia(actor: SessionUser, id: string) {
    const existing = await this.repository.findSeveridadeIncidencia(id);
    if (!existing) throw new Error('Severidade de incidencia nao encontrada');
    ensureSameTenant(actor, existing.tenant_id);
    await this.repository.removeSeveridadeIncidencia(id);
  }

  async listImpactosIncidencia(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const rows = await this.repository.listImpactosIncidencia(tenantId);
    return { data: rows.map(mapTitulo) };
  }

  async saveImpactoIncidencia(actor: SessionUser, input: z.infer<typeof saveTituloSchema>) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);
    if (input.id) {
      const existing = await this.repository.findImpactoIncidencia(input.id);
      if (!existing) throw new Error('Impacto de incidencia nao encontrado');
      ensureSameTenant(actor, existing.tenant_id);
    }

    return mapTitulo(await this.repository.saveImpactoIncidencia({
      ...input,
      tenantId,
      createdBy: actor.nome,
    }));
  }

  async removeImpactoIncidencia(actor: SessionUser, id: string) {
    const existing = await this.repository.findImpactoIncidencia(id);
    if (!existing) throw new Error('Impacto de incidencia nao encontrado');
    ensureSameTenant(actor, existing.tenant_id);
    await this.repository.removeImpactoIncidencia(id);
  }

  async listCentrosLucro(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const rows = await this.repository.listCentrosLucro(tenantId);
    return { data: rows.map((row) => mapCentro(row)!) };
  }

  async saveCentroLucro(actor: SessionUser, input: z.infer<typeof saveCentroLucroSchema>) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findCentroLucro(input.id);
      if (!existing) throw new Error('Centro de lucro nao encontrado');
      ensureSameTenant(actor, existing.tenant_id);
    }

    if (input.parentId) {
      const parent = await this.repository.findCentroLucro(input.parentId);
      if (!parent) throw new Error('Centro de lucro pai nao encontrado');
      ensureSameTenant(actor, parent.tenant_id);
    }

    return mapCentro(await this.repository.saveCentroLucro({
      ...input,
      tenantId,
      createdBy: actor.nome,
    }))!;
  }

  async removeCentroLucro(actor: SessionUser, id: string) {
    const existing = await this.repository.findCentroLucro(id);
    if (!existing) throw new Error('Centro de lucro nao encontrado');
    ensureSameTenant(actor, existing.tenant_id);
    await this.repository.removeCentroLucro(id);
  }

  async listCentroLucroUnidades(actor: SessionUser, centroId: string) {
    const centro = await this.repository.findCentroLucro(centroId);
    if (!centro) throw new Error('Centro de lucro nao encontrado');
    ensureSameTenant(actor, centro.tenant_id);

    const [unidades, associacoes] = await Promise.all([
      this.repository.listUnidadesNegocio(centro.tenant_id),
      this.repository.listCentroLucroUnidades(centroId),
    ]);

    return {
      unidades,
      selectedUnidades: associacoes.map((item) => item.unidade_negocio_id),
    };
  }

  async saveCentroLucroUnidades(actor: SessionUser, centroId: string, unidadeIds: string[]) {
    const centro = await this.repository.findCentroLucro(centroId);
    if (!centro) throw new Error('Centro de lucro nao encontrado');
    ensureSameTenant(actor, centro.tenant_id);
    await this.repository.replaceCentroLucroUnidades(centro.tenant_id, centroId, unidadeIds);
  }
}
