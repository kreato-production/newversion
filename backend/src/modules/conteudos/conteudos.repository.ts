import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type ConteudoRecord = {
  id: string;
  tenantId: string | null;
  codigoExterno: string | null;
  descricao: string;
  quantidadeEpisodios: number | null;
  centroLucroId: string | null;
  centroLucroNome: string | null;
  unidadeNegocioId: string | null;
  unidadeNegocioNome: string | null;
  programaId: string | null;
  programaNome: string | null;
  tipoConteudoId: string | null;
  tipoConteudoNome: string | null;
  classificacaoId: string | null;
  classificacaoNome: string | null;
  anoProducao: string | null;
  sinopse: string | null;
  orcamento: number;
  tabelaPrecoId: string | null;
  tabelaPrecoNome: string | null;
  frequenciaDataInicio: string | null;
  frequenciaDataFim: string | null;
  frequenciaDiasSemana: number[] | null;
  createdBy: string | null;
  createdAt: Date | null;
};

export type SaveConteudoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  descricao: string;
  quantidadeEpisodios?: number | null;
  centroLucroId?: string | null;
  unidadeNegocioId?: string | null;
  programaId?: string | null;
  tipoConteudoId?: string | null;
  classificacaoId?: string | null;
  anoProducao?: string | null;
  sinopse?: string | null;
  orcamento?: number | null;
  tabelaPrecoId?: string | null;
  frequenciaDataInicio?: string | null;
  frequenciaDataFim?: string | null;
  frequenciaDiasSemana?: number[] | null;
  createdBy?: string | null;
};

export type ConteudoFormOptions = {
  centrosLucro: Array<{ id: string; nome: string; parentId: string | null; status: string }>;
  statusList: Array<{ id: string; nome: string; cor: string }>;
  unidades: Array<{ id: string; nome: string; moeda: string | null }>;
  tipos: Array<{ id: string; nome: string }>;
  classificacoes: Array<{ id: string; nome: string }>;
  centroLucroUnidades: Array<{ centroLucroId: string; unidadeNegocioId: string }>;
  tabelasPreco: Array<{ id: string; nome: string; unidadeNegocioId: string | null }>;
  programas: Array<{ id: string; nome: string; unidadeNegocioId: string | null }>;
};

export type ListOptions = {
  limit?: number;
  offset?: number;
  unidadeIds?: string[];
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
};

export interface ConteudosRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<ConteudoRecord>>;
  findById(id: string): Promise<ConteudoRecord | null>;
  save(input: SaveConteudoInput): Promise<ConteudoRecord>;
  remove(id: string): Promise<void>;
  hasLinkedGravacoes(id: string): Promise<boolean>;
  listOptions(tenantId: string, unidadeIds?: string[]): Promise<ConteudoFormOptions>;
}

type ConteudoQueryRow = {
  id: string;
  tenantId: string | null;
  codigoExterno: string | null;
  descricao: string;
  quantidadeEpisodios: number | null;
  centroLucroId: string | null;
  centroLucroNome: string | null;
  unidadeNegocioId: string | null;
  unidadeNegocioNome: string | null;
  programaId: string | null;
  programaNome: string | null;
  tipoConteudoId: string | null;
  tipoConteudoNome: string | null;
  classificacaoId: string | null;
  classificacaoNome: string | null;
  anoProducao: string | null;
  sinopse: string | null;
  orcamento: Prisma.Decimal | number | null;
  tabelaPrecoId: string | null;
  tabelaPrecoNome: string | null;
  frequenciaDataInicio: Date | null;
  frequenciaDataFim: Date | null;
  frequenciaDiasSemana: number[] | null;
  createdBy: string | null;
  createdAt: Date | null;
};

let ensureSchemaPromise: Promise<void> | null = null;

