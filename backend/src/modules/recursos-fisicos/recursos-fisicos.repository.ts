import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type FaixaDisponibilidadeRecord = {
  id: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[];
};

export type EstoqueItemRecord = {
  id: string;
  numerador: number;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
};

export type RecursoFisicoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  custoHora: number;
  createdAt: Date | null;
  createdBy: string | null;
  createdByNome: string | null;
  faixasDisponibilidade: FaixaDisponibilidadeRecord[];
  estoqueItens: EstoqueItemRecord[];
};

export type SaveRecursoFisicoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  custoHora?: number;
  createdBy?: string | null;
  faixasDisponibilidade?: FaixaDisponibilidadeRecord[];
  estoqueItens?: EstoqueItemRecord[];
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };
export type OcupacaoRecursoFisicoRecord = {
  recursoId: string;
  data: string;
  gravacaoId: string;
  gravacaoNome: string;
  horaInicio: string;
  horaFim: string;
};

type RecursoFisicoBaseRow = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  custoHora: Prisma.Decimal | number | string | null;
  createdAt: Date | null;
  createdBy: string | null;
  createdByNome: string | null;
};

type FaixaRow = {
  id: string;
  recursoFisicoId: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: unknown;
};

type EstoqueRow = {
  id: string;
  recursoFisicoId: string;
  numerador: number;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
};

function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value) || 0;
  }

  return value.toNumber();
}

function parseDiasSemana(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item))
        : [1, 2, 3, 4, 5];
    } catch {
      return [1, 2, 3, 4, 5];
    }
  }

  return [1, 2, 3, 4, 5];
}

export interface RecursosFisicosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<RecursoFisicoRecord>>;
  findById(id: string): Promise<RecursoFisicoRecord | null>;
  save(input: SaveRecursoFisicoInput): Promise<RecursoFisicoRecord>;
  remove(id: string): Promise<void>;
  listOcupacoes(tenantId: string, dataInicio: string, dataFim: string): Promise<OcupacaoRecursoFisicoRecord[]>;
}

