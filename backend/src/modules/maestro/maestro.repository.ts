import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type MaestroRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  cor: string | null;
  status: 'Ativo' | 'Inativo';
  tipo: string;
  modulo: string | null;
  descricao: string | null;
  endpoint: string | null;
  authTipo: string | null;
  authUsuario: string | null;
  authSenha: string | null;
  jsonChamada: string | null;
  jsonLinguagem: string | null;
  esquemaTipo: string | null;
  esquemaDataInicio: string | null;
  esquemaHoraInicio: string | null;
  esquemaDias: number | null;
  esquemaDiasSemana: number[];
  ultimaExecucao: Date | null;
  createdAt: Date | null;
  createdBy: string | null;
  createdByNome: string | null;
};

export type SaveMaestroInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  cor?: string | null;
  status: 'Ativo' | 'Inativo';
  tipo: string;
  modulo?: string | null;
  descricao?: string | null;
  endpoint?: string | null;
  authTipo?: string | null;
  authUsuario?: string | null;
  authSenha?: string | null;
  jsonChamada?: string | null;
  jsonLinguagem?: string | null;
  esquemaTipo?: string | null;
  esquemaDataInicio?: string | null;
  esquemaHoraInicio?: string | null;
  esquemaDias?: number | null;
  esquemaDiasSemana?: number[];
  createdBy?: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type MaestroRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  cor: string | null;
  status: string;
  tipo: string;
  modulo: string | null;
  descricao: string | null;
  endpoint: string | null;
  auth_tipo: string | null;
  auth_usuario: string | null;
  auth_senha: string | null;
  json_chamada: string | null;
  json_linguagem: string | null;
  esquema_tipo: string | null;
  esquema_data_inicio: string | null;
  esquema_hora_inicio: string | null;
  esquema_dias: number | null;
  esquema_dias_semana: unknown;
  ultima_execucao: Date | null;
  created_at: Date | null;
  created_by: string | null;
  created_by_nome: string | null;
};

function parseDiasSemana(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapRow(row: MaestroRow): MaestroRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    nome: row.nome,
    cor: row.cor,
    status: (row.status as 'Ativo' | 'Inativo') || 'Ativo',
    tipo: row.tipo,
    modulo: row.modulo,
    descricao: row.descricao,
    endpoint: row.endpoint,
    authTipo: row.auth_tipo,
    authUsuario: row.auth_usuario,
    authSenha: row.auth_senha,
    jsonChamada: row.json_chamada,
    jsonLinguagem: row.json_linguagem,
    esquemaTipo: row.esquema_tipo,
    esquemaDataInicio: row.esquema_data_inicio,
    esquemaHoraInicio: row.esquema_hora_inicio,
    esquemaDias: row.esquema_dias !== null ? Number(row.esquema_dias) : null,
    esquemaDiasSemana: parseDiasSemana(row.esquema_dias_semana),
    ultimaExecucao: row.ultima_execucao,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByNome: row.created_by_nome,
  };
}

export interface MaestroRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<MaestroRecord>>;
  listScheduled(): Promise<MaestroRecord[]>;
  findById(id: string, tenantId: string): Promise<MaestroRecord | null>;
  save(input: SaveMaestroInput): Promise<MaestroRecord>;
  remove(id: string, tenantId: string): Promise<void>;
  updateUltimaExecucao(id: string, tenantId: string): Promise<MaestroRecord>;
}

export class PrismaMaestroRepository implements MaestroRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<MaestroRecord>> {
    await this.ensureTables();
    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await prisma.$queryRaw<MaestroRow[]>(Prisma.sql`
      SELECT
        m.id,
        m.tenant_id,
        m.codigo_externo,
        m.nome,
        m.cor,
        m.status,
        m.tipo,
        m.modulo,
        m.descricao,
        m.endpoint,
        m.auth_tipo,
        m.auth_usuario,
        m.auth_senha,
        m.json_chamada,
        m.json_linguagem,
        m.esquema_tipo,
        m.esquema_data_inicio,
        m.esquema_hora_inicio,
        m.esquema_dias,
        m.esquema_dias_semana,
        m.ultima_execucao,
        m.created_at,
        m.created_by,
        u.nome AS created_by_nome
      FROM maestro m
      LEFT JOIN "User" u ON u.id = m.created_by
      WHERE m.tenant_id = ${tenantId}
      ORDER BY m.nome ASC
      LIMIT ${take} OFFSET ${skip}
    `);

