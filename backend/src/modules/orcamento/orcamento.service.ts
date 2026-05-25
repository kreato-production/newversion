import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { OrcamentoRepository } from './orcamento.repository.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optionalString = z.preprocess(emptyToNull, z.string().optional().nullable());
const monthValue = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
  z.number().min(0),
);

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const saveOrcamentoSchema = z.object({
  id: z.string().optional(),
  ano: z.preprocess((v) => Number(v), z.number().int().min(2000).max(2100)),
  centroLucroId: z.string().min(1),
  descricao: optionalString,
});

export const saveOrcamentoItemSchema = z.object({
  id: z.string().optional(),
  orcamentoId: z.string().min(1),
  categoria: z.enum(['recursos_tecnicos', 'equipamentos', 'despesas']),
  itemNome: z.string().min(1),
  recursoId: optionalString,
  jan: monthValue, fev: monthValue, mar: monthValue, abr: monthValue,
  mai: monthValue, jun: monthValue, jul: monthValue, ago: monthValue,
  set: monthValue, out: monthValue, nov: monthValue, dez: monthValue,
});

export type SaveOrcamentoData = z.infer<typeof saveOrcamentoSchema>;
export type SaveOrcamentoItemData = z.infer<typeof saveOrcamentoItemSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export class OrcamentoService {
  constructor(private readonly repo: OrcamentoRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repo.listByTenant(tenantId, opts);
    return { total, data: data.map(mapOrcamento) };
  }

  async findById(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const item = await this.repo.findById(id, tenantId);
    if (!item) return null;
    ensureSameTenant(actor, item.tenantId);
    return mapOrcamento(item);
  }

  async save(actor: SessionUser, input: SaveOrcamentoData) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    if (input.id) {
      const existing = await this.repo.findById(input.id, tenantId);
      if (existing) ensureSameTenant(actor, existing.tenantId);
    }
    const record = await this.repo.save({
      id: input.id,
      tenantId,
      ano: input.ano,
      centroLucroId: input.centroLucroId,
      descricao: input.descricao,
      createdBy: actor.nome,
    });
    return mapOrcamento(record);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const existing = await this.repo.findById(id, tenantId);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    await this.repo.remove(id, tenantId);
  }

  async listItens(actor: SessionUser, orcamentoId: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const parent = await this.repo.findById(orcamentoId, tenantId);
    if (parent) ensureSameTenant(actor, parent.tenantId);
    const itens = await this.repo.listItens(orcamentoId, tenantId);
    return itens.map(mapItem);
  }

  async saveItem(actor: SessionUser, input: SaveOrcamentoItemData) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const parent = await this.repo.findById(input.orcamentoId, tenantId);
    if (parent) ensureSameTenant(actor, parent.tenantId);
    const record = await this.repo.saveItem({ ...input, tenantId });
    return mapItem(record);
  }

  async removeItem(actor: SessionUser, itemId: string, orcamentoId: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const parent = await this.repo.findById(orcamentoId, tenantId);
    if (parent) ensureSameTenant(actor, parent.tenantId);
    await this.repo.removeItem(itemId, tenantId);
  }

  async listByAno(actor: SessionUser, ano: number) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const list = await this.repo.listByAno(ano, tenantId);
    return list.map(mapOrcamento);
  }

  async listTotaisPorAno(actor: SessionUser, ano: number) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repo.listTotaisPorAno(ano, tenantId);
  }

  async listItensPorAno(actor: SessionUser, ano: number) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repo.listItensPorAno(ano, tenantId);
  }

  async getOrcamentoComItens(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const [orc, itens] = await Promise.all([
      this.repo.findById(id, tenantId),
      this.repo.listItens(id, tenantId),
    ]);
    if (!orc) return null;
    ensureSameTenant(actor, orc.tenantId);
    return { ...mapOrcamento(orc), itens: itens.map(mapItem) };
  }
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapOrcamento(r: NonNullable<Awaited<ReturnType<OrcamentoRepository['findById']>>>) {
  return {
    id: r.id,
    ano: r.ano,
    centroLucroId: r.centroLucroId,
    centroLucroNome: r.centroLucroNome ?? '',
    descricao: r.descricao ?? '',
    total: r.total ?? 0,
  };
}

function mapItem(r: Awaited<ReturnType<OrcamentoRepository['listItens']>>[number]) {
  return {
    id: r.id,
    orcamentoId: r.orcamentoId,
    categoria: r.categoria,
    itemNome: r.itemNome,
    recursoId: r.recursoId ?? null,
    jan: r.jan, fev: r.fev, mar: r.mar, abr: r.abr,
    mai: r.mai, jun: r.jun, jul: r.jul, ago: r.ago,
    set: r.set, out: r.out, nov: r.nov, dez: r.dez,
  };
}
