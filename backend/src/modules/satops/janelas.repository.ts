import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JanelaResponsavelRecord = {
  id: string;
  recursoTecnicoId: string | null;
  recursoTecnicoNome: string | null;
  recursoHumanoId: string | null;
  recursoHumanoNome: string | null;
  telefone: string | null;
  email: string | null;
  foto: string | null;
  disponibilidade: string | null;
};

export type JanelaRecord = {
  id: string;
  tenantId: string;
  sateliteId: string | null;
  sateliteNome: string | null;
  dataEvento: string | null;
  tipoEvento: string | null;
  canal: string | null;
  tituloEvento: string | null;
  programaId: string | null;
  programaNome: string | null;
  aberturaPrevia: string | null;
  aberturaReal: string | null;
  confirmacaoNocId: string | null;
  confirmacaoNocNome: string | null;
  fechoPrevisto: string | null;
  fechoReal: string | null;
  responsaveis: JanelaResponsavelRecord[] | null;
  checklist: unknown | null;
  simulacao: boolean | null;
  createdAt: Date | null;
  createdBy: string | null;
};

export type CanalRecord = string;

export type ProgramaRecord = {
  id: string;
  nome: string;
  programa: string | null;
  idPrograma: string | null;
  episodio: string | null;
  horarioInicio: string | null;
};

export type SaveJanelaInput = {
  id?: string;
  tenantId: string;
  sateliteId?: string | null;
  sateliteNome?: string | null;
  dataEvento?: string | null;
  tipoEvento?: string | null;
  canal?: string | null;
  tituloEvento?: string | null;
  programaId?: string | null;
  programaNome?: string | null;
  aberturaPrevia?: string | null;
  aberturaReal?: string | null;
  confirmacaoNocId?: string | null;
  confirmacaoNocNome?: string | null;
  fechoPrevisto?: string | null;
  fechoReal?: string | null;
  responsaveis?: JanelaResponsavelRecord[] | null;
  checklist?: unknown | null;
  simulacao?: boolean | null;
  createdBy?: string | null;
};

// ─── Row types ────────────────────────────────────────────────────────────────

type JanelaRow = {
  id: string;
  tenant_id: string;
  satelite_id: string | null;
  satelite_nome: string | null;
  data_evento: string | null;
  tipo_evento: string | null;
  canal: string | null;
  titulo_evento: string | null;
  programa_id: string | null;
  programa_nome: string | null;
  abertura_previa: string | null;
  abertura_real: string | null;
  confirmacao_noc_id: string | null;
  confirmacao_noc_nome: string | null;
  fecho_previsto: string | null;
  fecho_real: string | null;
  responsaveis: JanelaResponsavelRecord[] | null;
  checklist: unknown | null;
  simulacao: boolean | null;
  created_at: Date | null;
  created_by: string | null;
};

