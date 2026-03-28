import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type AnexoRecord = {
  id: string;
  nome: string;
  tipo: string | null;
  tamanho: number;
  dataUrl: string;
};

export type AusenciaRecord = {
  id: string;
  motivo: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
};

export type EscalaRecord = {
  id: string;
  dataInicio: string;
  horaInicio: string;
  dataFim: string;
  horaFim: string;
  diasSemana: number[];
};

export type RecursoHumanoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  sobrenome: string;
  foto: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  email: string | null;
  departamento: string | null;
  departamentoId: string | null;
  funcao: string | null;
  funcaoId: string | null;
  custoHora: number;
  dataContratacao: string | null;
  status: string;
  createdAt: Date | null;
  createdBy: string | null;
  createdByNome: string | null;
  anexos: AnexoRecord[];
  ausencias: AusenciaRecord[];
  escalas: EscalaRecord[];
};

export type SaveRecursoHumanoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  sobrenome: string;
  foto?: string | null;
  dataNascimento?: string | null;
  sexo?: string | null;
  telefone?: string | null;
  email?: string | null;
  departamentoId?: string | null;
  funcaoId?: string | null;
  custoHora?: number;
  dataContratacao?: string | null;
  status: string;
  createdBy?: string | null;
  anexos?: AnexoRecord[];
  ausencias?: AusenciaRecord[];
  escalas?: EscalaRecord[];
};

export type DepartamentoOptionRecord = {
  id: string;
  nome: string;
};

export type FuncaoOptionRecord = {
  id: string;
  nome: string;
};

export type DepartamentoFuncaoOptionRecord = {
  departamentoId: string;
  funcaoId: string;
};

export type OcupacaoRecursoHumanoRecord = {
  recursoId: string;
  data: string;
  gravacaoId: string;
  gravacaoNome: string;
  horaInicio: string;
  horaFim: string;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type RecursoHumanoBaseRow = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  sobrenome: string;
  foto: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  email: string | null;
  departamento: string | null;
  departamentoId: string | null;
  funcao: string | null;
  funcaoId: string | null;
  custoHora: Prisma.Decimal | number | string | null;
  dataContratacao: string | null;
  status: string | null;
  createdAt: Date | null;
  createdBy: string | null;
  createdByNome: string | null;
};

type AnexoRow = {
  id: string;
  recursoHumanoId: string;
  nome: string;
  tipo: string | null;
  tamanho: number;
  dataUrl: string;
};

type AusenciaRow = {
  id: string;
  recursoHumanoId: string;
  motivo: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
};

type EscalaRow = {
  id: string;
  recursoHumanoId: string;
  dataInicio: string;
  horaInicio: string;
  dataFim: string;
  horaFim: string;
  diasSemana: unknown;
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
      if (Array.isArray(parsed)) {
        return parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item));
      }
    } catch {
      return [1, 2, 3, 4, 5];
    }
  }

  return [1, 2, 3, 4, 5];
}

export interface RecursosHumanosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<RecursoHumanoRecord>>;
  findById(id: string): Promise<RecursoHumanoRecord | null>;
  save(input: SaveRecursoHumanoInput): Promise<RecursoHumanoRecord>;
  remove(id: string): Promise<void>;
  listDepartamentos(tenantId: string): Promise<DepartamentoOptionRecord[]>;
  listFuncoes(tenantId: string): Promise<FuncaoOptionRecord[]>;
  listDepartamentoFuncoes(tenantId: string): Promise<DepartamentoFuncaoOptionRecord[]>;
  listOcupacoes(tenantId: string, dataInicio: string, dataFim: string): Promise<OcupacaoRecursoHumanoRecord[]>;
}

