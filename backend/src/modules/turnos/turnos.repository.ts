import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type WeekdayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export type WeekdayFlags = Record<WeekdayKey, boolean>;
export type PeoplePerDay = Record<WeekdayKey, number>;

export type TurnoRecord = {
  id: string;
  tenantId: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: WeekdayFlags;
  pessoasPorDia: PeoplePerDay;
  cor: string;
  sigla: string | null;
  folgasPorSemana: number;
  folgaEspecial: string | null;
  descricao: string | null;
  diasTrabalhados: number | null;
  createdAt: Date;
  createdBy: string | null;
};

export type SaveTurnoInput = {
  id?: string;
  tenantId: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: WeekdayFlags;
  pessoasPorDia: PeoplePerDay;
  cor: string;
  sigla?: string | null;
  folgasPorSemana: number;
  folgaEspecial?: string | null;
  descricao?: string | null;
  diasTrabalhados?: number | null;
  createdBy?: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type WeekdayJson = Partial<Record<WeekdayKey, number | boolean>> | null;

type TurnoRow = {
  id: string;
  tenant_id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
  dias_semana: WeekdayJson;
  pessoas_por_dia: WeekdayJson;
  cor: string;
  sigla: string | null;
  folgas_por_semana: number;
  folga_especial: string | null;
  descricao: string | null;
  dias_trabalhados: number | null;
  created_at: Date;
  created_by: string | null;
};

export interface TurnosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<TurnoRecord>>;
  findById(id: string): Promise<TurnoRecord | null>;
  findByNome(tenantId: string, nome: string): Promise<TurnoRecord | null>;
  save(input: SaveTurnoInput): Promise<TurnoRecord>;
  remove(id: string): Promise<void>;
}

const weekdayKeys: WeekdayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const turnoSelectProjection = `
  id,
  tenant_id,
  nome,
  TO_CHAR(hora_inicio::time, 'HH24:MI:SS') AS hora_inicio,
  TO_CHAR(hora_fim::time, 'HH24:MI:SS') AS hora_fim,
  dias_semana,
  pessoas_por_dia,
  cor,
  sigla,
  folgas_por_semana,
  folga_especial,
  descricao,
  dias_trabalhados,
  created_at,
  created_by
`;

function createEmptyWeekdayFlags(): WeekdayFlags {
  return {
    dom: false,
    seg: false,
    ter: false,
    qua: false,
    qui: false,
    sex: false,
    sab: false,
  };
}

function createEmptyPeoplePerDay(): PeoplePerDay {
  return {
    dom: 0,
    seg: 0,
    ter: 0,
    qua: 0,
    qui: 0,
    sex: 0,
    sab: 0,
  };
}

function normalizeWeekdayFlags(source: WeekdayJson): WeekdayFlags {
  const target = createEmptyWeekdayFlags();

  for (const key of weekdayKeys) {
    const value = source?.[key];
    target[key] = value === true || value === 1;
  }

  return target;
}

function normalizePeoplePerDay(source: WeekdayJson): PeoplePerDay {
  const target = createEmptyPeoplePerDay();

  for (const key of weekdayKeys) {
    const value = source?.[key];
    const parsed = typeof value === 'boolean' ? Number(value) : Number(value ?? 0);
    target[key] = Number.isFinite(parsed) ? parsed : 0;
  }

  return target;
}

function serializeWeekdayFlags(source: WeekdayFlags): Record<WeekdayKey, number> {
  return {
    dom: source.dom ? 1 : 0,
    seg: source.seg ? 1 : 0,
    ter: source.ter ? 1 : 0,
    qua: source.qua ? 1 : 0,
    qui: source.qui ? 1 : 0,
    sex: source.sex ? 1 : 0,
    sab: source.sab ? 1 : 0,
  };
}

function serializePeoplePerDay(source: PeoplePerDay): Record<WeekdayKey, number> {
  return {
    dom: source.dom ?? 0,
    seg: source.seg ?? 0,
    ter: source.ter ?? 0,
    qua: source.qua ?? 0,
    qui: source.qui ?? 0,
    sex: source.sex ?? 0,
    sab: source.sab ?? 0,
  };
}

