import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { resolveTenantId } from '../common/access.js';
import type { PrismaGrelhaProgramacaoRepository, SyncGrelhaItem } from './grelha-programacao.repository.js';

/** Converts DD/MM/YYYY or DD.MM.YYYY → YYYY-MM-DD. */
function parseDateToIso(value: string): string {
  const match = value.match(/^(\d{2})[\/\.](\d{2})[\/\.](\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return value;
}

/** Normalises HH:MM:SS or HHMM or HHMMSS → HH:MM */
function parseHhmm(value: string): string {
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value.slice(0, 5); // HH:MM:SS → HH:MM
  if (/^\d{4}$/.test(value)) return `${value.slice(0, 2)}:${value.slice(2)}`;
  if (/^\d{6}$/.test(value)) return `${value.slice(0, 2)}:${value.slice(2, 4)}`;
  return value;
}

export const updateStatusPlaneamentoSchema = z.object({
  statusPlaneamentoId: z.string().nullable(),
});

export class GrelhaProgramacaoService {
  constructor(private readonly repository: PrismaGrelhaProgramacaoRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number; mes?: number; ano?: number; canal?: string }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listByTenant(tenantId, opts);
  }

  async getById(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.findById(id, tenantId);
  }

  async updateStatusPlaneamento(actor: SessionUser, id: string, statusPlaneamentoId: string | null) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Programa não encontrado');
    return this.repository.updateStatusPlaneamento(id, tenantId, statusPlaneamentoId);
  }

  async marcarAlteracaoVista(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Programa não encontrado');
    await this.repository.marcarAlteracaoVista(id, tenantId);
  }

  async linkGravacao(actor: SessionUser, id: string, gravacaoId: string | null) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Programa não encontrado');
    return this.repository.linkGravacao(id, tenantId, gravacaoId);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const record = await this.repository.findById(id, tenantId);
    if (!record) throw new Error('Programa não encontrado');
    await this.repository.remove(id, tenantId);
  }

  async syncFromApiResponse(tenantId: string, maestroId: string, body: string): Promise<number> {
    console.log(`[GrelhaSync] INIT tenantId=${tenantId} maestroId=${maestroId} bodyLen=${body.length}`);

    // ── 1. Parse JSON ──────────────────────────────────────────────────────────
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      console.error(`[GrelhaSync] JSON.parse falhou: ${String(e)}`);
      console.error(`[GrelhaSync] Primeiros 300 chars do body: ${body.slice(0, 300)}`);
      return 0;
    }

    // ── 2. Extrair array — aceita qualquer wrapper (LIST, list, data, DATA, etc.) ──
    let rawItems: unknown[] = [];
    if (Array.isArray(parsed)) {
      rawItems = parsed;
      console.log(`[GrelhaSync] Formato: array directo — ${rawItems.length} item(s)`);
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const arrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
      if (arrayKey) {
        rawItems = obj[arrayKey] as unknown[];
        console.log(`[GrelhaSync] Formato: { "${arrayKey}": [] } — ${rawItems.length} item(s)`);
      } else {
        console.error(`[GrelhaSync] Nenhuma chave com array encontrada. Chaves: ${Object.keys(obj).join(', ')}`);
        return 0;
      }
    } else {
      console.error(`[GrelhaSync] Formato inesperado: ${typeof parsed}`);
      return 0;
    }

    if (rawItems.length === 0) {
      console.warn('[GrelhaSync] Array vazio na resposta.');
      return 0;
    }

    // ── 3. Log do 1.º item para diagnóstico ───────────────────────────────────
    const first = rawItems[0] as Record<string, unknown>;
    console.log(`[GrelhaSync] 1.º item — ID: ${JSON.stringify(first['ID'])} | NAME: ${JSON.stringify(first['NAME'])} | DATE: ${JSON.stringify(first['DATE'])}`);

    // ── 4. Helper ─────────────────────────────────────────────────────────────
    const s = (r: Record<string, unknown>, key: string): string | null =>
      r[key] != null && r[key] !== '' ? String(r[key]) : null;

    // ── 5. Mapeamento Provys → SyncGrelhaItem ─────────────────────────────────
    const items: SyncGrelhaItem[] = rawItems
      .map((raw) => {
        const r = raw as Record<string, unknown>;
        const apiId = s(r, 'ID') ?? '';
        const startTime = s(r, 'START_TIME');
        return {
          apiId,
          serie:          s(r, 'SERIES'),
          idPrograma:     s(r, 'PROGRAMME_ID'),
          programa:       s(r, 'PROGRAMME'),
          tipoRequisicao: null,
          genero:         s(r, 'GENRE'),
          codigoProducao: s(r, 'PRODUCTION_CODE'),
          tipoAquisicao:  s(r, 'ACQ_TYPE'),
          nome:           s(r, 'NAME') ?? '',
          tipoPrograma:   s(r, 'PROG_TYPE'),
          categoria:      s(r, 'PROGCATEGORY'),
          canal:          s(r, 'CHANNEL'),
          semana:         s(r, 'WEEK'),
          tipoExibicao:   s(r, 'PREMIERE'),
          episodio:       s(r, 'EPISODE'),
          dataExibicao:   (() => { const v = s(r, 'DATE'); return v ? parseDateToIso(v) : null; })(),
          horarioInicio:  startTime ? parseHhmm(startTime) : null,
          duracao:        s(r, 'DURATION'),
          statusGrelha:   s(r, 'STATUS_GRELHA'),
        };
      })
      .filter((item) => Boolean(item.apiId));

    console.log(`[GrelhaSync] ${items.length} de ${rawItems.length} item(s) com apiId válido`);

    if (items.length === 0) {
      console.error('[GrelhaSync] TODOS os itens foram filtrados — campo ID ausente ou vazio em todos os registos.');
      return 0;
    }

    console.log(`[GrelhaSync] IDs: ${items.slice(0, 5).map((i) => i.apiId).join(', ')}`);

    // ── 6. Upsert ─────────────────────────────────────────────────────────────
    try {
      await this.repository.upsertFromSync(tenantId, maestroId, items);
    } catch (sqlErr) {
      console.error(`[GrelhaSync] ERRO no upsert SQL:`, sqlErr);
      throw sqlErr;
    }

    console.log(`[GrelhaSync] Concluído — ${items.length} programa(s) sincronizado(s).`);
    return items.length;
  }
}
