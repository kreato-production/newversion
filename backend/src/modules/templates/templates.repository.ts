import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type AlocacaoRecurso = {
  recursoId: string;
  quantidade: number;
  de: string;
  ate: string;
};

export type TemplateAtividadeRecord = {
  id: string;
  etapaId: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
  duracaoMinutos: number;
  recursosTecnicos: AlocacaoRecurso[];
  equipamentos: AlocacaoRecurso[];
  espacos: AlocacaoRecurso[];
  ordem: number;
};

export type TemplateEtapaRecord = {
  id: string;
  templateId: string;
  nome: string;
  cor: string;
  ordem: number;
  atividades: TemplateAtividadeRecord[];
};

export type TemplateRecord = {
  id: string;
  tenantId: string;
  nome: string;
  descricao: string | null;
  estado: string;
  createdAt: Date;
  updatedAt: Date;
  etapas: TemplateEtapaRecord[];
};

export type SaveTemplateAtividadeInput = {
  nome: string;
  horaInicio: string;
  horaFim: string;
  duracaoMinutos: number;
  recursosTecnicos: AlocacaoRecurso[];
  equipamentos: AlocacaoRecurso[];
  espacos: AlocacaoRecurso[];
  ordem: number;
};

export type SaveTemplateEtapaInput = {
  nome: string;
  cor: string;
  ordem: number;
  atividades: SaveTemplateAtividadeInput[];
};

export type SaveTemplateInput = {
  id?: string;
  tenantId: string;
  nome: string;
  descricao?: string | null;
  estado?: string;
  etapas: SaveTemplateEtapaInput[];
};

type TemplateRow = {
  id: string;
  tenant_id: string;
  nome: string;
  descricao: string | null;
  estado: string | null;
  created_at: Date;
  updated_at: Date;
};

type EtapaRow = {
  id: string;
  template_id: string;
  nome: string;
  cor: string;
  ordem: number;
};

type AtividadeRow = {
  id: string;
  etapa_id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
  duracao_minutos: number;
  recursos_tecnicos: unknown;
  equipamentos: unknown;
  espacos: unknown;
  ordem: number;
};

export interface TemplatesRepository {
  listByTenant(tenantId: string): Promise<{ data: TemplateRecord[]; total: number }>;
  findById(id: string): Promise<TemplateRecord | null>;
  save(input: SaveTemplateInput): Promise<TemplateRecord>;
  remove(id: string): Promise<void>;
}

function parseAlocacoes(raw: unknown): AlocacaoRecurso[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as AlocacaoRecurso[]; } catch { return []; }
  }
  if (Array.isArray(raw)) return raw as AlocacaoRecurso[];
  return [];
}

export class PrismaTemplatesRepository implements TemplatesRepository {
  private ensureEstadoColumn = (() => {
    let done = false;
    return async () => {
      if (done) return;
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'Ativo'`,
      );
      done = true;
    };
  })();

  async listByTenant(tenantId: string) {
    await this.ensureEstadoColumn();
    const [countRows, templates] = await Promise.all([
      prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) AS count FROM "Template" WHERE "tenantId" = $1`,
        tenantId,
      ),
      prisma.$queryRawUnsafe<TemplateRow[]>(
        `SELECT id, "tenantId" AS tenant_id, nome, descricao, estado, "createdAt" AS created_at, "updatedAt" AS updated_at
         FROM "Template" WHERE "tenantId" = $1 ORDER BY nome ASC`,
        tenantId,
      ),
    ]);

    const total = Number(countRows[0]?.count ?? 0);

    if (templates.length === 0) return { total, data: [] };

    const ids = templates.map((t) => t.id);
    const etapas = await this.fetchEtapas(ids);
    const etapaIds = etapas.map((e) => e.id);
    const atividades = etapaIds.length > 0 ? await this.fetchAtividades(etapaIds) : [];

