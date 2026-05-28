import { z } from 'zod';
import type { SessionUser } from '../auth/auth.service.js';
import {
  type EstadosEventoRepository,
  type SatelitesRepository,
  type EstadoEventoRecord,
  type SateliteRecord,
} from './satops.repository.js';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function resolveTenantId(actor: SessionUser, tenantId: string | null | undefined): string {
  if (!tenantId) throw new Error('Tenant não identificado');
  return tenantId;
}

function ensureSameTenant(actor: SessionUser, recordTenantId: string) {
  if (actor.role === 'GLOBAL_ADMIN') return;
  if (actor.tenantId !== recordTenantId) throw new Error('Acesso negado');
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const optionalString = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v === '' ? null : (v ?? null)));

export const saveEstadoEventoSchema = z.object({
  id: z.string().optional(),
  codigoExterno: optionalString,
  nome: z.string().min(1),
  cor: optionalString,
  traducoes: z.record(z.string()).nullable().optional(),
});

export type SaveEstadoEventoData = z.infer<typeof saveEstadoEventoSchema>;

export const saveSateliteSchema = z.object({
  id: z.string().optional(),
  codigoExterno: optionalString,
  nome: z.string().min(1),
  transponder: optionalString,
  frequenciaUplink: optionalString,
  polarizacao: optionalString,
  symbolRate: optionalString,
  fec: optionalString,
  checklist: z.unknown().nullable().optional(),
  traducoes: z.record(z.string()).nullable().optional(),
});

export type SaveSateliteData = z.infer<typeof saveSateliteSchema>;

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapEstadoEvento(r: EstadoEventoRecord) {
  return {
    id: r.id,
    codigoExterno: r.codigoExterno ?? '',
    nome: r.nome,
    cor: r.cor ?? '#3b82f6',
    traducoes: r.traducoes ?? null,
    dataCadastro: r.createdAt?.toISOString() ?? '',
    usuarioCadastro: r.createdBy ?? '',
  };
}

function mapSatelite(r: SateliteRecord) {
  return {
    id: r.id,
    codigoExterno: r.codigoExterno ?? '',
    nome: r.nome,
    transponder: r.transponder ?? '',
    frequenciaUplink: r.frequenciaUplink ?? '',
    polarizacao: r.polarizacao ?? '',
    symbolRate: r.symbolRate ?? '',
    fec: r.fec ?? '',
    checklist: r.checklist ?? null,
    traducoes: r.traducoes ?? null,
    dataCadastro: r.createdAt?.toISOString() ?? '',
    usuarioCadastro: r.createdBy ?? '',
  };
}

// ─── EstadosEvento Service ────────────────────────────────────────────────────

export class EstadosEventoService {
  constructor(private readonly repository: EstadosEventoRepository) {}

  async list(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId);
    return { total, data: data.map(mapEstadoEvento) };
  }

  async save(actor: SessionUser, input: SaveEstadoEventoData) {
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
      cor: input.cor,
      traducoes: input.traducoes,
      createdBy: actor.nome,
    });
    return mapEstadoEvento(record);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const existing = await this.repository.findById(id, tenantId);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id, tenantId);
  }
}

// ─── Satelites Service ────────────────────────────────────────────────────────

export class SatelitesService {
  constructor(private readonly repository: SatelitesRepository) {}

  async list(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId);
    return { total, data: data.map(mapSatelite) };
  }

  async save(actor: SessionUser, input: SaveSateliteData) {
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
      transponder: input.transponder,
      frequenciaUplink: input.frequenciaUplink,
      polarizacao: input.polarizacao,
      symbolRate: input.symbolRate,
      fec: input.fec,
      checklist: input.checklist ?? null,
      traducoes: input.traducoes,
      createdBy: actor.nome,
    });
    return mapSatelite(record);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const existing = await this.repository.findById(id, tenantId);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id, tenantId);
  }
}