    const totals = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total FROM maestro WHERE tenant_id = ${tenantId}
    `);

    return { data: rows.map(mapRow), total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: string, tenantId: string): Promise<MaestroRecord | null> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<MaestroRow[]>(Prisma.sql`
      SELECT
        m.id,
        m.tenant_id,
        m.codigo_externo,
        m.nome,
        m.cor,
        m.status,
        m.tipo,
        m.modulo,
        m.descricao,
        m.endpoint,
        m.auth_tipo,
        m.auth_usuario,
        m.auth_senha,
        m.json_chamada,
        m.json_linguagem,
        m.esquema_tipo,
        m.esquema_data_inicio,
        m.esquema_hora_inicio,
        m.esquema_dias,
        m.esquema_dias_semana,
        m.ultima_execucao,
        m.created_at,
        m.created_by,
        u.nome AS created_by_nome
      FROM maestro m
      LEFT JOIN "User" u ON u.id = m.created_by
      WHERE m.id = ${id} AND m.tenant_id = ${tenantId}
      LIMIT 1
    `);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async save(input: SaveMaestroInput): Promise<MaestroRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();
    const diasSemana = JSON.stringify(input.esquemaDiasSemana ?? []);

    if (input.id) {
      await prisma.$executeRaw`
        UPDATE maestro SET
          codigo_externo   = ${input.codigoExterno ?? null},
          nome             = ${input.nome},
          cor              = ${input.cor ?? null},
          status           = ${input.status},
          tipo             = ${input.tipo},
          modulo           = ${input.modulo ?? null},
          descricao        = ${input.descricao ?? null},
          endpoint         = ${input.endpoint ?? null},
          auth_tipo        = ${input.authTipo ?? null},
          auth_usuario     = ${input.authUsuario ?? null},
          auth_senha       = ${input.authSenha ?? null},
          json_chamada     = ${input.jsonChamada ?? null},
          json_linguagem   = ${input.jsonLinguagem ?? null},
          esquema_tipo     = ${input.esquemaTipo ?? null},
          esquema_data_inicio = ${input.esquemaDataInicio ?? null},
          esquema_hora_inicio = ${input.esquemaHoraInicio ?? null},
          esquema_dias     = ${input.esquemaDias ?? null},
          esquema_dias_semana = ${diasSemana}::jsonb,
          updated_at       = NOW()
        WHERE id = ${id} AND tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO maestro (
          id, tenant_id, codigo_externo, nome, cor, status, tipo, modulo,
          descricao, endpoint, auth_tipo, auth_usuario, auth_senha,
          json_chamada, json_linguagem,
          esquema_tipo, esquema_data_inicio, esquema_hora_inicio,
          esquema_dias, esquema_dias_semana,
          created_at, updated_at, created_by
        ) VALUES (
          ${id}, ${input.tenantId}, ${input.codigoExterno ?? null},
          ${input.nome}, ${input.cor ?? null}, ${input.status}, ${input.tipo}, ${input.modulo ?? null},
          ${input.descricao ?? null},
          ${input.endpoint ?? null}, ${input.authTipo ?? null},
          ${input.authUsuario ?? null}, ${input.authSenha ?? null},
          ${input.jsonChamada ?? null}, ${input.jsonLinguagem ?? null},
          ${input.esquemaTipo ?? null}, ${input.esquemaDataInicio ?? null}, ${input.esquemaHoraInicio ?? null},
          ${input.esquemaDias ?? null}, ${diasSemana}::jsonb,
          NOW(), NOW(), ${input.createdBy ?? null}
        )
      `;
    }

    const saved = await this.findById(id, input.tenantId);
    if (!saved) throw new Error('Erro ao salvar maestro');
    return saved;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM maestro WHERE id = ${id} AND tenant_id = ${tenantId}`;
  }

  async listScheduled(): Promise<MaestroRecord[]> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<MaestroRow[]>(Prisma.sql`
      SELECT
        m.id, m.tenant_id, m.codigo_externo, m.nome, m.cor, m.status, m.tipo,
        m.descricao, m.endpoint, m.auth_tipo, m.auth_usuario, m.auth_senha,
        m.json_chamada, m.json_linguagem,
        m.esquema_tipo, m.esquema_data_inicio, m.esquema_hora_inicio,
        m.esquema_dias, m.esquema_dias_semana, m.ultima_execucao,
        m.created_at, m.created_by,
        u.nome AS created_by_nome
      FROM maestro m
      LEFT JOIN "User" u ON u.id = m.created_by
      WHERE m.status = 'Ativo'
        AND m.esquema_tipo IS NOT NULL
        AND m.esquema_hora_inicio IS NOT NULL
    `);
    return rows.map(mapRow);
  }

  async updateUltimaExecucao(id: string, tenantId: string): Promise<MaestroRecord> {
    await this.ensureTables();
    await prisma.$executeRaw`
      UPDATE maestro SET ultima_execucao = NOW(), updated_at = NOW()
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    const record = await this.findById(id, tenantId);
    if (!record) throw new Error('Maestro não encontrado após atualização');
    return record;
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS maestro (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            nome text NOT NULL DEFAULT '',
            cor text NULL,
            status text NOT NULL DEFAULT 'Ativo',
            tipo text NOT NULL DEFAULT 'Provys - API Rest',
            descricao text NULL,
            json_chamada text NULL,
            json_linguagem text NULL,
            esquema_tipo text NULL,
            esquema_data_inicio text NULL,
            esquema_hora_inicio text NULL,
            esquema_dias integer NULL,
            esquema_dias_semana jsonb NOT NULL DEFAULT '[]',
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);
        await prisma.$executeRawUnsafe(`ALTER TABLE maestro ADD COLUMN IF NOT EXISTS modulo text NULL`);
        await prisma.$executeRawUnsafe(`ALTER TABLE maestro ADD COLUMN IF NOT EXISTS ultima_execucao timestamptz NULL`);
        await prisma.$executeRawUnsafe(`ALTER TABLE maestro ADD COLUMN IF NOT EXISTS endpoint text NULL`);
        await prisma.$executeRawUnsafe(`ALTER TABLE maestro ADD COLUMN IF NOT EXISTS auth_tipo text NULL DEFAULT 'No Auth'`);
        await prisma.$executeRawUnsafe(`ALTER TABLE maestro ADD COLUMN IF NOT EXISTS auth_usuario text NULL`);
        await prisma.$executeRawUnsafe(`ALTER TABLE maestro ADD COLUMN IF NOT EXISTS auth_senha text NULL`);
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS maestro_tenant_nome_idx ON maestro (tenant_id, nome)
        `);
      })().catch((err) => {
        this.ready = null;
        throw err;
      });
    }
    await this.ready;
  }
}
