import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type TabelaPrecoRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  status: string | null;
  vigenciaInicio: Date | null;
  vigenciaFim: Date | null;
  descricao: string | null;
  createdAt: Date | null;
  createdBy: string | null;
  unidadeNegocioId: string | null;
  unidadeNegocioNome: string | null;
  moeda: string | null;
};

export type SaveTabelaPrecoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  status?: string | null;
  vigenciaInicio?: string | null;
  vigenciaFim?: string | null;
  descricao?: string | null;
  unidadeNegocioId?: string | null;
  createdBy?: string | null;
};

export type TabelaPrecoRecursoRecord = {
  id: string;
  tabelaPrecoId: string;
  recursoId: string;
  valorHora: number;
  recursoNome: string;
};

export type AddTabelaPrecoRecursoInput = {
  tabelaPrecoId: string;
  tenantId: string;
  recursoId: string;
  valorHora: number;
  tipo: 'tecnico' | 'fisico';
};

export type UnidadeNegocioOption = {
  id: string;
  nome: string;
  moeda: string | null;
};

export type RecursoOption = {
  id: string;
  nome: string;
};

export interface TabelasPrecoRepository {
  listByTenant(tenantId: string, unidadeIds?: string[]): Promise<TabelaPrecoRecord[]>;
  findById(id: string): Promise<TabelaPrecoRecord | null>;
  save(input: SaveTabelaPrecoInput): Promise<TabelaPrecoRecord>;
  remove(id: string): Promise<void>;
  listUnidadesNegocio(tenantId: string, unidadeIds?: string[]): Promise<UnidadeNegocioOption[]>;
  listRecursosTabela(tabelaPrecoId: string, tipo: 'tecnico' | 'fisico'): Promise<{ items: TabelaPrecoRecursoRecord[]; recursos: RecursoOption[] }>;
  addRecurso(input: AddTabelaPrecoRecursoInput): Promise<string>;
  removeRecurso(id: string, tipo: 'tecnico' | 'fisico'): Promise<void>;
}

let ensureSchemaPromise: Promise<void> | null = null;

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    select to_regclass(${`public.${tableName}`}) is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