export class PrismaRecursosHumanosRepository implements RecursosHumanosRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<RecursoHumanoRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const items = await prisma.$queryRaw<RecursoHumanoBaseRow[]>(Prisma.sql`
      SELECT
        rh.id,
        rh.tenant_id AS "tenantId",
        rh.codigo_externo AS "codigoExterno",
        rh.nome,
        rh.sobrenome,
        rh.foto_url AS foto,
        to_char(rh.data_nascimento, 'YYYY-MM-DD') AS "dataNascimento",
        rh.sexo,
        rh.telefone,
        rh.email,
        d.nome AS departamento,
        rh.departamento_id AS "departamentoId",
        f.nome AS funcao,
        rh.funcao_id AS "funcaoId",
        rh.custo_hora AS "custoHora",
        to_char(rh.data_contratacao, 'YYYY-MM-DD') AS "dataContratacao",
        rh.status,
        rh.created_at AS "createdAt",
        rh.created_by AS "createdBy",
        u.nome AS "createdByNome"
      FROM recursos_humanos rh
      LEFT JOIN departamentos d ON d.id = rh.departamento_id
      LEFT JOIN funcoes f ON f.id = rh.funcao_id
      LEFT JOIN "User" u ON u.id = rh.created_by
      WHERE rh.tenant_id = ${tenantId}
      ORDER BY rh.nome ASC, rh.sobrenome ASC
      LIMIT ${take} OFFSET ${skip}
    `);

    const totals = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM recursos_humanos
      WHERE tenant_id = ${tenantId}
    `);

    return {
      data: await this.enrichResources(items),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<RecursoHumanoRecord | null> {
    await this.ensureTables();

    const items = await prisma.$queryRaw<RecursoHumanoBaseRow[]>(Prisma.sql`
      SELECT
        rh.id,
        rh.tenant_id AS "tenantId",
        rh.codigo_externo AS "codigoExterno",
        rh.nome,
        rh.sobrenome,
        rh.foto_url AS foto,
        to_char(rh.data_nascimento, 'YYYY-MM-DD') AS "dataNascimento",
        rh.sexo,
        rh.telefone,
        rh.email,
        d.nome AS departamento,
        rh.departamento_id AS "departamentoId",
        f.nome AS funcao,
        rh.funcao_id AS "funcaoId",
        rh.custo_hora AS "custoHora",
        to_char(rh.data_contratacao, 'YYYY-MM-DD') AS "dataContratacao",
        rh.status,
        rh.created_at AS "createdAt",
        rh.created_by AS "createdBy",
        u.nome AS "createdByNome"
      FROM recursos_humanos rh
      LEFT JOIN departamentos d ON d.id = rh.departamento_id
      LEFT JOIN funcoes f ON f.id = rh.funcao_id
      LEFT JOIN "User" u ON u.id = rh.created_by
      WHERE rh.id = ${id}
      LIMIT 1
    `);

    if (!items[0]) {
      return null;
    }

    const data = await this.enrichResources(items);
    return data[0] ?? null;
  }

  async save(input: SaveRecursoHumanoInput): Promise<RecursoHumanoRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRaw`
        UPDATE recursos_humanos
        SET
          codigo_externo = ${input.codigoExterno ?? null},
          nome = ${input.nome},
          sobrenome = ${input.sobrenome},
          foto_url = ${input.foto ?? null},
          data_nascimento = ${input.dataNascimento ? Prisma.sql`${input.dataNascimento}::date` : Prisma.sql`NULL`},
          sexo = ${input.sexo ?? null},
          telefone = ${input.telefone ?? null},
          email = ${input.email ?? null},
          departamento_id = ${input.departamentoId ?? null},
          funcao_id = ${input.funcaoId ?? null},
          custo_hora = ${input.custoHora ?? 0},
          data_contratacao = ${input.dataContratacao ? Prisma.sql`${input.dataContratacao}::date` : Prisma.sql`NULL`},
          status = ${input.status},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO recursos_humanos (
          id,
          tenant_id,
          codigo_externo,
          nome,
          sobrenome,
          foto_url,
          data_nascimento,
          sexo,
          telefone,
          email,
          departamento_id,
          funcao_id,
          custo_hora,
          data_contratacao,
          status,
          created_at,
          updated_at,
          created_by
        ) VALUES (
          ${id},
          ${input.tenantId},
          ${input.codigoExterno ?? null},
          ${input.nome},
          ${input.sobrenome},
          ${input.foto ?? null},
          ${input.dataNascimento ? Prisma.sql`${input.dataNascimento}::date` : Prisma.sql`NULL`},
          ${input.sexo ?? null},
          ${input.telefone ?? null},
          ${input.email ?? null},
          ${input.departamentoId ?? null},
          ${input.funcaoId ?? null},
          ${input.custoHora ?? 0},
          ${input.dataContratacao ? Prisma.sql`${input.dataContratacao}::date` : Prisma.sql`NULL`},
          ${input.status},
          NOW(),
          NOW(),
          ${input.createdBy ?? null}
        )
      `;
    }

    await prisma.$executeRaw`DELETE FROM rh_anexos WHERE recurso_humano_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM rh_ausencias WHERE recurso_humano_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM rh_escalas WHERE recurso_humano_id = ${id}`;

    for (const anexo of input.anexos ?? []) {
      await prisma.$executeRaw`
        INSERT INTO rh_anexos (
          id,
          tenant_id,
          recurso_humano_id,
          nome,
          tipo,
          tamanho,
          url,
          created_at,
          updated_at
        ) VALUES (
          ${anexo.id || randomUUID()},
          ${input.tenantId},
          ${id},
          ${anexo.nome},
          ${anexo.tipo ?? null},
          ${anexo.tamanho ?? 0},
          ${anexo.dataUrl},
          NOW(),
          NOW()
        )
      `;
    }

    for (const ausencia of input.ausencias ?? []) {
      await prisma.$executeRaw`
        INSERT INTO rh_ausencias (
          id,
          tenant_id,
          recurso_humano_id,
          motivo,
          data_inicio,
          data_fim,
          dias,
          created_at,
          updated_at
        ) VALUES (
          ${ausencia.id || randomUUID()},
          ${input.tenantId},
          ${id},
          ${ausencia.motivo},
          ${ausencia.dataInicio}::date,
          ${ausencia.dataFim}::date,
          ${ausencia.dias},
          NOW(),
          NOW()
        )
      `;
    }

    for (const escala of input.escalas ?? []) {
      await prisma.$executeRaw`
        INSERT INTO rh_escalas (
          id,
          tenant_id,
          recurso_humano_id,
          data_inicio,
          hora_inicio,
          data_fim,
          hora_fim,
          dias_semana,
          created_at,
          updated_at
        ) VALUES (
          ${escala.id || randomUUID()},
          ${input.tenantId},
          ${id},
          ${escala.dataInicio}::date,
          ${escala.horaInicio},
          ${escala.dataFim}::date,
          ${escala.horaFim},
          ${JSON.stringify(escala.diasSemana ?? [1, 2, 3, 4, 5])}::jsonb,
          NOW(),
          NOW()
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Recurso humano nao encontrado apos salvar');
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM recursos_humanos WHERE id = ${id}`;
  }

  async listDepartamentos(tenantId: string): Promise<DepartamentoOptionRecord[]> {
    const exists = await this.tableExists('departamentos');
    if (!exists) {
      return [];
    }

    return prisma.$queryRaw<DepartamentoOptionRecord[]>(Prisma.sql`
      SELECT id, nome
      FROM departamentos
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `);
  }

  async listFuncoes(tenantId: string): Promise<FuncaoOptionRecord[]> {
    const exists = await this.tableExists('funcoes');
    if (!exists) {
      return [];
    }

    return prisma.$queryRaw<FuncaoOptionRecord[]>(Prisma.sql`
      SELECT id, nome
      FROM funcoes
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `);
  }

  async listDepartamentoFuncoes(tenantId: string): Promise<DepartamentoFuncaoOptionRecord[]> {
    const exists = await this.tableExists('departamento_funcoes');
    if (!exists) {
      return [];
    }

    return prisma.$queryRaw<DepartamentoFuncaoOptionRecord[]>(Prisma.sql`
      SELECT
        departamento_id AS "departamentoId",
        funcao_id AS "funcaoId"
      FROM departamento_funcoes
      WHERE tenant_id = ${tenantId}
    `);
  }

  async listOcupacoes(tenantId: string, dataInicio: string, dataFim: string): Promise<OcupacaoRecursoHumanoRecord[]> {
    await this.ensureTables();

    const gravacaoRecursosExists = await this.tableExists('gravacao_recursos');
    if (!gravacaoRecursosExists) {
      return [];
    }

    const gravacoesExists = await this.tableExists('gravacoes');
    if (gravacoesExists) {
      return prisma.$queryRaw<OcupacaoRecursoHumanoRecord[]>(Prisma.sql`
        SELECT
          gr.recurso_humano_id AS "recursoId",
          to_char(g.data_prevista, 'YYYY-MM-DD') AS "data",
          gr.gravacao_id AS "gravacaoId",
          COALESCE(g.nome, g.codigo, 'Gravacao sem nome') AS "gravacaoNome",
          gr.hora_inicio AS "horaInicio",
          gr.hora_fim AS "horaFim"
        FROM gravacao_recursos gr
        INNER JOIN gravacoes g ON g.id = gr.gravacao_id
        WHERE gr.tenant_id = ${tenantId}
          AND gr.recurso_humano_id IS NOT NULL
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

    return prisma.$queryRaw<OcupacaoRecursoHumanoRecord[]>(Prisma.sql`
      SELECT
        gr.recurso_humano_id AS "recursoId",
        to_char(g."dataPrevista", 'YYYY-MM-DD') AS "data",
        gr.gravacao_id AS "gravacaoId",
        COALESCE(g.nome, g.codigo, 'Gravacao sem nome') AS "gravacaoNome",
        gr.hora_inicio AS "horaInicio",
        gr.hora_fim AS "horaFim"
      FROM gravacao_recursos gr
      INNER JOIN "Gravacao" g ON g.id = gr.gravacao_id
      WHERE gr.tenant_id = ${tenantId}
        AND gr.recurso_humano_id IS NOT NULL
        AND gr.hora_inicio IS NOT NULL
        AND gr.hora_fim IS NOT NULL
        AND g."dataPrevista" BETWEEN ${dataInicio}::date AND ${dataFim}::date
      ORDER BY g."dataPrevista" ASC, gr.hora_inicio ASC
    `);
  }

  private async enrichResources(resources: RecursoHumanoBaseRow[]): Promise<RecursoHumanoRecord[]> {
    if (resources.length === 0) {
      return [];
    }

    const ids = resources.map((resource) => resource.id);

    const anexos = await prisma.$queryRaw<AnexoRow[]>(Prisma.sql`
      SELECT
        id,
        recurso_humano_id AS "recursoHumanoId",
        nome,
        tipo,
        tamanho,
        url AS "dataUrl"
      FROM rh_anexos
      WHERE recurso_humano_id IN (${Prisma.join(ids)})
      ORDER BY created_at ASC
    `);

    const ausencias = await prisma.$queryRaw<AusenciaRow[]>(Prisma.sql`
      SELECT
        id,
        recurso_humano_id AS "recursoHumanoId",
        motivo,
        to_char(data_inicio, 'YYYY-MM-DD') AS "dataInicio",
        to_char(data_fim, 'YYYY-MM-DD') AS "dataFim",
        dias
      FROM rh_ausencias
      WHERE recurso_humano_id IN (${Prisma.join(ids)})
      ORDER BY data_inicio ASC
    `);

    const escalas = await prisma.$queryRaw<EscalaRow[]>(Prisma.sql`
      SELECT
        id,
        recurso_humano_id AS "recursoHumanoId",
        to_char(data_inicio, 'YYYY-MM-DD') AS "dataInicio",
        hora_inicio AS "horaInicio",
        to_char(data_fim, 'YYYY-MM-DD') AS "dataFim",
        hora_fim AS "horaFim",
        dias_semana AS "diasSemana"
      FROM rh_escalas
      WHERE recurso_humano_id IN (${Prisma.join(ids)})
      ORDER BY data_inicio ASC, hora_inicio ASC
    `);

    const anexosByResource = new Map<string, AnexoRecord[]>();
    for (const anexo of anexos) {
      const current = anexosByResource.get(anexo.recursoHumanoId) ?? [];
      current.push({
        id: anexo.id,
        nome: anexo.nome,
        tipo: anexo.tipo,
        tamanho: Number(anexo.tamanho ?? 0),
        dataUrl: anexo.dataUrl,
      });
      anexosByResource.set(anexo.recursoHumanoId, current);
    }

    const ausenciasByResource = new Map<string, AusenciaRecord[]>();
    for (const ausencia of ausencias) {
      const current = ausenciasByResource.get(ausencia.recursoHumanoId) ?? [];
      current.push({
        id: ausencia.id,
        motivo: ausencia.motivo,
        dataInicio: ausencia.dataInicio,
        dataFim: ausencia.dataFim,
        dias: Number(ausencia.dias ?? 0),
      });
      ausenciasByResource.set(ausencia.recursoHumanoId, current);
    }

    const escalasByResource = new Map<string, EscalaRecord[]>();
    for (const escala of escalas) {
      const current = escalasByResource.get(escala.recursoHumanoId) ?? [];
      current.push({
        id: escala.id,
        dataInicio: escala.dataInicio,
        horaInicio: escala.horaInicio,
        dataFim: escala.dataFim,
        horaFim: escala.horaFim,
        diasSemana: parseDiasSemana(escala.diasSemana),
      });
      escalasByResource.set(escala.recursoHumanoId, current);
    }

    return resources.map((resource) => ({
      id: resource.id,
      tenantId: resource.tenantId,
      codigoExterno: resource.codigoExterno,
      nome: resource.nome,
      sobrenome: resource.sobrenome,
      foto: resource.foto,
      dataNascimento: resource.dataNascimento,
      sexo: resource.sexo,
      telefone: resource.telefone,
      email: resource.email,
      departamento: resource.departamento,
      departamentoId: resource.departamentoId,
      funcao: resource.funcao,
      funcaoId: resource.funcaoId,
      custoHora: toNumber(resource.custoHora),
      dataContratacao: resource.dataContratacao,
      status: resource.status || 'Ativo',
      createdAt: resource.createdAt,
      createdBy: resource.createdBy,
      createdByNome: resource.createdByNome,
      anexos: anexosByResource.get(resource.id) ?? [],
      ausencias: ausenciasByResource.get(resource.id) ?? [],
      escalas: escalasByResource.get(resource.id) ?? [],
    }));
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS recursos_humanos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            nome text NOT NULL,
            sobrenome text NOT NULL DEFAULT '',
            foto_url text NULL,
            data_nascimento date NULL,
            sexo text NULL,
            telefone text NULL,
            email text NULL,
            departamento_id text NULL REFERENCES departamentos(id) ON DELETE SET NULL,
            funcao_id text NULL REFERENCES funcoes(id) ON DELETE SET NULL,
            custo_hora numeric(12, 2) NOT NULL DEFAULT 0,
            data_contratacao date NULL,
            status text NOT NULL DEFAULT 'Ativo',
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS rh_anexos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            recurso_humano_id text NOT NULL REFERENCES recursos_humanos(id) ON DELETE CASCADE,
            nome text NOT NULL,
            tipo text NULL,
            tamanho integer NOT NULL DEFAULT 0,
            url text NOT NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS rh_ausencias (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            recurso_humano_id text NOT NULL REFERENCES recursos_humanos(id) ON DELETE CASCADE,
            motivo text NOT NULL,
            data_inicio date NOT NULL,
            data_fim date NOT NULL,
            dias integer NOT NULL DEFAULT 0,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS rh_escalas (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            recurso_humano_id text NOT NULL REFERENCES recursos_humanos(id) ON DELETE CASCADE,
            data_inicio date NOT NULL,
            hora_inicio text NOT NULL,
            data_fim date NOT NULL,
            hora_fim text NOT NULL,
            dias_semana jsonb NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS recursos_humanos_tenant_nome_idx
          ON recursos_humanos (tenant_id, nome, sobrenome)
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
