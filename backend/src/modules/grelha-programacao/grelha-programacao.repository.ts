import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type GrelhaProgramaRecord = {
  id: string;
  tenantId: string;
  maestroId: string | null;
  apiId: string | null;
  // Campos na ordem do mapeamento Provys
  serie: string | null;
  idPrograma: string | null;
  programa: string | null;
  tipoRequisicao: string | null;   // TXREQ_ID.PROG_ID.REQTYPE_RF
  genero: string | null;
  codigoProducao: string | null;
  tipoAquisicao: string | null;
  nome: string;
  tipoPrograma: string | null;     // TXREQ_ID.PROG_ID.PROGTYPE_RF
  categoria: string | null;
  canal: string | null;
  semana: string | null;
  tipoExibicao: string | null;
  episodio: string | null;         // TXREQ_ID.PROG_ID.EPISODENR
  dataExibicao: string | null;
  horarioInicio: string | null;
  duracao: string | null;
  statusGrelha: string | null;
  // Controlo
  statusPlaneamentoId: string | null;
  statusPlaneamentoNome: string | null;
  statusPlaneamentoCor: string | null;
  prevDataExibicao: string | null;
  prevHorarioInicio: string | null;
  prevDuracao: string | null;
  prevEpisodio: string | null;
  temAlteracao: boolean;
  gravacaoId: string | null;
  gravacaoNome: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SyncGrelhaItem = {
  apiId: string;
  serie?: string | null;
  idPrograma?: string | null;
  programa?: string | null;
  tipoRequisicao?: string | null;
  genero?: string | null;
  codigoProducao?: string | null;
  tipoAquisicao?: string | null;
  nome: string;
  tipoPrograma?: string | null;
  categoria?: string | null;
  canal?: string | null;
  semana?: string | null;
  tipoExibicao?: string | null;
  episodio?: string | null;
  dataExibicao?: string | null;
  horarioInicio?: string | null;
  duracao?: string | null;
  statusGrelha?: string | null;
};

export type ListGrelhaOptions = {
  limit?: number;
  offset?: number;
  mes?: number;
  ano?: number;
  canal?: string;
};

type GrelhaRow = {
  id: string;
  tenant_id: string;
  maestro_id: string | null;
  api_id: string | null;
  serie: string | null;
  id_programa: string | null;
  programa: string | null;
  tipo_requisicao: string | null;
  genero: string | null;
  codigo_producao: string | null;
  tipo_aquisicao: string | null;
  nome: string;
  tipo_programa: string | null;
  categoria: string | null;
  canal: string | null;
  semana: string | null;
  tipo_exibicao: string | null;
  episodio: string | null;
  data_exibicao: string | null;
  horario_inicio: string | null;
  duracao: string | null;
  status_grelha: string | null;
  status_planeamento_id: string | null;
  status_planeamento_nome: string | null;
  status_planeamento_cor: string | null;
  prev_data_exibicao: string | null;
  prev_horario_inicio: string | null;
  prev_duracao: string | null;
  prev_episodio: string | null;
  tem_alteracao: boolean;
  gravacao_id: string | null;
  gravacao_nome: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

let ensurePromise: Promise<void> | null = null;

async function ensureTables() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS grelha_programa (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          maestro_id text NULL,
          api_id text NULL,
          serie text NULL,
          id_programa text NULL,
          programa text NULL,
          tipo_requisicao text NULL,
          genero text NULL,
          codigo_producao text NULL,
          tipo_aquisicao text NULL,
          nome text NOT NULL DEFAULT '',
          tipo_programa text NULL,
          categoria text NULL,
          canal text NULL,
          semana text NULL,
          tipo_exibicao text NULL,
          episodio text NULL,
          data_exibicao text NULL,
          horario_inicio text NULL,
          duracao text NULL,
          status_grelha text NULL,
          status_planeamento_id text NULL,
          prev_data_exibicao text NULL,
          prev_horario_inicio text NULL,
          prev_duracao text NULL,
          prev_episodio text NULL,
          tem_alteracao boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS grelha_programa_tenant_api_idx
        ON grelha_programa (tenant_id, api_id)
        WHERE api_id IS NOT NULL
      `);
      // Add columns that may not exist in older table versions
      for (const col of [
        `ALTER TABLE grelha_programa ADD COLUMN IF NOT EXISTS tipo_requisicao text NULL`,
        `ALTER TABLE grelha_programa ADD COLUMN IF NOT EXISTS semana text NULL`,
        `ALTER TABLE grelha_programa ADD COLUMN IF NOT EXISTS episodio text NULL`,
        `ALTER TABLE grelha_programa ADD COLUMN IF NOT EXISTS prev_episodio text NULL`,
        `ALTER TABLE grelha_programa ADD COLUMN IF NOT EXISTS gravacao_id text NULL`,
      ]) {
        await prisma.$executeRawUnsafe(col);
      }
    })().catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  await ensurePromise;
}

function mapRow(row: GrelhaRow): GrelhaProgramaRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    maestroId: row.maestro_id,
    apiId: row.api_id,
    serie: row.serie,
    idPrograma: row.id_programa,
    programa: row.programa,
    tipoRequisicao: row.tipo_requisicao,
    genero: row.genero,
    codigoProducao: row.codigo_producao,
    tipoAquisicao: row.tipo_aquisicao,
    nome: row.nome,
    tipoPrograma: row.tipo_programa,
    categoria: row.categoria,
    canal: row.canal,
    semana: row.semana,
    tipoExibicao: row.tipo_exibicao,
    episodio: row.episodio,
    dataExibicao: row.data_exibicao,
    horarioInicio: row.horario_inicio,
    duracao: row.duracao,
    statusGrelha: row.status_grelha,
    statusPlaneamentoId: row.status_planeamento_id,
    statusPlaneamentoNome: row.status_planeamento_nome,
    statusPlaneamentoCor: row.status_planeamento_cor,
    prevDataExibicao: row.prev_data_exibicao,
    prevHorarioInicio: row.prev_horario_inicio,
    prevDuracao: row.prev_duracao,
    prevEpisodio: row.prev_episodio,
    temAlteracao: row.tem_alteracao ?? false,
    gravacaoId: row.gravacao_id ?? null,
    gravacaoNome: row.gravacao_nome ?? null,
    createdAt: row.created_at?.toISOString() ?? null,
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

export class PrismaGrelhaProgramacaoRepository {
  async listByTenant(tenantId: string, opts?: ListGrelhaOptions) {
    await ensureTables();
    const take = Math.min(opts?.limit ?? 200, 500);
    const skip = opts?.offset ?? 0;

    const conditions: string[] = [`g.tenant_id = '${tenantId.replace(/'/g, "''")}'`];
    if (opts?.mes !== undefined && opts?.ano !== undefined) {
      conditions.push(`g.data_exibicao LIKE '${opts.ano}-${String(opts.mes).padStart(2, '0')}%'`);
    }
    if (opts?.canal) {
      conditions.push(`g.canal = '${opts.canal.replace(/'/g, "''")}'`);
    }
    const where = conditions.join(' AND ');

    const rows = await prisma.$queryRawUnsafe<GrelhaRow[]>(`
      SELECT
        g.*,
        sp.nome AS status_planeamento_nome,
        sp.cor  AS status_planeamento_cor,
        gr.nome AS gravacao_nome
      FROM grelha_programa g
      LEFT JOIN status_planeamento sp ON sp.id = g.status_planeamento_id
      LEFT JOIN "Gravacao" gr ON gr.id = g.gravacao_id
      WHERE ${where}
      ORDER BY g.data_exibicao ASC, g.horario_inicio ASC
      LIMIT ${take} OFFSET ${skip}
    `);

    const totals = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*)::bigint AS total FROM grelha_programa g WHERE ${where}`,
    );

    return { data: rows.map(mapRow), total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: string, tenantId: string) {
    await ensureTables();
    const rows = await prisma.$queryRaw<GrelhaRow[]>(Prisma.sql`
      SELECT g.*, sp.nome AS status_planeamento_nome, sp.cor AS status_planeamento_cor,
             gr.nome AS gravacao_nome
      FROM grelha_programa g
      LEFT JOIN status_planeamento sp ON sp.id = g.status_planeamento_id
      LEFT JOIN "Gravacao" gr ON gr.id = g.gravacao_id
      WHERE g.id = ${id} AND g.tenant_id = ${tenantId}
      LIMIT 1
    `);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async updateStatusPlaneamento(id: string, tenantId: string, statusPlaneamentoId: string | null) {
    await ensureTables();
    await prisma.$executeRaw`
      UPDATE grelha_programa
      SET status_planeamento_id = ${statusPlaneamentoId}, updated_at = NOW()
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    return this.findById(id, tenantId);
  }

  async marcarAlteracaoVista(id: string, tenantId: string) {
    await ensureTables();
    await prisma.$executeRaw`
      UPDATE grelha_programa
      SET
        tem_alteracao       = false,
        prev_data_exibicao  = data_exibicao,
        prev_horario_inicio = horario_inicio,
        prev_duracao        = duracao,
        prev_episodio       = episodio,
        updated_at          = NOW()
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
  }

  async linkGravacao(id: string, tenantId: string, gravacaoId: string | null) {
    await ensureTables();
    await prisma.$executeRaw`
      UPDATE grelha_programa
      SET gravacao_id = ${gravacaoId}, updated_at = NOW()
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    return this.findById(id, tenantId);
  }

  async unlinkGravacao(tenantId: string, gravacaoId: string) {
    await ensureTables();
    await prisma.$executeRaw`
      UPDATE grelha_programa
      SET gravacao_id = NULL, status_planeamento_id = NULL, updated_at = NOW()
      WHERE gravacao_id = ${gravacaoId} AND tenant_id = ${tenantId}
    `;
  }

  async upsertFromSync(tenantId: string, maestroId: string, items: SyncGrelhaItem[]) {
    await ensureTables();
    for (const item of items) {
      const id = randomUUID();

      await prisma.$executeRaw`
        INSERT INTO grelha_programa (
          id, tenant_id, maestro_id, api_id,
          serie, id_programa, programa, tipo_requisicao, genero, codigo_producao,
          tipo_aquisicao, nome, tipo_programa, categoria, canal, semana,
          tipo_exibicao, episodio, data_exibicao, horario_inicio, duracao, status_grelha,
          status_planeamento_id,
          prev_data_exibicao, prev_horario_inicio, prev_duracao, prev_episodio,
          tem_alteracao, created_at, updated_at
        )
        VALUES (
          ${id}, ${tenantId}, ${maestroId}, ${item.apiId ?? null},
          ${item.serie ?? null}, ${item.idPrograma ?? null}, ${item.programa ?? null},
          ${item.tipoRequisicao ?? null}, ${item.genero ?? null}, ${item.codigoProducao ?? null},
          ${item.tipoAquisicao ?? null}, ${item.nome}, ${item.tipoPrograma ?? null},
          ${item.categoria ?? null}, ${item.canal ?? null}, ${item.semana ?? null},
          ${item.tipoExibicao ?? null}, ${item.episodio ?? null}, ${item.dataExibicao ?? null},
          ${item.horarioInicio ?? null}, ${item.duracao ?? null}, ${item.statusGrelha ?? null},
          (SELECT id FROM status_planeamento WHERE tenant_id = ${tenantId} AND is_inicial = true LIMIT 1),
          ${item.dataExibicao ?? null}, ${item.horarioInicio ?? null}, ${item.duracao ?? null}, ${item.episodio ?? null},
          false, NOW(), NOW()
        )
        ON CONFLICT (tenant_id, api_id) WHERE api_id IS NOT NULL
        DO UPDATE SET
          maestro_id        = EXCLUDED.maestro_id,
          serie             = EXCLUDED.serie,
          id_programa       = EXCLUDED.id_programa,
          programa          = EXCLUDED.programa,
          tipo_requisicao   = EXCLUDED.tipo_requisicao,
          genero            = EXCLUDED.genero,
          codigo_producao   = EXCLUDED.codigo_producao,
          tipo_aquisicao    = EXCLUDED.tipo_aquisicao,
          nome              = EXCLUDED.nome,
          tipo_programa     = EXCLUDED.tipo_programa,
          categoria         = EXCLUDED.categoria,
          canal             = EXCLUDED.canal,
          semana            = EXCLUDED.semana,
          tipo_exibicao     = EXCLUDED.tipo_exibicao,
          episodio          = EXCLUDED.episodio,
          status_grelha     = EXCLUDED.status_grelha,
          status_planeamento_id = COALESCE(grelha_programa.status_planeamento_id, EXCLUDED.status_planeamento_id),
          tem_alteracao     = (
            grelha_programa.data_exibicao  IS DISTINCT FROM EXCLUDED.data_exibicao
            OR grelha_programa.horario_inicio IS DISTINCT FROM EXCLUDED.horario_inicio
            OR grelha_programa.duracao        IS DISTINCT FROM EXCLUDED.duracao
            OR grelha_programa.episodio       IS DISTINCT FROM EXCLUDED.episodio
          ),
          prev_data_exibicao  = CASE
            WHEN grelha_programa.data_exibicao IS DISTINCT FROM EXCLUDED.data_exibicao
            THEN grelha_programa.data_exibicao ELSE grelha_programa.prev_data_exibicao
          END,
          prev_horario_inicio = CASE
            WHEN grelha_programa.horario_inicio IS DISTINCT FROM EXCLUDED.horario_inicio
            THEN grelha_programa.horario_inicio ELSE grelha_programa.prev_horario_inicio
          END,
          prev_duracao        = CASE
            WHEN grelha_programa.duracao IS DISTINCT FROM EXCLUDED.duracao
            THEN grelha_programa.duracao ELSE grelha_programa.prev_duracao
          END,
          prev_episodio       = CASE
            WHEN grelha_programa.episodio IS DISTINCT FROM EXCLUDED.episodio
            THEN grelha_programa.episodio ELSE grelha_programa.prev_episodio
          END,
          data_exibicao     = EXCLUDED.data_exibicao,
          horario_inicio    = EXCLUDED.horario_inicio,
          duracao           = EXCLUDED.duracao,
          updated_at        = NOW()
      `;
    }
  }

  async remove(id: string, tenantId: string) {
    await ensureTables();
    await prisma.$executeRaw`DELETE FROM grelha_programa WHERE id = ${id} AND tenant_id = ${tenantId}`;
  }
}