async function ensureConteudosSchema() {
  ensureSchemaPromise ??= (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.conteudos (
        id text PRIMARY KEY,
        tenant_id uuid NULL,
        codigo_externo text NULL,
        descricao text NOT NULL,
        quantidade_episodios integer NULL,
        centro_lucro_id text NULL,
        unidade_negocio_id uuid NULL,
        programa_id uuid NULL,
        tipo_conteudo_id text NULL,
        classificacao_id text NULL,
        ano_producao text NULL,
        sinopse text NULL,
        orcamento numeric(12, 2) NULL DEFAULT 0,
        tabela_preco_id text NULL,
        frequencia_data_inicio date NULL,
        frequencia_data_fim date NULL,
        frequencia_dias_semana integer[] NULL,
        created_by text NULL,
        created_at timestamptz NULL DEFAULT now(),
        updated_at timestamptz NULL DEFAULT now()
      )
    `);
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS conteudos_tenant_id_idx ON public.conteudos (tenant_id)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS conteudos_unidade_negocio_id_idx ON public.conteudos (unidade_negocio_id)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS conteudos_programa_id_idx ON public.conteudos (programa_id)');
  })();

  await ensureSchemaPromise;
}

function mapConteudo(row: ConteudoQueryRow): ConteudoRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    codigoExterno: row.codigoExterno,
    descricao: row.descricao,
    quantidadeEpisodios: row.quantidadeEpisodios,
    centroLucroId: row.centroLucroId,
    centroLucroNome: row.centroLucroNome,
    unidadeNegocioId: row.unidadeNegocioId,
    unidadeNegocioNome: row.unidadeNegocioNome,
    programaId: row.programaId,
    programaNome: row.programaNome,
    tipoConteudoId: row.tipoConteudoId,
    tipoConteudoNome: row.tipoConteudoNome,
    classificacaoId: row.classificacaoId,
    classificacaoNome: row.classificacaoNome,
    anoProducao: row.anoProducao,
    sinopse: row.sinopse,
    orcamento: row.orcamento == null ? 0 : Number(row.orcamento),
    tabelaPrecoId: row.tabelaPrecoId,
    tabelaPrecoNome: row.tabelaPrecoNome,
    frequenciaDataInicio: row.frequenciaDataInicio ? row.frequenciaDataInicio.toISOString().slice(0, 10) : null,
    frequenciaDataFim: row.frequenciaDataFim ? row.frequenciaDataFim.toISOString().slice(0, 10) : null,
    frequenciaDiasSemana: row.frequenciaDiasSemana,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    select to_regclass(${`public.${tableName}`}) is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

function buildUnitFilter(unidadeIds?: string[]) {
  if (!unidadeIds || unidadeIds.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql`and c.unidade_negocio_id in (${Prisma.join(unidadeIds)})`;
}

const conteudoBaseSelect = Prisma.sql`
  select
    c.id,
    c.tenant_id::text as "tenantId",
    c.codigo_externo as "codigoExterno",
    c.descricao,
    c.quantidade_episodios as "quantidadeEpisodios",
    c.centro_lucro_id as "centroLucroId",
    cl.nome as "centroLucroNome",
    c.unidade_negocio_id::text as "unidadeNegocioId",
    un.nome as "unidadeNegocioNome",
    c.programa_id::text as "programaId",
    p.nome as "programaNome",
    c.tipo_conteudo_id as "tipoConteudoId",
    tg.nome as "tipoConteudoNome",
    c.classificacao_id as "classificacaoId",
    cf.nome as "classificacaoNome",
    c.ano_producao as "anoProducao",
    c.sinopse,
    c.orcamento,
    c.tabela_preco_id as "tabelaPrecoId",
    null::text as "tabelaPrecoNome",
    c.frequencia_data_inicio as "frequenciaDataInicio",
    c.frequencia_data_fim as "frequenciaDataFim",
    c.frequencia_dias_semana as "frequenciaDiasSemana",
    c.created_by as "createdBy",
    c.created_at as "createdAt"
  from public.conteudos c
  left join public.centros_lucro cl on cl.id = c.centro_lucro_id
  left join public.unidades_negocio un on un.id = c.unidade_negocio_id
  left join public.programas p on p.id = c.programa_id
  left join public.tipos_gravacao tg on tg.id = c.tipo_conteudo_id
  left join public.classificacoes cf on cf.id = c.classificacao_id
`;

export class PrismaConteudosRepository implements ConteudosRepository {
  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<ConteudoRecord>> {
    await ensureConteudosSchema();

    const take = Math.min(opts?.limit ?? 100, 200);
    const skip = opts?.offset ?? 0;
    const unitFilter = buildUnitFilter(opts?.unidadeIds);

    const countRows = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      select count(*)::bigint as total
      from public.conteudos c
      where c.tenant_id = ${tenantId}::uuid
      ${unitFilter}
    `);

    const rows = await prisma.$queryRaw<ConteudoQueryRow[]>(Prisma.sql`
      ${conteudoBaseSelect}
      where c.tenant_id = ${tenantId}::uuid
      ${unitFilter}
      order by c.descricao asc
      limit ${take}
      offset ${skip}
    `);

    return {
      total: Number(countRows[0]?.total ?? 0n),
      data: rows.map(mapConteudo),
    };
  }

  async findById(id: string): Promise<ConteudoRecord | null> {
    await ensureConteudosSchema();

    const rows = await prisma.$queryRaw<ConteudoQueryRow[]>(Prisma.sql`
      ${conteudoBaseSelect}
      where c.id = ${id}
      limit 1
    `);

    return rows[0] ? mapConteudo(rows[0]) : null;
  }

  async save(input: SaveConteudoInput): Promise<ConteudoRecord> {
    await ensureConteudosSchema();

    const id = input.id ?? randomUUID();

    const exists = await this.findById(id);

    if (exists) {
      await prisma.$executeRaw`
        update public.conteudos
        set
          codigo_externo = ${input.codigoExterno ?? null},
          descricao = ${input.descricao},
          quantidade_episodios = ${input.quantidadeEpisodios ?? null},
          centro_lucro_id = ${input.centroLucroId ?? null},
          unidade_negocio_id = ${input.unidadeNegocioId ? Prisma.sql`${input.unidadeNegocioId}::uuid` : Prisma.sql`null`}::uuid,
          programa_id = ${input.programaId ? Prisma.sql`${input.programaId}::uuid` : Prisma.sql`null`}::uuid,
          tipo_conteudo_id = ${input.tipoConteudoId ?? null},
          classificacao_id = ${input.classificacaoId ?? null},
          ano_producao = ${input.anoProducao ?? null},
          sinopse = ${input.sinopse ?? null},
          orcamento = ${input.orcamento ?? 0},
          tabela_preco_id = ${input.tabelaPrecoId ?? null},
          frequencia_data_inicio = ${input.frequenciaDataInicio ? Prisma.sql`${input.frequenciaDataInicio}::date` : Prisma.sql`null`}::date,
          frequencia_data_fim = ${input.frequenciaDataFim ? Prisma.sql`${input.frequenciaDataFim}::date` : Prisma.sql`null`}::date,
          frequencia_dias_semana = ${input.frequenciaDiasSemana ? input.frequenciaDiasSemana : null},
          created_by = ${input.createdBy ?? null},
          updated_at = now()
        where id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        insert into public.conteudos (
          id,
          tenant_id,
          codigo_externo,
          descricao,
          quantidade_episodios,
          centro_lucro_id,
          unidade_negocio_id,
          programa_id,
          tipo_conteudo_id,
          classificacao_id,
          ano_producao,
          sinopse,
          orcamento,
          tabela_preco_id,
          frequencia_data_inicio,
          frequencia_data_fim,
          frequencia_dias_semana,
          created_by
        ) values (
          ${id},
          ${input.tenantId}::uuid,
          ${input.codigoExterno ?? null},
          ${input.descricao},
          ${input.quantidadeEpisodios ?? null},
          ${input.centroLucroId ?? null},
          ${input.unidadeNegocioId ? Prisma.sql`${input.unidadeNegocioId}::uuid` : Prisma.sql`null`}::uuid,
          ${input.programaId ? Prisma.sql`${input.programaId}::uuid` : Prisma.sql`null`}::uuid,
          ${input.tipoConteudoId ?? null},
          ${input.classificacaoId ?? null},
          ${input.anoProducao ?? null},
          ${input.sinopse ?? null},
          ${input.orcamento ?? 0},
          ${input.tabelaPrecoId ?? null},
          ${input.frequenciaDataInicio ? Prisma.sql`${input.frequenciaDataInicio}::date` : Prisma.sql`null`}::date,
          ${input.frequenciaDataFim ? Prisma.sql`${input.frequenciaDataFim}::date` : Prisma.sql`null`}::date,
          ${input.frequenciaDiasSemana ? input.frequenciaDiasSemana : null},
          ${input.createdBy ?? null}
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Conteudo nao encontrado apos salvar');
    }
    return saved;
  }

  async remove(id: string): Promise<void> {
    await ensureConteudosSchema();
    await prisma.$executeRaw`delete from public.conteudos where id = ${id}`;
  }

  async hasLinkedGravacoes(id: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ total: bigint }>>`
      select count(*)::bigint as total
      from public.gravacoes
      where conteudo_id = ${id}
    `;
    return Number(rows[0]?.total ?? 0n) > 0;
  }

  async listOptions(tenantId: string, unidadeIds?: string[]): Promise<ConteudoFormOptions> {
    await ensureConteudosSchema();

    const unitFilter = unidadeIds && unidadeIds.length > 0
      ? Prisma.sql`and id in (${Prisma.join(unidadeIds)})`
      : Prisma.empty;

    const statusTableExists = await tableExists('status_gravacao');
    const tabelasPrecoTableExists = await tableExists('tabelas_preco');

    const [centrosLucro, unidades, tipos, classificacoes, centroLucroUnidades, programas, statusList, tabelasPreco] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string; nome: string; parentId: string | null; status: string }>>(Prisma.sql`
        select id, nome, parent_id as "parentId", status
        from public.centros_lucro
        where tenant_id = ${tenantId}
          and status = 'Ativo'
        order by nome asc
      `),
      prisma.$queryRaw<Array<{ id: string; nome: string; moeda: string | null }>>(Prisma.sql`
        select id::text as id, nome, moeda
        from public.unidades_negocio
        where tenant_id = ${tenantId}::uuid
        ${unitFilter}
        order by nome asc
      `),
      prisma.$queryRaw<Array<{ id: string; nome: string }>>(Prisma.sql`
        select id, nome
        from public.tipos_gravacao
        where tenant_id = ${tenantId}
        order by nome asc
      `),
      prisma.$queryRaw<Array<{ id: string; nome: string }>>(Prisma.sql`
        select id, nome
        from public.classificacoes
        where tenant_id = ${tenantId}
        order by nome asc
      `),
      prisma.$queryRaw<Array<{ centroLucroId: string; unidadeNegocioId: string }>>(Prisma.sql`
        select centro_lucro_id as "centroLucroId", unidade_negocio_id as "unidadeNegocioId"
        from public.centro_lucro_unidades
        where tenant_id = ${tenantId}
      `),
      prisma.$queryRaw<Array<{ id: string; nome: string; unidadeNegocioId: string | null }>>(Prisma.sql`
        select id::text as id, nome, unidade_negocio_id::text as "unidadeNegocioId"
        from public.programas
        where tenant_id = ${tenantId}::uuid
        order by nome asc
      `),
      statusTableExists
        ? prisma.$queryRaw<Array<{ id: string; nome: string; cor: string }>>(Prisma.sql`
            select id, nome, coalesce(cor, '#888888') as cor
            from public.status_gravacao
            order by nome asc
          `)
        : Promise.resolve([]),
      tabelasPrecoTableExists
        ? prisma.$queryRaw<Array<{ id: string; nome: string; unidadeNegocioId: string | null }>>(Prisma.sql`
            select id, nome, unidade_negocio_id as "unidadeNegocioId"
            from public.tabelas_preco
            where status = 'Ativo'
            order by nome asc
          `)
        : Promise.resolve([]),
    ]);

    return {
      centrosLucro,
      statusList,
      unidades,
      tipos,
      classificacoes,
      centroLucroUnidades,
      tabelasPreco,
      programas,
    };
  }
}