function mapTurno(row: TurnoRow): TurnoRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    nome: row.nome,
    horaInicio: row.hora_inicio,
    horaFim: row.hora_fim,
    diasSemana: normalizeWeekdayFlags(row.dias_semana),
    pessoasPorDia: normalizePeoplePerDay(row.pessoas_por_dia),
    cor: row.cor,
    sigla: row.sigla,
    folgasPorSemana: row.folgas_por_semana,
    folgaEspecial: row.folga_especial,
    descricao: row.descricao,
    diasTrabalhados: row.dias_trabalhados,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export class PrismaTurnosRepository implements TurnosRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<TurnoRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await prisma.$queryRawUnsafe<TurnoRow[]>(
      `
        SELECT
          ${turnoSelectProjection}
        FROM turnos
        WHERE tenant_id = $1
        ORDER BY nome ASC
        LIMIT $2 OFFSET $3
      `,
      tenantId,
      take,
      skip,
    );

    const totals = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `
        SELECT COUNT(*)::bigint AS total
        FROM turnos
        WHERE tenant_id = $1
      `,
      tenantId,
    );

    return {
      data: rows.map(mapTurno),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<TurnoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<TurnoRow[]>(
      `
        SELECT
          ${turnoSelectProjection}
        FROM turnos
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ? mapTurno(rows[0]) : null;
  }

  async findByNome(tenantId: string, nome: string): Promise<TurnoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRawUnsafe<TurnoRow[]>(
      `
        SELECT
          ${turnoSelectProjection}
        FROM turnos
        WHERE tenant_id = $1 AND LOWER(nome) = LOWER($2)
        LIMIT 1
      `,
      tenantId,
      nome,
    );

    return rows[0] ? mapTurno(rows[0]) : null;
  }

  async save(input: SaveTurnoInput): Promise<TurnoRecord> {
    await this.ensureTables();

    const diasSemana = JSON.stringify(serializeWeekdayFlags(input.diasSemana));
    const pessoasPorDia = JSON.stringify(serializePeoplePerDay(input.pessoasPorDia));

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<TurnoRow[]>(
        `
          UPDATE turnos
          SET
            nome = $1,
            hora_inicio = $2::time,
            hora_fim = $3::time,
            dias_semana = $4::jsonb,
            pessoas_por_dia = $5::jsonb,
            cor = $6,
            sigla = $7,
            folgas_por_semana = $8,
            folga_especial = $9,
            descricao = $10,
            dias_trabalhados = $11,
            updated_at = NOW()
          WHERE id = $12 AND tenant_id = $13
          RETURNING
            ${turnoSelectProjection}
        `,
        input.nome,
        input.horaInicio,
        input.horaFim,
        diasSemana,
        pessoasPorDia,
        input.cor,
        input.sigla ?? null,
        input.folgasPorSemana,
        input.folgaEspecial ?? null,
        input.descricao ?? null,
        input.diasTrabalhados ?? null,
        input.id,
        input.tenantId,
      );

      if (rows[0]) {
        return mapTurno(rows[0]);
      }
    }

    const id = input.id ?? randomUUID();
    const rows = await prisma.$queryRawUnsafe<TurnoRow[]>(
      `
        INSERT INTO turnos (
          id,
          tenant_id,
          nome,
          hora_inicio,
          hora_fim,
          dias_semana,
          pessoas_por_dia,
          cor,
          sigla,
          folgas_por_semana,
          folga_especial,
          descricao,
          dias_trabalhados,
          created_at,
          updated_at,
          created_by
        )
        VALUES (
          $1,
          $2,
          $3,
          $4::time,
          $5::time,
          $6::jsonb,
          $7::jsonb,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          NOW(),
          NOW(),
          $14
        )
        RETURNING
          ${turnoSelectProjection}
      `,
      id,
      input.tenantId,
      input.nome,
      input.horaInicio,
      input.horaFim,
      diasSemana,
      pessoasPorDia,
      input.cor,
      input.sigla ?? null,
      input.folgasPorSemana,
      input.folgaEspecial ?? null,
      input.descricao ?? null,
      input.diasTrabalhados ?? null,
      input.createdBy ?? null,
    );

    return mapTurno(rows[0]);
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM turnos WHERE id = $1`, id);
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS turnos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            nome text NOT NULL,
            hora_inicio time NOT NULL,
            hora_fim time NOT NULL,
            dias_semana jsonb NOT NULL DEFAULT '{}'::jsonb,
            pessoas_por_dia jsonb NOT NULL DEFAULT '{}'::jsonb,
            cor text NOT NULL DEFAULT '#3B82F6',
            sigla text NULL,
            folgas_por_semana integer NOT NULL DEFAULT 0,
            folga_especial text NULL,
            descricao text NULL,
            dias_trabalhados integer NULL,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            updated_at timestamptz NOT NULL DEFAULT NOW(),
            created_by text NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS turnos_tenant_nome_key
          ON turnos (tenant_id, LOWER(nome))
        `);

        // Ambientes locais antigos criaram estas colunas como text.
        // Forcamos o tipo time para manter compatibilidade com as queries atuais.
        await prisma.$executeRawUnsafe(`
          ALTER TABLE turnos
          ALTER COLUMN hora_inicio TYPE time
          USING hora_inicio::time
        `);

        await prisma.$executeRawUnsafe(`
          ALTER TABLE turnos
          ALTER COLUMN hora_fim TYPE time
          USING hora_fim::time
        `);
      })();
    }

    await this.ready;
  }
}