async function ensureSchema() {
  ensureSchemaPromise ??= (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.tabelas_preco (
        id text PRIMARY KEY,
        tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
        codigo_externo text NULL,
        nome text NOT NULL,
        status text NULL DEFAULT 'Ativo',
        vigencia_inicio date NULL,
        vigencia_fim date NULL,
        descricao text NULL,
        created_at timestamptz NULL DEFAULT now(),
        updated_at timestamptz NULL DEFAULT now(),
        created_by text NULL,
        unidade_negocio_id text NULL
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.tabela_preco_recursos_tecnicos (
        id text PRIMARY KEY,
        tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
        tabela_preco_id text NOT NULL REFERENCES public.tabelas_preco(id) ON DELETE CASCADE,
        recurso_tecnico_id text NOT NULL,
        valor_hora numeric(12, 2) NOT NULL DEFAULT 0,
        created_at timestamptz NULL DEFAULT now(),
        updated_at timestamptz NULL DEFAULT now()
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.tabela_preco_recursos_fisicos (
        id text PRIMARY KEY,
        tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
        tabela_preco_id text NOT NULL REFERENCES public.tabelas_preco(id) ON DELETE CASCADE,
        recurso_fisico_id text NOT NULL,
        valor_hora numeric(12, 2) NOT NULL DEFAULT 0,
        created_at timestamptz NULL DEFAULT now(),
        updated_at timestamptz NULL DEFAULT now()
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS tabela_preco_recursos_tecnicos_unique
      ON public.tabela_preco_recursos_tecnicos (tabela_preco_id, recurso_tecnico_id)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS tabela_preco_recursos_fisicos_unique
      ON public.tabela_preco_recursos_fisicos (tabela_preco_id, recurso_fisico_id)
    `);
  })();

  await ensureSchemaPromise;
}

const tabelaPrecoBaseSelect = Prisma.sql`
  select
    tp.id,
    tp.tenant_id as "tenantId",
    tp.codigo_externo as "codigoExterno",
    tp.nome,
    tp.status,
    tp.vigencia_inicio as "vigenciaInicio",
    tp.vigencia_fim as "vigenciaFim",
    tp.descricao,
    tp.created_at as "createdAt",
    tp.created_by as "createdBy",
    tp.unidade_negocio_id as "unidadeNegocioId",
    un.nome as "unidadeNegocioNome",
    un.moeda
  from public.tabelas_preco tp
  left join public.unidades_negocio un on un.id::text = tp.unidade_negocio_id
`;

function buildUnidadeFilter(unidadeIds?: string[]) {
  if (!unidadeIds || unidadeIds.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql`and tp.unidade_negocio_id in (${Prisma.join(unidadeIds)})`;
}

function getPricingTable(tipo: 'tecnico' | 'fisico') {
  return tipo === 'tecnico' ? 'tabela_preco_recursos_tecnicos' : 'tabela_preco_recursos_fisicos';
}

function getResourceTable(tipo: 'tecnico' | 'fisico') {
  return tipo === 'tecnico' ? 'recursos_tecnicos' : 'recursos_fisicos';
}

function getResourceIdColumn(tipo: 'tecnico' | 'fisico') {
  return tipo === 'tecnico' ? 'recurso_tecnico_id' : 'recurso_fisico_id';
}

export class PrismaTabelasPrecoRepository implements TabelasPrecoRepository {
  async listByTenant(tenantId: string, unidadeIds?: string[]) {
    await ensureSchema();
    const unitFilter = buildUnidadeFilter(unidadeIds);

    return prisma.$queryRaw<TabelaPrecoRecord[]>(Prisma.sql`
      ${tabelaPrecoBaseSelect}
      where tp.tenant_id = ${tenantId}
      ${unitFilter}
      order by tp.nome asc
    `);
  }

  async findById(id: string) {
    await ensureSchema();
    const rows = await prisma.$queryRaw<TabelaPrecoRecord[]>(Prisma.sql`
      ${tabelaPrecoBaseSelect}
      where tp.id = ${id}
      limit 1
    `);

    return rows[0] ?? null;
  }

  async save(input: SaveTabelaPrecoInput) {
    await ensureSchema();
    const id = input.id ?? randomUUID();
    const existing = await this.findById(id);

    if (existing) {
      await prisma.$executeRaw`
        update public.tabelas_preco
        set
          codigo_externo = ${input.codigoExterno ?? null},
          nome = ${input.nome},
          status = ${input.status ?? 'Ativo'},
          vigencia_inicio = ${input.vigenciaInicio ?? null}::date,
          vigencia_fim = ${input.vigenciaFim ?? null}::date,
          descricao = ${input.descricao ?? null},
          unidade_negocio_id = ${input.unidadeNegocioId ?? null},
          updated_at = now()
        where id = ${id} and tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        insert into public.tabelas_preco (
          id,
          tenant_id,
          codigo_externo,
          nome,
          status,
          vigencia_inicio,
          vigencia_fim,
          descricao,
          created_by,
          unidade_negocio_id
        ) values (
          ${id},
          ${input.tenantId},
          ${input.codigoExterno ?? null},
          ${input.nome},
          ${input.status ?? 'Ativo'},
          ${input.vigenciaInicio ?? null}::date,
          ${input.vigenciaFim ?? null}::date,
          ${input.descricao ?? null},
          ${input.createdBy ?? null},
          ${input.unidadeNegocioId ?? null}
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Tabela de preco nao encontrada apos salvar');
    }

    return saved;
  }

  async remove(id: string) {
    await ensureSchema();
    await prisma.$executeRaw`delete from public.tabelas_preco where id = ${id}`;
  }

  async listUnidadesNegocio(tenantId: string, unidadeIds?: string[]) {
    await ensureSchema();
    const unitFilter = unidadeIds && unidadeIds.length > 0
      ? Prisma.sql`and id::text in (${Prisma.join(unidadeIds)})`
      : Prisma.empty;

    return prisma.$queryRaw<UnidadeNegocioOption[]>(Prisma.sql`
      select id::text as id, nome, moeda
      from public.unidades_negocio
      where tenant_id::text = ${tenantId}
      ${unitFilter}
      order by nome asc
    `);
  }

  async listRecursosTabela(tabelaPrecoId: string, tipo: 'tecnico' | 'fisico') {
    await ensureSchema();
    const pricingTable = getPricingTable(tipo);
    const resourceTable = getResourceTable(tipo);
    const resourceIdColumn = getResourceIdColumn(tipo);
    const resourceTableExists = await tableExists(resourceTable);

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; tabelaPrecoId: string; recursoId: string; valorHora: Prisma.Decimal | number }>>(
      `
        select id, tabela_preco_id as "tabelaPrecoId", ${resourceIdColumn} as "recursoId", valor_hora as "valorHora"
        from public.${pricingTable}
        where tabela_preco_id = $1
        order by created_at asc
      `,
      tabelaPrecoId,
    );

    let namesMap = new Map<string, string>();
    let recursos: RecursoOption[] = [];

    if (resourceTableExists) {
      const recursoRows = await prisma.$queryRawUnsafe<Array<{ id: string; nome: string }>>(
        `select id::text as id, nome from public.${resourceTable} order by nome asc`,
      );
      namesMap = new Map(recursoRows.map((item) => [item.id, item.nome]));
      recursos = recursoRows;
    }

    const items: TabelaPrecoRecursoRecord[] = rows.map((row) => ({
      id: row.id,
      tabelaPrecoId: row.tabelaPrecoId,
      recursoId: row.recursoId,
      valorHora: Number(row.valorHora),
      recursoNome: namesMap.get(row.recursoId) || 'Desconhecido',
    }));

    return { items, recursos };
  }

  async addRecurso(input: AddTabelaPrecoRecursoInput) {
    await ensureSchema();
    const pricingTable = getPricingTable(input.tipo);
    const resourceIdColumn = getResourceIdColumn(input.tipo);
    const id = randomUUID();

    await prisma.$executeRawUnsafe(
      `
        insert into public.${pricingTable} (
          id,
          tenant_id,
          tabela_preco_id,
          ${resourceIdColumn},
          valor_hora
        ) values ($1, $2, $3, $4, $5)
      `,
      id,
      input.tenantId,
      input.tabelaPrecoId,
      input.recursoId,
      input.valorHora,
    );

    return id;
  }

  async removeRecurso(id: string, tipo: 'tecnico' | 'fisico') {
    await ensureSchema();
    const pricingTable = getPricingTable(tipo);
    await prisma.$executeRawUnsafe(`delete from public.${pricingTable} where id = $1`, id);
  }
}
