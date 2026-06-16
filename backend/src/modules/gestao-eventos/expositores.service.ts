import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { ExpositoresRepository, ExpositorProduto } from './expositores.repository.js';

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optionalString = z.preprocess(emptyToNull, z.string().optional().nullable());

const produtoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  descricao: optionalString,
  preco: optionalString,
});

export const saveExpositorSchema = z.object({
  id: z.string().optional(),
  codigoExterno: optionalString,
  nome: z.string().min(1),
  logo: optionalString,
  tipoExpositorId: optionalString,
  descricao: optionalString,
  tags: z.array(z.string()).optional().default([]),
  contato: optionalString,
  telefone: optionalString,
  email: optionalString,
  instagram: optionalString,
  facebook: optionalString,
  produtos: z.array(produtoSchema).optional().default([]),
});

export type SaveExpositorDto = z.infer<typeof saveExpositorSchema>;

export class ExpositoresService {
  constructor(private readonly repository: ExpositoresRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);
    return { total, data: data.map(mapExpositor) };
  }

  async save(actor: SessionUser, input: SaveExpositorDto) {
    const tenantId = resolveTenantId(actor, actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id, tenantId);
      if (existing) ensureSameTenant(actor, existing.tenantId);
    }

    const record = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      logo: input.logo,
      tipoExpositorId: input.tipoExpositorId,
      descricao: input.descricao,
      tags: input.tags,
      contato: input.contato,
      telefone: input.telefone,
      email: input.email,
      instagram: input.instagram,
      facebook: input.facebook,
      produtos: input.produtos as ExpositorProduto[],
      createdBy: actor.nome,
    });

    return mapExpositor(record);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const existing = await this.repository.findById(id, tenantId);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id, tenantId);
  }
}

function mapExpositor(item: Awaited<ReturnType<ExpositoresRepository['findById']>> extends infer T ? Exclude<T, null> : never) {
  return {
    id: item.id,
    codigoExterno: item.codigoExterno ?? '',
    nome: item.nome,
    logo: item.logo ?? null,
    tipoExpositorId: item.tipoExpositorId ?? null,
    tipoExpositorNome: item.tipoExpositorNome ?? '',
    descricao: item.descricao ?? '',
    tags: item.tags ?? [],
    contato: item.contato ?? '',
    telefone: item.telefone ?? '',
    email: item.email ?? '',
    instagram: item.instagram ?? '',
    facebook: item.facebook ?? '',
    produtos: item.produtos ?? [],
    createdAt: item.createdAt?.toISOString() ?? '',
    createdBy: item.createdBy ?? '',
  };
}