    const data = templates.map((t) => this.assemble(t, etapas, atividades));
    return { total, data };
  }

  async findById(id: string): Promise<TemplateRecord | null> {
    await this.ensureEstadoColumn();
    const rows = await prisma.$queryRawUnsafe<TemplateRow[]>(
      `SELECT id, "tenantId" AS tenant_id, nome, descricao, estado, "createdAt" AS created_at, "updatedAt" AS updated_at
       FROM "Template" WHERE id = $1`,
      id,
    );
    if (rows.length === 0) return null;

    const etapas = await this.fetchEtapas([id]);
    const etapaIds = etapas.map((e) => e.id);
    const atividades = etapaIds.length > 0 ? await this.fetchAtividades(etapaIds) : [];

    return this.assemble(rows[0], etapas, atividades);
  }

  async save(input: SaveTemplateInput): Promise<TemplateRecord> {
    const id = input.id || randomUUID();
    const now = new Date();

    await this.ensureEstadoColumn();
    const estado = input.estado ?? 'Ativo';

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Template" SET nome = $1, descricao = $2, estado = $3, "updatedAt" = $4 WHERE id = $5`,
        input.nome,
        input.descricao ?? null,
        estado,
        now,
        id,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM "TemplateEtapa" WHERE "templateId" = $1`,
        id,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Template" (id, "tenantId", nome, descricao, estado, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        id,
        input.tenantId,
        input.nome,
        input.descricao ?? null,
        estado,
        now,
        now,
      );
    }

    for (const etapa of input.etapas) {
      const etapaId = randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "TemplateEtapa" (id, "templateId", nome, cor, ordem) VALUES ($1, $2, $3, $4, $5)`,
        etapaId,
        id,
        etapa.nome,
        etapa.cor,
        etapa.ordem,
      );
      for (const atividade of etapa.atividades) {
        const atividadeId = randomUUID();
        await prisma.$executeRawUnsafe(
          `INSERT INTO "TemplateAtividade"
             (id, "etapaId", nome, "horaInicio", "horaFim", "duracaoMinutos", "recursosTecnicos", equipamentos, espacos, ordem)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10)`,
          atividadeId,
          etapaId,
          atividade.nome,
          atividade.horaInicio,
          atividade.horaFim,
          atividade.duracaoMinutos,
          JSON.stringify(atividade.recursosTecnicos),
          JSON.stringify(atividade.equipamentos),
          JSON.stringify(atividade.espacos),
          atividade.ordem,
        );
      }
    }

    const result = await this.findById(id);
    return result!;
  }

  async remove(id: string) {
    await prisma.$executeRawUnsafe(`DELETE FROM "Template" WHERE id = $1`, id);
  }

  private async fetchEtapas(templateIds: string[]): Promise<(EtapaRow & { template_id: string })[]> {
    if (templateIds.length === 0) return [];
    const placeholders = templateIds.map((_, i) => `$${i + 1}`).join(', ');
    return prisma.$queryRawUnsafe<(EtapaRow & { template_id: string })[]>(
      `SELECT id, "templateId" AS template_id, nome, cor, ordem
       FROM "TemplateEtapa" WHERE "templateId" IN (${placeholders}) ORDER BY ordem ASC`,
      ...templateIds,
    );
  }

  private async fetchAtividades(etapaIds: string[]): Promise<(AtividadeRow & { etapa_id: string })[]> {
    if (etapaIds.length === 0) return [];
    const placeholders = etapaIds.map((_, i) => `$${i + 1}`).join(', ');
    return prisma.$queryRawUnsafe<(AtividadeRow & { etapa_id: string })[]>(
      `SELECT id, "etapaId" AS etapa_id, nome, "horaInicio" AS hora_inicio, "horaFim" AS hora_fim,
              "duracaoMinutos" AS duracao_minutos,
              "recursosTecnicos" AS recursos_tecnicos,
              equipamentos, espacos, ordem
       FROM "TemplateAtividade" WHERE "etapaId" IN (${placeholders}) ORDER BY ordem ASC`,
      ...etapaIds,
    );
  }

  private assemble(
    t: TemplateRow,
    etapas: (EtapaRow & { template_id: string })[],
    atividades: (AtividadeRow & { etapa_id: string })[],
  ): TemplateRecord {
    const myEtapas = etapas.filter((e) => e.template_id === t.id);
    return {
      id: t.id,
      tenantId: t.tenant_id,
      nome: t.nome,
      descricao: t.descricao,
      estado: t.estado ?? 'Ativo',
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      etapas: myEtapas.map((e) => ({
        id: e.id,
        templateId: e.template_id,
        nome: e.nome,
        cor: e.cor,
        ordem: e.ordem,
        atividades: atividades
          .filter((a) => a.etapa_id === e.id)
          .map((a) => ({
            id: a.id,
            etapaId: a.etapa_id,
            nome: a.nome,
            horaInicio: a.hora_inicio,
            horaFim: a.hora_fim,
            duracaoMinutos: a.duracao_minutos,
            recursosTecnicos: parseAlocacoes(a.recursos_tecnicos),
            equipamentos: parseAlocacoes(a.equipamentos),
            espacos: parseAlocacoes(a.espacos),
            ordem: a.ordem,
          })),
      })),
    };
  }
}