type GrelhaRow = {
  id: string;
  nome: string;
  programa: string | null;
  id_programa: string | null;
  episodio: string | null;
  horario_inicio: string | null;
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface JanelasRepository {
  listByTenant(tenantId: string): Promise<{ data: JanelaRecord[]; total: number }>;
  findById(id: string, tenantId: string): Promise<JanelaRecord | null>;
  save(input: SaveJanelaInput): Promise<JanelaRecord>;
  remove(id: string, tenantId: string): Promise<void>;
  listCanais(tenantId: string): Promise<string[]>;
  listProgramas(tenantId: string, canal: string, data: string): Promise<ProgramaRecord[]>;
}

// ─── Table setup ──────────────────────────────────────────────────────────────

let ensurePromise: Promise<void> | null = null;

async function ensureTables() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS satops_janelas (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          satelite_id text NULL,
          satelite_nome text NULL,
          data_evento text NULL,
          tipo_evento text NULL,
          canal text NULL,
          titulo_evento text NULL,
          programa_id text NULL,
          programa_nome text NULL,
          abertura_previa text NULL,
          abertura_real text NULL,
          confirmacao_noc_id text NULL,
          confirmacao_noc_nome text NULL,
          fecho_previsto text NULL,
          fecho_real text NULL,
          responsaveis jsonb NULL,
          checklist jsonb NULL,
          simulacao boolean NOT NULL DEFAULT false,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(
        `ALTER TABLE satops_janelas ADD COLUMN IF NOT EXISTS checklist jsonb NULL`,
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE satops_janelas ADD COLUMN IF NOT EXISTS simulacao boolean NOT NULL DEFAULT false`,
      );
    })();
  }
  return ensurePromise;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function rowToJanela(row: JanelaRow): JanelaRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    sateliteId: row.satelite_id,
    sateliteNome: row.satelite_nome,
    dataEvento: row.data_evento,
    tipoEvento: row.tipo_evento,
    canal: row.canal,
    tituloEvento: row.titulo_evento,
    programaId: row.programa_id,
    programaNome: row.programa_nome,
    aberturaPrevia: row.abertura_previa,
    aberturaReal: row.abertura_real,
    confirmacaoNocId: row.confirmacao_noc_id,
    confirmacaoNocNome: row.confirmacao_noc_nome,
    fechoPrevisto: row.fecho_previsto,
    fechoReal: row.fecho_real,
    responsaveis: row.responsaveis ?? null,
    checklist: row.checklist ?? null,
    simulacao: row.simulacao ?? false,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class PrismaJanelasRepository implements JanelasRepository {
  async listByTenant(tenantId: string): Promise<{ data: JanelaRecord[]; total: number }> {
    await ensureTables();
    const [countRows, rows] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: string }]>(
        `SELECT COUNT(*) as count FROM satops_janelas WHERE tenant_id = $1`,
        tenantId,
      ),
      prisma.$queryRawUnsafe<JanelaRow[]>(
        `SELECT * FROM satops_janelas WHERE tenant_id = $1 ORDER BY data_evento DESC, created_at DESC`,
        tenantId,
      ),
    ]);
    return {
      total: parseInt(countRows[0]?.count ?? '0', 10),
      data: rows.map(rowToJanela),
    };
  }

  async findById(id: string, tenantId: string): Promise<JanelaRecord | null> {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<JanelaRow[]>(
      `SELECT * FROM satops_janelas WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
    return rows[0] ? rowToJanela(rows[0]) : null;
  }

  async save(input: SaveJanelaInput): Promise<JanelaRecord> {
    await ensureTables();
    const id = input.id ?? randomUUID();
    const responsaveisJson = input.responsaveis != null ? JSON.stringify(input.responsaveis) : null;
    const checklistJson    = input.checklist    != null ? JSON.stringify(input.checklist)    : null;

    if (input.id) {
      await prisma.$executeRawUnsafe(
        `UPDATE satops_janelas
         SET satelite_id = $1, satelite_nome = $2, data_evento = $3, tipo_evento = $4,
             canal = $5, titulo_evento = $6, programa_id = $7, programa_nome = $8,
             abertura_previa = $9, abertura_real = $10, confirmacao_noc_id = $11,
             confirmacao_noc_nome = $12, fecho_previsto = $13, fecho_real = $14,
             responsaveis = $15::jsonb, checklist = $16::jsonb, simulacao = $17, updated_at = NOW()
         WHERE id = $18 AND tenant_id = $19`,
        input.sateliteId ?? null,
        input.sateliteNome ?? null,
        input.dataEvento ?? null,
        input.tipoEvento ?? null,
        input.canal ?? null,
        input.tituloEvento ?? null,
        input.programaId ?? null,
        input.programaNome ?? null,
        input.aberturaPrevia ?? null,
        input.aberturaReal ?? null,
        input.confirmacaoNocId ?? null,
        input.confirmacaoNocNome ?? null,
        input.fechoPrevisto ?? null,
        input.fechoReal ?? null,
        responsaveisJson,
        checklistJson,
        input.simulacao ?? false,
        id,
        input.tenantId,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO satops_janelas
         (id, tenant_id, satelite_id, satelite_nome, data_evento, tipo_evento,
          canal, titulo_evento, programa_id, programa_nome,
          abertura_previa, abertura_real, confirmacao_noc_id, confirmacao_noc_nome,
          fecho_previsto, fecho_real, responsaveis, checklist, simulacao, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb, $19, $20)`,
        id,
        input.tenantId,
        input.sateliteId ?? null,
        input.sateliteNome ?? null,
        input.dataEvento ?? null,
        input.tipoEvento ?? null,
        input.canal ?? null,
        input.tituloEvento ?? null,
        input.programaId ?? null,
        input.programaNome ?? null,
        input.aberturaPrevia ?? null,
        input.aberturaReal ?? null,
        input.confirmacaoNocId ?? null,
        input.confirmacaoNocNome ?? null,
        input.fechoPrevisto ?? null,
        input.fechoReal ?? null,
        responsaveisJson,
        checklistJson,
        input.simulacao ?? false,
        input.createdBy ?? null,
      );
    }

    const record = await this.findById(id, input.tenantId);
    if (!record) throw new Error('Janela não encontrada após salvar');
    return record;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await ensureTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM satops_janelas WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
  }

  async listCanais(tenantId: string): Promise<string[]> {
    const rows = await prisma.$queryRawUnsafe<[{ canal: string }]>(
      `SELECT DISTINCT canal FROM grelha_programa WHERE tenant_id = $1 AND canal IS NOT NULL ORDER BY canal ASC`,
      tenantId,
    );
    return (rows as { canal: string }[]).map((r) => r.canal);
  }

  async listProgramas(tenantId: string, canal: string, data: string): Promise<ProgramaRecord[]> {
    const rows = await prisma.$queryRawUnsafe<GrelhaRow[]>(
      `SELECT id, nome, programa, id_programa, episodio, horario_inicio
       FROM grelha_programa
       WHERE tenant_id = $1 AND canal = $2 AND data_exibicao = $3
       ORDER BY horario_inicio ASC`,
      tenantId,
      canal,
      data,
    );
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      programa: r.programa,
      idPrograma: r.id_programa,
      episodio: r.episodio,
      horarioInicio: r.horario_inicio,
    }));
  }
}
