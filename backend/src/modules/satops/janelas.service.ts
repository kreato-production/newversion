import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import type {
  JanelasRepository,
  JanelaRecord,
  JanelaResponsavelRecord,
} from './janelas.repository.js';

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

export const saveJanelaSchema = z.object({
  id: z.string().optional(),
  sateliteId: optionalString,
  sateliteNome: optionalString,
  dataEvento: optionalString,
  tipoEvento: optionalString,
  canal: optionalString,
  tituloEvento: optionalString,
  programaId: optionalString,
  programaNome: optionalString,
  aberturaPrevia: optionalString,
  aberturaReal: optionalString,
  confirmacaoNocId: optionalString,
  confirmacaoNocNome: optionalString,
  fechoPrevisto: optionalString,
  fechoReal: optionalString,
  responsaveis: z.unknown().nullable().optional(),
  checklist: z.unknown().nullable().optional(),
  simulacao: z.boolean().nullable().optional(),
});

export type SaveJanelaData = z.infer<typeof saveJanelaSchema>;

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapJanela(r: JanelaRecord) {
  return {
    id: r.id,
    sateliteId: r.sateliteId ?? '',
    sateliteNome: r.sateliteNome ?? '',
    dataEvento: r.dataEvento ?? '',
    tipoEvento: r.tipoEvento ?? '',
    canal: r.canal ?? '',
    tituloEvento: r.tituloEvento ?? '',
    programaId: r.programaId ?? '',
    programaNome: r.programaNome ?? '',
    aberturaPrevia: r.aberturaPrevia ?? '',
    aberturaReal: r.aberturaReal ?? '',
    confirmacaoNocId: r.confirmacaoNocId ?? '',
    confirmacaoNocNome: r.confirmacaoNocNome ?? '',
    fechoPrevisto: r.fechoPrevisto ?? '',
    fechoReal: r.fechoReal ?? '',
    responsaveis: (r.responsaveis as JanelaResponsavelRecord[]) ?? null,
    checklist: r.checklist ?? null,
    simulacao: r.simulacao ?? false,
    dataCadastro: r.createdAt?.toISOString() ?? '',
    usuarioCadastro: r.createdBy ?? '',
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class JanelasService {
  constructor(private readonly repository: JanelasRepository) {}

  async list(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId);
    return { total, data: data.map(mapJanela) };
  }

  async save(actor: SessionUser, input: SaveJanelaData) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    if (input.id) {
      const existing = await this.repository.findById(input.id, tenantId);
      if (existing) ensureSameTenant(actor, existing.tenantId);
    }
    const record = await this.repository.save({
      id: input.id,
      tenantId,
      sateliteId: input.sateliteId,
      sateliteNome: input.sateliteNome,
      dataEvento: input.dataEvento,
      tipoEvento: input.tipoEvento,
      canal: input.canal,
      tituloEvento: input.tituloEvento,
      programaId: input.programaId,
      programaNome: input.programaNome,
      aberturaPrevia: input.aberturaPrevia,
      aberturaReal: input.aberturaReal,
      confirmacaoNocId: input.confirmacaoNocId,
      confirmacaoNocNome: input.confirmacaoNocNome,
      fechoPrevisto: input.fechoPrevisto,
      fechoReal: input.fechoReal,
      responsaveis: (input.responsaveis as JanelaResponsavelRecord[] | null) ?? null,
      checklist: input.checklist ?? null,
      simulacao: input.simulacao ?? false,
      createdBy: actor.nome,
    });
    return mapJanela(record);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const existing = await this.repository.findById(id, tenantId);
    if (existing) ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id, tenantId);
  }

  async listCanais(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listCanais(tenantId);
  }

  async listProgramas(actor: SessionUser, canal: string, data: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listProgramas(tenantId, canal, data);
  }
}