export class PrismaRecursosFisicosRepository implements RecursosFisicosRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<RecursoFisicoRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const resources = await prisma.$queryRaw<RecursoFisicoBaseRow[]>(Prisma.sql`
      SELECT
        rf.id,
        rf.tenant_id AS "tenantId",
        rf.codigo_externo AS "codigoExterno",
        rf.nome,
        rf.custo_hora AS "custoHora",
        rf.created_at AS "createdAt",
        rf.created_by AS "createdBy",
        u.nome AS "createdByNome"
      FROM recursos_fisicos rf
      LEFT JOIN "User" u ON u.id = rf.created_by
      WHERE rf.tenant_id = ${tenantId}
      ORDER BY rf.nome ASC
      LIMIT ${take} OFFSET ${skip}
    `);

    const totals = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM recursos_fisicos
      WHERE tenant_id = ${tenantId}
    `);

    const data = await this.enrichResources(resources);

    return {
      data,
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<RecursoFisicoRecord | null> {
    await this.ensureTables();

    const resources = await prisma.$queryRaw<RecursoFisicoBaseRow[]>(Prisma.sql`
      SELECT
        rf.id,
        rf.tenant_id AS "tenantId",
        rf.codigo_externo AS "codigoExterno",
        rf.nome,
        rf.custo_hora AS "custoHora",
        rf.created_at AS "createdAt",
        rf.created_by AS "createdBy",
        u.nome AS "createdByNome"
      FROM recursos_fisicos rf
      LEFT JOIN "User" u ON u.id = rf.created_by
      WHERE rf.id = ${id}
      LIMIT 1
    `);

    if (!resources[0]) {
      return null;
    }

    const data = await this.enrichResources(resources);
    return data[0] ?? null;
  }

  async save(input: SaveRecursoFisicoInput): Promise<RecursoFisicoRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRaw`
        UPDATE recursos_fisicos
        SET
          codigo_externo = ${input.codigoExterno ?? null},
          nome = ${input.nome},
          custo_hora = ${input.custoHora ?? 0},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO recursos_fisicos (
          id,
          tenant_id,
          codigo_externo,
          nome,
          custo_hora,
          created_at,
          updated_at,
          created_by
        ) VALUES (
          ${id},
          ${input.tenantId},
          ${input.codigoExterno ?? null},
          ${input.nome},
          ${input.custoHora ?? 0},
          NOW(),
          NOW(),
          ${input.createdBy ?? null}
        )
      `;
    }

    await prisma.$executeRaw`DELETE FROM rf_faixas_disponibilidade WHERE recurso_fisico_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM rf_estoque_itens WHERE recurso_fisico_id = ${id}`;

    for (const faixa of input.faixasDisponibilidade ?? []) {
      await prisma.$executeRaw`
        INSERT INTO rf_faixas_disponibilidade (
          id,
          tenant_id,
          recurso_fisico_id,
          data_inicio,
          data_fim,
          hora_inicio,
          hora_fim,
          dias_semana,
          created_at,
          updated_at
        ) VALUES (
          ${faixa.id || randomUUID()},
          ${input.tenantId},
          ${id},
          ${faixa.dataInicio}::date,
          ${faixa.dataFim}::date,
          ${faixa.horaInicio},
          ${faixa.horaFim},
          ${JSON.stringify(faixa.diasSemana ?? [1, 2, 3, 4, 5])}::jsonb,
          NOW(),
          NOW()
        )
      `;
    }

    for (const item of input.estoqueItens ?? []) {
      await prisma.$executeRaw`
        INSERT INTO rf_estoque_itens (
          id,
          tenant_id,
          recurso_fisico_id,
          numerador,
          codigo,
          nome,
          descricao,
          imagem_url,
          created_at,
          updated_at,
          created_by
        ) VALUES (
          ${item.id || randomUUID()},
          ${input.tenantId},
          ${id},
          ${item.numerador},
          ${item.codigo ?? null},
          ${item.nome},
          ${item.descricao ?? null},
          ${item.imagemUrl ?? null},
          NOW(),
          NOW(),
          ${input.createdBy ?? null}
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Recurso fisico nao encontrado apos salvar');
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM recursos_fisicos WHERE id = ${id}`;
  }

  async listOcupacoes(tenantId: string, dataInicio: string, dataFim: string): Promise<OcupacaoRecursoFisicoRecord[]> {
    await this.ensureTables();

    const gravacaoRecursosExists = await this.tableExists('gravacao_recursos');
    if (!gravacaoRecursosExists) {
      return [];
    }

    const gravacoesExists = await this.tableExists('gravacoes');
    if (gravacoesExists) {
      return prisma.$queryRaw<OcupacaoRecursoFisicoRecord[]>(Prisma.sql`
        SELECT
          gr.recurso_fisico_id AS "recursoId",
          to_char(g.data_prevista, 'YYYY-MM-DD') AS "data",
          gr.gravacao_id AS "gravacaoId",
          COALESCE(g.nome, g.codigo, 'Gravacao sem nome') AS "gravacaoNome",
          gr.hora_inicio AS "horaInicio",
          gr.hora_fim AS "horaFim"
        FROM gravacao_recursos gr
        INNER JOIN gravacoes g ON g.id = gr.gravacao_id
        WHERE gr.tenant_id = ${tenantId}
          AND gr.recurso_fisico_id IS NOT NULL
          AND gr.hora_inicio IS NOT NULL
          AND gr.hora_fim IS NOT NULL
          AND g.data_prevista BETWEEN ${dataInicio}::date AND ${dataFim}::date
        ORDER BY g.data_prevista ASC, gr.hora_inicio ASC
      `);
    }

    const prismaGravacoesExists = await this.tableExists('"Gravacao"');
    if (!prismaGravacoesExists) {
      return [];
    }

    return prisma.$queryRaw<OcupacaoRecursoFisicoRecord[]>(Prisma.sql`
      SELECT
        gr.recurso_fisico_id AS "recursoId",
        to_char(g."dataPrevista", 'YYYY-MM-DD') AS "data",
        gr.gravacao_id AS "gravacaoId",
        COALESCE(g.nome, g.codigo, 'Gravacao sem nome') AS "gravacaoNome",
        gr.hora_inicio AS "horaInicio",
        gr.hora_fim AS "horaFim"
      FROM gravacao_recursos gr
      INNER JOIN "Gravacao" g ON g.id = gr.gravacao_id
      WHERE gr.tenant_id = ${tenantId}
        AND gr.recurso_fisico_id IS NOT NULL
        AND gr.hora_inicio IS NOT NULL
        AND gr.hora_fim IS NOT NULL
        AND g."dataPrevista" BETWEEN ${dataInicio}::date AND ${dataFim}::date
      ORDER BY g."dataPrevista" ASC, gr.hora_inicio ASC
    `);
  }

  private async enrichResources(resources: RecursoFisicoBaseRow[]): Promise<RecursoFisicoRecord[]> {
    if (resources.length === 0) {
      return [];
    }

    const ids = resources.map((resource) => resource.id);

    const faixas = await prisma.$queryRaw<FaixaRow[]>(Prisma.sql`
      SELECT
        id,
        recurso_fisico_id AS "recursoFisicoId",
        to_char(data_inicio, 'YYYY-MM-DD') AS "dataInicio",
        to_char(data_fim, 'YYYY-MM-DD') AS "dataFim",
        hora_inicio AS "horaInicio",
        hora_fim AS "horaFim",
        dias_semana AS "diasSemana"
      FROM rf_faixas_disponibilidade
      WHERE recurso_fisico_id IN (${Prisma.join(ids)})
      ORDER BY data_inicio ASC, hora_inicio ASC
    `);

    const estoque = await prisma.$queryRaw<EstoqueRow[]>(Prisma.sql`
      SELECT
        id,
        recurso_fisico_id AS "recursoFisicoId",
        numerador,
        codigo,
        nome,
        descricao,
        imagem_url AS "imagemUrl"
      FROM rf_estoque_itens
      WHERE recurso_fisico_id IN (${Prisma.join(ids)})
      ORDER BY numerador ASC
    `);

    const faixasByResource = new Map<string, FaixaDisponibilidadeRecord[]>();
    for (const faixa of faixas) {
      const current = faixasByResource.get(faixa.recursoFisicoId) ?? [];
      current.push({
        id: faixa.id,
        dataInicio: faixa.dataInicio,
        dataFim: faixa.dataFim,
        horaInicio: faixa.horaInicio,
        horaFim: faixa.horaFim,
        diasSemana: parseDiasSemana(faixa.diasSemana),
      });
      faixasByResource.set(faixa.recursoFisicoId, current);
    }

    const estoqueByResource = new Map<string, EstoqueItemRecord[]>();
    for (const item of estoque) {
      const current = estoqueByResource.get(item.recursoFisicoId) ?? [];
      current.push({
        id: item.id,
        numerador: Number(item.numerador),
        codigo: item.codigo,
        nome: item.nome,
        descricao: item.descricao,
        imagemUrl: item.imagemUrl,
      });
      estoqueByResource.set(item.recursoFisicoId, current);
    }

    return resources.map((resource) => ({
      id: resource.id,
      tenantId: resource.tenantId,
      codigoExterno: resource.codigoExterno,
      nome: resource.nome,
      custoHora: toNumber(resource.custoHora),
      createdAt: resource.createdAt,
      createdBy: resource.createdBy,
      createdByNome: resource.createdByNome,
      faixasDisponibilidade: faixasByResource.get(resource.id) ?? [],
      estoqueItens: estoqueByResource.get(resource.id) ?? [],
    }));
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS recursos_fisicos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            nome text NOT NULL,
            custo_hora numeric(12, 2) NOT NULL DEFAULT 0,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS rf_faixas_disponibilidade (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            recurso_fisico_id text NOT NULL REFERENCES recursos_fisicos(id) ON DELETE CASCADE,
            data_inicio date NOT NULL,
            data_fim date NOT NULL,
            hora_inicio text NOT NULL,
            hora_fim text NOT NULL,
            dias_semana jsonb NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS rf_estoque_itens (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            recurso_fisico_id text NOT NULL REFERENCES recursos_fisicos(id) ON DELETE CASCADE,
            numerador integer NOT NULL,
            codigo text NULL,
            nome text NOT NULL,
            descricao text NULL,
            imagem_url text NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS recursos_fisicos_tenant_nome_idx
          ON recursos_fisicos (tenant_id, nome)
        `);
      })();
    }

    await this.ready;
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      select to_regclass(${`public.${tableName}`}) is not null as "exists"
    `;

    return Boolean(rows[0]?.exists);
  }
}
