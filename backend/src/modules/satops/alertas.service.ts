import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import type { AlertasRepository, AlertaRecord } from './alertas.repository.js';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function resolveTenantId(actor: SessionUser, tenantId: string | null | undefined): string {
  if (!tenantId) throw new Error('Tenant não identificado');
  return tenantId;
}

function ensureSameTenant(actor: SessionUser, recordTenantId: string) {
  if (actor.role === 'GLOBAL_ADMIN') return;
  if (actor.tenantId !== recordTenantId) throw new Error('Acesso negado');
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const optionalString = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v === '' ? null : (v ?? null)));

export const saveAlertaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1),
  tempoParaAlerta: optionalString,
  regra: optionalString,
  campoReferencia: optionalString,
});

export type SaveAlertaData = z.infer<typeof saveAlertaSchema>;

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapAlerta(r: AlertaRecord) {
  return {
    id: r.id,
    nome: r.nome,
    tempoParaAlerta: r.tempoParaAlerta ?? '',
    regra: r.regra ?? '',
    campoReferencia: r.campoReferencia ?? '',
    dataCadastro: r.createdAt?.toISOString() ?? '',
    usuarioCadastro: r.createdBy ?? '',
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AlertasService {
  constructor(private readonly repository: AlertasRepository) {}

  async list(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId);
    return { total, data: data.map(mapAlerta) };
  }

  async save(actor: SessionUser, input: SaveAlertaData) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    if (input.id) {
      const existing = await this.repository.findById(input.id, tenantId);
      if (existing) ensureSameTenant(actor, existing.tenantId);
    }
    const record = await this.repository.save({
      id: input.id,
      tenantId,
      nome: input.nome,
      tempoParaAlerta: input.tempoParaAlerta,
      regra: input.regra,
      campoReferencia: input.campoReferencia,
      createdBy: actor.nome,
    });
    return mapAlerta(record);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const existing = await this.repository.findById(id, tenantId);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id, tenantId);
  }
}
