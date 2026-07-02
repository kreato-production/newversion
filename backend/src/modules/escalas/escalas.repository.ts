import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type EscalaColaboradorDias = Record<string, string | null>;

export type EscalaColaboradorRecord = {
  id: string;
  escalaId: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorFuncao: string | null;
  turnoId: string | null;
  turnoNome: string | null;
  turnoSigla: string | null;
  turnoCor: string | null;
  dias: EscalaColaboradorDias;
};

export type EscalaRecord = {
  id: string;
  tenantId: string;
  numerador: number;
  codigoExterno: string | null;
  titulo: string;
  equipeId: string | null;
  equipeNome: string | null;
  dataInicio: string;
  createdAt: Date;
  createdBy: string | null;
};

export type SaveEscalaInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  titulo: string;
  equipeId?: string | null;
  dataInicio: string;
  createdBy?: string | null;
};

export type EquipeOptionRecord = {
  id: string;
  descricao: string;
};

export type SaveColaboradoresInput = {
  escalaId: string;
  colaboradores: Array<{
    colaboradorId: string;
    turnoId: string | null;
    dias: EscalaColaboradorDias;
  }>;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type EscalaRow = {
  id: string;
  tenant_id: string;
  numerador: number;
  codigo_externo: string | null;
  titulo: string;
  equipe_id: string | null;
  equipe_nome: string | null;
  data_inicio: string;
  created_at: Date;
  created_by: string | null;
};

type ColaboradorRow = {
  id: string;
  escala_id: string;
  colaborador_id: string;
  colaborador_nome: string;
  colaborador_funcao: string | null;
  turno_id: string | null;
  turno_nome: string | null;
  turno_sigla: string | null;
  turno_cor: string | null;
  dias: Record<string, string | null> | null;
};

export type FuncaoOptionRecord = {
  id: string;
  nome: string;
};

export type ColaboradorOptionRecord = {
  id: string;
  nome: string;
  funcaoId: string | null;
  funcaoNome: string | null;
};

export type MapaColaboradorRecord = {
  colaboradorId: string;
  dataInicio: string; // YYYY-MM-DD
  dias: EscalaColaboradorDias;
};

export interface EscalasRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<EscalaRecord>>;
  findById(id: string): Promise<EscalaRecord | null>;
  findByTitulo(tenantId: string, titulo: string): Promise<EscalaRecord | null>;
  save(input: SaveEscalaInput): Promise<EscalaRecord>;
  remove(id: string): Promise<void>;
  listColaboradores(escalaId: string): Promise<EscalaColaboradorRecord[]>;
  saveColaboradores(input: SaveColaboradoresInput): Promise<EscalaColaboradorRecord[]>;
  listFuncoes(tenantId: string): Promise<FuncaoOptionRecord[]>;
  listColaboradoresByFuncao(tenantId: string, funcaoId: string): Promise<ColaboradorOptionRecord[]>;
  listEquipes(tenantId: string): Promise<EquipeOptionRecord[]>;
  listColaboradoresByEquipe(tenantId: string, equipeId: string): Promise<ColaboradorOptionRecord[]>;
  listMapaByMonth(tenantId: string, year: number, month: number): Promise<MapaColaboradorRecord[]>;
}

function mapEscala(row: EscalaRow): EscalaRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    numerador: Number(row.numerador),
    codigoExterno: row.codigo_externo,
    titulo: row.titulo,
    equipeId: row.equipe_id,
    equipeNome: row.equipe_nome,
    dataInicio: typeof row.data_inicio === 'string'
      ? row.data_inicio.slice(0, 10)
      : new Date(row.data_inicio).toISOString().slice(0, 10),
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapColaborador(row: ColaboradorRow): EscalaColaboradorRecord {
  return {
    id: row.id,
    escalaId: row.escala_id,
    colaboradorId: row.colaborador_id,
    colaboradorNome: row.colaborador_nome,
    colaboradorFuncao: row.colaborador_funcao,
    turnoId: row.turno_id,
    turnoNome: row.turno_nome,
    turnoSigla: row.turno_sigla,
    turnoCor: row.turno_cor,
    dias: row.dias ?? {},
  };
}

const escalaSelectProjection = `
  e.id,
  e.tenant_id,
  e.numerador,
  e.codigo_externo,
  e.titulo,
  e.equipe_id,
  eq.descricao AS equipe_nome,
  TO_CHAR(e.data_inicio, 'YYYY-MM-DD') AS data_inicio,
  e.created_at,
  e.created_by
`;

