import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type IncidenciaGravacaoRecord = {
  id: string;
  tenantId: string;
  codigo_externo: string | null;
  titulo: string;
  gravacao_id: string | null;
  recurso_fisico_id: string | null;
  severidade_id: string | null;
  impacto_id: string | null;
  categoria_id: string | null;
  classificacao_id: string | null;
  data_incidencia: string | null;
  horario_incidencia: string | null;
  tempo_incidencia: string | null;
  descricao: string | null;
  causa_provavel: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type IncidenciaAnexoRecord = {
  id: string;
  incidencia_id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  created_at: string | null;
};

export type SaveIncidenciaGravacaoInput = Omit<IncidenciaGravacaoRecord, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type SaveIncidenciaAnexoInput = {
  incidencia_id: string;
  tenant_id: string;
  nome: string;
  url: string;
  tipo?: string | null;
  tamanho?: number | null;
  created_by?: string | null;
};

type IncidenciaRow = IncidenciaGravacaoRecord;
type IncidenciaAnexoRow = IncidenciaAnexoRecord;

export interface IncidenciasGravacaoRepository {
  listByTenant(tenantId: string): Promise<IncidenciaGravacaoRecord[]>;
  listByGravacao(tenantId: string, gravacaoId: string): Promise<IncidenciaGravacaoRecord[]>;
  findById(id: string): Promise<IncidenciaGravacaoRecord | null>;
  save(input: SaveIncidenciaGravacaoInput): Promise<IncidenciaGravacaoRecord>;
  remove(id: string): Promise<void>;
  listAnexos(incidenciaId: string): Promise<IncidenciaAnexoRecord[]>;
  addAnexo(input: SaveIncidenciaAnexoInput): Promise<IncidenciaAnexoRecord>;
  removeAnexo(id: string): Promise<void>;
}

export class PrismaIncidenciasGravacaoRepository implements IncidenciasGravacaoRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string): Promise<IncidenciaGravacaoRecord[]> {
    await this.ensureTables();
    return prisma.$queryRaw<IncidenciaRow[]>`
      SELECT
        id,
        tenant_id AS "tenantId",
        codigo_externo,
        titulo,
        gravacao_id,
        recurso_fisico_id,
        severidade_id,
        impacto_id,
        categoria_id,
        classificacao_id,
        to_char(data_incidencia, 'YYYY-MM-DD') AS data_incidencia,
        horario_incidencia,
        tempo_incidencia,
        descricao,
        causa_provavel,
        created_by,
        to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS created_at,
        to_char(updated_at, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS updated_at
      FROM incidencias_gravacao
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC, id DESC
    `;
  }

  async listByGravacao(tenantId: string, gravacaoId: string): Promise<IncidenciaGravacaoRecord[]> {
    await this.ensureTables();
    return prisma.$queryRaw<IncidenciaRow[]>`
      SELECT
        id,
        tenant_id AS "tenantId",
        codigo_externo,
        titulo,
        gravacao_id,
        recurso_fisico_id,
        severidade_id,
        impacto_id,
        categoria_id,
        classificacao_id,
        to_char(data_incidencia, 'YYYY-MM-DD') AS data_incidencia,
        horario_incidencia,
        tempo_incidencia,
        descricao,
        causa_provavel,
        created_by,
        to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS created_at,
        to_char(updated_at, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS updated_at
      FROM incidencias_gravacao
      WHERE tenant_id = ${tenantId}
        AND gravacao_id = ${gravacaoId}
      ORDER BY created_at DESC, id DESC
    `;
  }

  async findById(id: string): Promise<IncidenciaGravacaoRecord | null> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<IncidenciaRow[]>`
      SELECT
        id,
        tenant_id AS "tenantId",
        codigo_externo,
        titulo,
        gravacao_id,
        recurso_fisico_id,
        severidade_id,
        impacto_id,
        categoria_id,
        classificacao_id,
        to_char(data_incidencia, 'YYYY-MM-DD') AS data_incidencia,
        horario_incidencia,
        tempo_incidencia,
        descricao,
        causa_provavel,
        created_by,
        to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS created_at,
        to_char(updated_at, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS updated_at
      FROM incidencias_gravacao
      WHERE id = ${id}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async save(input: SaveIncidenciaGravacaoInput): Promise<IncidenciaGravacaoRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRaw`
        UPDATE incidencias_gravacao
        SET
          codigo_externo = ${input.codigo_externo ?? null},
          titulo = ${input.titulo},
          gravacao_id = ${input.gravacao_id ?? null},
          recurso_fisico_id = ${input.recurso_fisico_id ?? null},
          severidade_id = ${input.severidade_id ?? null},
          impacto_id = ${input.impacto_id ?? null},
          categoria_id = ${input.categoria_id ?? null},
          classificacao_id = ${input.classificacao_id ?? null},
          data_incidencia = CAST(${input.data_incidencia ?? null} AS date),
          horario_incidencia = ${input.horario_incidencia ?? null},
          tempo_incidencia = ${input.tempo_incidencia ?? null},
          descricao = ${input.descricao ?? null},
          causa_provavel = ${input.causa_provavel ?? null},
          updated_at = NOW()
        WHERE id = ${id}
          AND tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO incidencias_gravacao (
          id,
          tenant_id,
          codigo_externo,
          titulo,
          gravacao_id,
          recurso_fisico_id,
          severidade_id,
          impacto_id,
          categoria_id,
          classificacao_id,
          data_incidencia,
          horario_incidencia,
          tempo_incidencia,
          descricao,
          causa_provavel,
          created_by,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${input.tenantId},
          ${input.codigo_externo ?? null},
          ${input.titulo},
          ${input.gravacao_id ?? null},
          ${input.recurso_fisico_id ?? null},
          ${input.severidade_id ?? null},
          ${input.impacto_id ?? null},
          ${input.categoria_id ?? null},
          ${input.classificacao_id ?? null},
          CAST(${input.data_incidencia ?? null} AS date),
          ${input.horario_incidencia ?? null},
          ${input.tempo_incidencia ?? null},
          ${input.descricao ?? null},
          ${input.causa_provavel ?? null},
          ${input.created_by ?? null},
          NOW(),
          NOW()
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Incidencia nao encontrada apos salvar');
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM incidencia_anexos WHERE incidencia_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM incidencias_gravacao WHERE id = ${id}`;
  }

  async listAnexos(incidenciaId: string): Promise<IncidenciaAnexoRecord[]> {
    await this.ensureTables();
    return prisma.$queryRaw<IncidenciaAnexoRow[]>`
      SELECT
        id,
        incidencia_id,
        nome,
        url,
        tipo,
        tamanho,
        to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS created_at
      FROM incidencia_anexos
      WHERE incidencia_id = ${incidenciaId}
      ORDER BY created_at ASC, id ASC
    `;
  }

  async addAnexo(input: SaveIncidenciaAnexoInput): Promise<IncidenciaAnexoRecord> {
    await this.ensureTables();
    const id = randomUUID();

    await prisma.$executeRaw`
      INSERT INTO incidencia_anexos (
        id,
        incidencia_id,
        tenant_id,
        nome,
        url,
        tipo,
        tamanho,
        created_by,
        created_at
      ) VALUES (
        ${id},
        ${input.incidencia_id},
        ${input.tenant_id},
        ${input.nome},
        ${input.url},
        ${input.tipo ?? null},
        ${input.tamanho ?? null},
        ${input.created_by ?? null},
        NOW()
      )
    `;

    const rows = await prisma.$queryRaw<IncidenciaAnexoRow[]>`
      SELECT
        id,
        incidencia_id,
        nome,
        url,
        tipo,
        tamanho,
        to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS created_at
      FROM incidencia_anexos
      WHERE id = ${id}
      LIMIT 1
    `;

    const saved = rows[0];
    if (!saved) {
      throw new Error('Anexo nao encontrado apos salvar');
    }

    return saved;
  }

  async removeAnexo(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM incidencia_anexos WHERE id = ${id}`;
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS incidencias_gravacao (
            id text PRIMARY KEY,
            tenant_id text NOT NULL,
            codigo_externo text NULL,
            titulo text NOT NULL,
            gravacao_id text NULL,
            recurso_fisico_id text NULL,
            severidade_id text NULL,
            impacto_id text NULL,
            categoria_id text NULL,
            classificacao_id text NULL,
            data_incidencia date NULL,
            horario_incidencia text NULL,
            tempo_incidencia text NULL,
            descricao text NULL,
            causa_provavel text NULL,
            created_by text NULL,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            updated_at timestamptz NOT NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS incidencia_anexos (
            id text PRIMARY KEY,
            incidencia_id text NOT NULL REFERENCES incidencias_gravacao(id) ON DELETE CASCADE,
            tenant_id text NOT NULL,
            nome text NOT NULL,
            url text NOT NULL,
            tipo text NULL,
            tamanho integer NULL,
            created_by text NULL,
            created_at timestamptz NOT NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS incidencias_gravacao_tenant_idx
          ON incidencias_gravacao (tenant_id, created_at DESC)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS incidencias_gravacao_gravacao_idx
          ON incidencias_gravacao (gravacao_id)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS incidencia_anexos_incidencia_idx
          ON incidencia_anexos (incidencia_id, created_at ASC)
        `);
      })();
    }

    await this.ready;
  }
}
