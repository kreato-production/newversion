import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { IncidenciasGravacaoRepository } from './incidencias-gravacao.repository.js';

const emptyStringToNull = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  return value;
};

const optionalNullableString = z.preprocess(emptyStringToNull, z.string().optional().nullable());

export const saveIncidenciaGravacaoSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigo_externo: optionalNullableString,
  titulo: z.string().min(1),
  gravacao_id: optionalNullableString,
  recurso_fisico_id: optionalNullableString,
  severidade_id: optionalNullableString,
  impacto_id: optionalNullableString,
  categoria_id: optionalNullableString,
  classificacao_id: optionalNullableString,
  data_incidencia: optionalNullableString,
  horario_incidencia: optionalNullableString,
  tempo_incidencia: optionalNullableString,
  descricao: optionalNullableString,
  causa_provavel: optionalNullableString,
  created_by: optionalNullableString,
});

export const addIncidenciaAnexoSchema = z.object({
  nome: z.string().min(1),
  url: z.string().min(1),
  tipo: optionalNullableString,
  tamanho: z.coerce.number().int().min(0).nullable().optional(),
});

export type SaveIncidenciaGravacaoDto = z.infer<typeof saveIncidenciaGravacaoSchema>;

export class IncidenciasGravacaoService {
  constructor(private readonly repository: IncidenciasGravacaoRepository) {}

  async list(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listByTenant(tenantId);
  }

  async listByGravacao(actor: SessionUser, gravacaoId: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listByGravacao(tenantId, gravacaoId);
  }

  async save(actor: SessionUser, input: SaveIncidenciaGravacaoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Incidencia nao encontrada');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    return this.repository.save({
      id: input.id,
      tenantId,
      codigo_externo: input.codigo_externo ?? null,
      titulo: input.titulo,
      gravacao_id: input.gravacao_id ?? null,
      recurso_fisico_id: input.recurso_fisico_id ?? null,
      severidade_id: input.severidade_id ?? null,
      impacto_id: input.impacto_id ?? null,
      categoria_id: input.categoria_id ?? null,
      classificacao_id: input.classificacao_id ?? null,
      data_incidencia: input.data_incidencia ?? null,
      horario_incidencia: input.horario_incidencia ?? null,
      tempo_incidencia: input.tempo_incidencia ?? null,
      descricao: input.descricao ?? null,
      causa_provavel: input.causa_provavel ?? null,
      created_by: actor.id,
    });
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Incidencia nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async listAnexos(actor: SessionUser, incidenciaId: string) {
    const existing = await this.repository.findById(incidenciaId);
    if (!existing) {
      throw new Error('Incidencia nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.listAnexos(incidenciaId);
  }

  async addAnexo(actor: SessionUser, incidenciaId: string, input: z.infer<typeof addIncidenciaAnexoSchema>) {
    const existing = await this.repository.findById(incidenciaId);
    if (!existing) {
      throw new Error('Incidencia nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.addAnexo({
      incidencia_id: incidenciaId,
      tenant_id: existing.tenantId,
      nome: input.nome,
      url: input.url,
      tipo: input.tipo ?? null,
      tamanho: input.tamanho ?? null,
      created_by: actor.id,
    });
  }

  async removeAnexo(actor: SessionUser, incidenciaId: string, anexoId: string) {
    const existing = await this.repository.findById(incidenciaId);
    if (!existing) {
      throw new Error('Incidencia nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.removeAnexo(anexoId);
  }
}