export class PrismaEscalasRepository implements EscalasRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<EscalaRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await prisma.$queryRawUnsafe<EscalaRow[]>(
      `
        SELECT ${escalaSelectProjection}
        FROM escalas e
        LEFT JOIN "Equipe" eq ON eq.id = e.equipe_id
        WHERE e.tenant_id = $1
        ORDER BY e.numerador ASC
        LIMIT $2 OFFSET $3
      `,
      tenantId,
      take,
      skip,
    );

    const totals = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*)::bigint AS total FROM escalas WHERE tenant_id = $1`,
      tenantId,
    );

    return {
      data: rows.map(mapEscala),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<EscalaRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<EscalaRow[]>(
      `
        SELECT ${escalaSelectProjection}
        FROM escalas e
        LEFT JOIN "Equipe" eq ON eq.id = e.equipe_id
        WHERE e.id = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ? mapEscala(rows[0]) : null;
  }

  async findByTitulo(tenantId: string, titulo: string): Promise<EscalaRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<EscalaRow[]>(
      `
        SELECT ${escalaSelectProjection}
        FROM escalas e
        LEFT JOIN "Equipe" eq ON eq.id = e.equipe_id
        WHERE e.tenant_id = $1 AND LOWER(e.titulo) = LOWER($2)
        LIMIT 1
      `,
      tenantId,
      titulo,
    );

    return rows[0] ? mapEscala(rows[0]) : null;
  }

  async save(input: SaveEscalaInput): Promise<EscalaRecord> {
    await this.ensureTables();

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<EscalaRow[]>(
        `
          UPDATE escalas
          SET
            codigo_externo = $1,
            titulo = $2,
            equipe_id = $3,
            data_inicio = $4::date,
            updated_at = NOW()
          WHERE id = $5 AND tenant_id = $6
          RETURNING
            id, tenant_id, numerador, codigo_externo, titulo,
            equipe_id, NULL::text AS equipe_nome,
            TO_CHAR(data_inicio, 'YYYY-MM-DD') AS data_inicio,
            created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.titulo,
        input.equipeId ?? null,
        input.dataInicio,
        input.id,
        input.tenantId,
      );

      if (rows[0]) {
        // Re-fetch to get funcao nome
        return (await this.findById(rows[0].id))!;
      }
    }

    const id = randomUUID();

    // Compute next numerador for tenant
    const nextRows = await prisma.$queryRawUnsafe<Array<{ next_num: number }>>(
      `SELECT COALESCE(MAX(numerador), 0) + 1 AS next_num FROM escalas WHERE tenant_id = $1`,
      input.tenantId,
    );
    const numerador = nextRows[0]?.next_num ?? 1;

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO escalas (
          id, tenant_id, numerador, codigo_externo, titulo,
          equipe_id, data_inicio, created_at, updated_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::date, NOW(), NOW(), $8)
      `,
      id,
      input.tenantId,
      numerador,
      input.codigoExterno ?? null,
      input.titulo,
      input.equipeId ?? null,
      input.dataInicio,
      input.createdBy ?? null,
    );

    return (await this.findById(id))!;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM escalas WHERE id = $1`, id);
  }

  async listColaboradores(escalaId: string): Promise<EscalaColaboradorRecord[]> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<ColaboradorRow[]>(
      `
        SELECT
          ec.id,
          ec.escala_id,
          ec.colaborador_id,
          CONCAT(rh.nome, ' ', rh.sobrenome) AS colaborador_nome,
          f.nome AS colaborador_funcao,
          ec.turno_id,
          t.nome AS turno_nome,
          t.sigla AS turno_sigla,
          t.cor AS turno_cor,
          ec.dias
        FROM escala_colaboradores ec
        LEFT JOIN recursos_humanos rh ON rh.id = ec.colaborador_id
        LEFT JOIN funcoes f ON f.id = rh.funcao_id
        LEFT JOIN turnos t ON t.id = ec.turno_id
        WHERE ec.escala_id = $1
        ORDER BY colaborador_nome ASC
      `,
      escalaId,
    );

    return rows.map(mapColaborador);
  }

  async saveColaboradores(input: SaveColaboradoresInput): Promise<EscalaColaboradorRecord[]> {
    await this.ensureTables();

    // Delete existing
    await prisma.$executeRawUnsafe(
      `DELETE FROM escala_colaboradores WHERE escala_id = $1`,
      input.escalaId,
    );

    // Insert new
    for (const colab of input.colaboradores) {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO escala_colaboradores (id, escala_id, colaborador_id, turno_id, dias, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
        `,
        randomUUID(),
        input.escalaId,
        colab.colaboradorId,
        colab.turnoId ?? null,
        JSON.stringify(colab.dias),
      );
    }

    return this.listColaboradores(input.escalaId);
  }

  async listEquipes(tenantId: string): Promise<EquipeOptionRecord[]> {
    await this.ensureTables();
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; descricao: string }>>(
      `SELECT id, descricao FROM "Equipe" WHERE "tenantId" = $1 ORDER BY descricao ASC`,
      tenantId,
    );
    return rows.map((r) => ({ id: r.id, descricao: r.descricao }));
  }

  async listColaboradoresByEquipe(tenantId: string, equipeId: string): Promise<ColaboradorOptionRecord[]> {
    await this.ensureTables();
    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      nome: string;
      funcao_id: string | null;
      funcao_nome: string | null;
    }>>(
      `SELECT
         rh.id,
         CONCAT(rh.nome, ' ', COALESCE(rh.sobrenome, '')) AS nome,
         rh.funcao_id,
         f.nome AS funcao_nome
       FROM usuario_equipes ue
       JOIN recursos_humanos rh ON rh.id = ue.usuario_id
       LEFT JOIN funcoes f ON f.id = rh.funcao_id
       WHERE ue.equipe_id = $1 AND rh.tenant_id = $2
       ORDER BY rh.nome, rh.sobrenome ASC`,
      equipeId,
      tenantId,
    );
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      funcaoId: r.funcao_id,
      funcaoNome: r.funcao_nome,
    }));
  }

  async listFuncoes(tenantId: string): Promise<FuncaoOptionRecord[]> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; nome: string }>>(
      `SELECT id, nome FROM funcoes WHERE tenant_id = $1 ORDER BY nome ASC`,
      tenantId,
    );

    return rows.map((row) => ({ id: row.id, nome: row.nome }));
  }

  async listColaboradoresByFuncao(tenantId: string, funcaoId: string): Promise<ColaboradorOptionRecord[]> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<Array<{
      id: string;
      nome: string;
      funcao_id: string | null;
      funcao_nome: string | null;
    }>>(
      `
        SELECT
          rh.id,
          CONCAT(rh.nome, ' ', rh.sobrenome) AS nome,
          rh.funcao_id,
          f.nome AS funcao_nome
        FROM recursos_humanos rh
        LEFT JOIN funcoes f ON f.id = rh.funcao_id
        WHERE rh.tenant_id = $1 AND rh.funcao_id = $2
        ORDER BY rh.nome, rh.sobrenome ASC
      `,
      tenantId,
      funcaoId,
    );

    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      funcaoId: row.funcao_id,
      funcaoNome: row.funcao_nome,
    }));
  }

  async listMapaByMonth(tenantId: string, year: number, month: number): Promise<MapaColaboradorRecord[]> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<Array<{
      colaborador_id: string;
      data_inicio: Date | string;
      dias: EscalaColaboradorDias | null;
    }>>(
      `SELECT ec.colaborador_id, e.data_inicio, ec.dias
       FROM escala_colaboradores ec
       JOIN escalas e ON e.id = ec.escala_id
       WHERE e.tenant_id = $1
         AND EXTRACT(YEAR FROM e.data_inicio) = $2
         AND EXTRACT(MONTH FROM e.data_inicio) = $3`,
      tenantId,
      year,
      month,
    );

    return rows.map((row) => ({
      colaboradorId: row.colaborador_id,
      dataInicio: typeof row.data_inicio === 'string'
        ? row.data_inicio.slice(0, 10)
        : (row.data_inicio as Date).toISOString().slice(0, 10),
      dias: row.dias ?? {},
    }));
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS escalas (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            numerador integer NOT NULL DEFAULT 0,
            codigo_externo text NULL,
            titulo text NOT NULL,
            grupo_funcao_id text NULL,
            equipe_id text NULL,
            data_inicio date NOT NULL DEFAULT CURRENT_DATE,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            updated_at timestamptz NOT NULL DEFAULT NOW(),
            created_by text NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS escala_colaboradores (
            id text PRIMARY KEY,
            escala_id text NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
            colaborador_id text NOT NULL,
            turno_id text NULL,
            dias jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            updated_at timestamptz NOT NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          ALTER TABLE escalas ADD COLUMN IF NOT EXISTS equipe_id text NULL
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS escalas_tenant_titulo_key
          ON escalas (tenant_id, LOWER(titulo))
        `);
      })().catch((err) => {
        this.ready = null;
        throw err;
      });
    }

    await this.ready;
  }
}
