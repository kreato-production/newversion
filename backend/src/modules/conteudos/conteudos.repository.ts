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

export type ConteudoResourceType = 'tecnico' | 'fisico';

export type ConteudoResourceItemRecord = {
  id: string;
  tenantId: string;
  conteudoId: string;
  tabelaPrecoId: string | null;
  recursoId: string;
  recursoNome: string;
  valorHora: number;
  quantidade: number;
  quantidadeHoras: number;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
};

export type ConteudoAvailableResourceRecord = {
  recursoId: string;
  recursoNome: string;
  valorHora: number;
};

export type ConteudoTerceiroItemRecord = {
  id: string;
  tenantId: string;
  conteudoId: string;
  servicoId: string;
  servicoNome: string;
  valorPrevisto: number;
};

export type ConteudoTerceiroServicoRecord = {
  id: string;
  nome: string;
};

export type SaveConteudoResourceInput = {
  tenantId: string;
  conteudoId: string;
  tabelaPrecoId?: string | null;
  tipo: ConteudoResourceType;
  recursoId: string;
  valorHora: number;
  quantidade: number;
  quantidadeHoras: number;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
};

export type UpdateConteudoResourceInput = {
  id: string;
  quantidade: number;
  quantidadeHoras: number;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
};

export type SaveConteudoTerceiroInput = {
  tenantId: string;
  conteudoId: string;
  servicoId: string;
  valorPrevisto: number;
  createdBy?: string | null;
};

export type UpdateConteudoTerceiroInput = {
  id: string;
  valorPrevisto: number;
};

export type GeneratedConteudoGravacaoRecord = {
  id: string;
  codigo: string;
  codigoExterno: string | null;
  nome: string;
  status: string | null;
  dataPrevista: Date | null;
  createdAt: Date;
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
  listResources(
    tenantId: string,
    conteudoId: string,
    tipo: ConteudoResourceType,
    tabelaPrecoId?: string | null,
  ): Promise<{ items: ConteudoResourceItemRecord[]; availableResources: ConteudoAvailableResourceRecord[] }>;
  findResourceById(id: string, tipo: ConteudoResourceType): Promise<ConteudoResourceItemRecord | null>;
  addResource(input: SaveConteudoResourceInput): Promise<ConteudoResourceItemRecord>;
  updateResource(input: UpdateConteudoResourceInput, tipo: ConteudoResourceType): Promise<ConteudoResourceItemRecord | null>;
  removeResource(id: string, tipo: ConteudoResourceType): Promise<void>;
  listTerceiros(
    tenantId: string,
    conteudoId: string,
  ): Promise<{ items: ConteudoTerceiroItemRecord[]; servicos: ConteudoTerceiroServicoRecord[] }>;
  findTerceiroById(id: string): Promise<ConteudoTerceiroItemRecord | null>;
  addTerceiro(input: SaveConteudoTerceiroInput): Promise<ConteudoTerceiroItemRecord>;
  updateTerceiro(input: UpdateConteudoTerceiroInput): Promise<ConteudoTerceiroItemRecord | null>;
  removeTerceiro(id: string): Promise<void>;
  generateGravacoes(input: { tenantId: string; conteudoId: string; createdById?: string | null }): Promise<GeneratedConteudoGravacaoRecord[]>;
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
  if (!ensureSchemaPromise) {
    const promise = (async () => {
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
      // Parametro tables used in JOINs and FKs — created here so conteudos can
      // always query them regardless of whether the parametros module was accessed first.
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.servicos (
          id text PRIMARY KEY,
          tenant_id text NULL,
          codigo_externo text NULL,
          nome text NOT NULL,
          descricao text NULL,
          created_by text NULL,
          created_at timestamptz NULL DEFAULT now(),
          updated_at timestamptz NULL DEFAULT now()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.tipos_gravacao (
          id text PRIMARY KEY,
          tenant_id text NULL,
          codigo_externo text NULL,
          nome text NOT NULL,
          descricao text NULL,
          created_by text NULL,
          created_at timestamptz NULL DEFAULT now(),
          updated_at timestamptz NULL DEFAULT now()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.classificacoes (
          id text PRIMARY KEY,
          tenant_id text NULL,
          codigo_externo text NULL,
          nome text NOT NULL,
          descricao text NULL,
          created_by text NULL,
          created_at timestamptz NULL DEFAULT now(),
          updated_at timestamptz NULL DEFAULT now()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.conteudo_recursos_tecnicos (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          conteudo_id text NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
          tabela_preco_id text NULL,
          recurso_tecnico_id text NOT NULL,
          valor_hora numeric(12, 2) NULL DEFAULT 0,
          quantidade integer NULL DEFAULT 1,
          quantidade_horas numeric(12, 2) NULL DEFAULT 0,
          valor_total numeric(12, 2) NULL DEFAULT 0,
          desconto_percentual numeric(5, 2) NULL DEFAULT 0,
          valor_com_desconto numeric(12, 2) NULL DEFAULT 0,
          created_at timestamptz NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.conteudo_recursos_fisicos (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          conteudo_id text NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
          tabela_preco_id text NULL,
          recurso_fisico_id text NOT NULL,
          valor_hora numeric(12, 2) NULL DEFAULT 0,
          quantidade integer NULL DEFAULT 1,
          quantidade_horas numeric(12, 2) NULL DEFAULT 0,
          valor_total numeric(12, 2) NULL DEFAULT 0,
          desconto_percentual numeric(5, 2) NULL DEFAULT 0,
          valor_com_desconto numeric(12, 2) NULL DEFAULT 0,
          created_at timestamptz NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.conteudo_terceiros (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          conteudo_id text NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
          servico_id text NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
          valor_previsto numeric(12, 2) NULL DEFAULT 0,
          created_by text NULL,
          created_at timestamptz NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.gravacao_recursos (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
          recurso_tecnico_id text NULL,
          recurso_fisico_id text NULL,
          recurso_humano_id text NULL,
          estoque_item_id text NULL,
          parent_recurso_id text NULL REFERENCES public.gravacao_recursos(id) ON DELETE CASCADE,
          hora_inicio text NULL,
          hora_fim text NULL,
          created_at timestamptz NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS conteudo_recursos_tecnicos_conteudo_idx ON public.conteudo_recursos_tecnicos (conteudo_id)');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS conteudo_recursos_fisicos_conteudo_idx ON public.conteudo_recursos_fisicos (conteudo_id)');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS conteudo_terceiros_conteudo_idx ON public.conteudo_terceiros (conteudo_id)');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS gravacao_recursos_gravacao_idx ON public.gravacao_recursos (gravacao_id)');
    })();
    promise.catch(() => {
      // Reset so the next request can retry instead of receiving the cached rejection.
      if (ensureSchemaPromise === promise) {
        ensureSchemaPromise = null;
      }
    });
    ensureSchemaPromise = promise;
  }

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

  return Prisma.sql`and c.unidade_negocio_id::text in (${Prisma.join(unidadeIds)})`;
}

function toNumber(value: Prisma.Decimal | number | string | null | undefined, fallback = 0): number {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return value.toNumber();
}

function buildContentResourceTableNames(tipo: ConteudoResourceType) {
  if (tipo === 'tecnico') {
    return {
      relationTable: 'conteudo_recursos_tecnicos',
      relationIdColumn: 'recurso_tecnico_id',
      priceTable: 'tabela_preco_recursos_tecnicos',
      resourceTable: 'recursos_tecnicos',
    };
  }

  return {
    relationTable: 'conteudo_recursos_fisicos',
    relationIdColumn: 'recurso_fisico_id',
    priceTable: 'tabela_preco_recursos_fisicos',
    resourceTable: 'recursos_fisicos',
  };
}

function generateGravacaoCodigo(): string {
  const currentYear = new Date().getFullYear();
  const suffix = `${Date.now()}`.slice(-8);
  return `${currentYear}${suffix}`;
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
      ? Prisma.sql`and id::text in (${Prisma.join(unidadeIds)})`
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

  async listResources(
    tenantId: string,
    conteudoId: string,
    tipo: ConteudoResourceType,
    tabelaPrecoId?: string | null,
  ): Promise<{ items: ConteudoResourceItemRecord[]; availableResources: ConteudoAvailableResourceRecord[] }> {
    await ensureConteudosSchema();

    const names = buildContentResourceTableNames(tipo);
    const itemTable = Prisma.raw(names.relationTable);
    const itemResourceColumn = Prisma.raw(names.relationIdColumn);
    const priceTable = Prisma.raw(names.priceTable);
    const resourceTable = Prisma.raw(names.resourceTable);
    const tabelaFilter = tabelaPrecoId
      ? Prisma.sql`and tabela_preco_id = ${tabelaPrecoId}`
      : Prisma.empty;

    const itemsRows = await prisma.$queryRaw<Array<{
      id: string;
      tenantId: string;
      conteudoId: string;
      tabelaPrecoId: string | null;
      recursoId: string;
      recursoNome: string | null;
      valorHora: Prisma.Decimal | number | string | null;
      quantidade: number | null;
      quantidadeHoras: Prisma.Decimal | number | string | null;
      valorTotal: Prisma.Decimal | number | string | null;
      descontoPercentual: Prisma.Decimal | number | string | null;
      valorComDesconto: Prisma.Decimal | number | string | null;
    }>>(Prisma.sql`
      select
        cr.id,
        cr.tenant_id as "tenantId",
        cr.conteudo_id as "conteudoId",
        cr.tabela_preco_id as "tabelaPrecoId",
        cr.${itemResourceColumn} as "recursoId",
        r.nome as "recursoNome",
        cr.valor_hora as "valorHora",
        cr.quantidade,
        cr.quantidade_horas as "quantidadeHoras",
        cr.valor_total as "valorTotal",
        cr.desconto_percentual as "descontoPercentual",
        cr.valor_com_desconto as "valorComDesconto"
      from ${itemTable} cr
      left join ${resourceTable} r on r.id = cr.${itemResourceColumn}
      where cr.tenant_id = ${tenantId}
        and cr.conteudo_id = ${conteudoId}
        ${tabelaFilter}
      order by r.nome asc, cr.id asc
    `);

    const priceRows = tabelaPrecoId && await tableExists(names.priceTable)
      ? await prisma.$queryRaw<Array<{
          recursoId: string;
          recursoNome: string | null;
          valorHora: Prisma.Decimal | number | string | null;
        }>>(Prisma.sql`
          select
            tp.${itemResourceColumn} as "recursoId",
            r.nome as "recursoNome",
            tp.valor_hora as "valorHora"
          from ${priceTable} tp
          left join ${resourceTable} r on r.id = tp.${itemResourceColumn}
          where tp.tabela_preco_id = ${tabelaPrecoId}
          order by r.nome asc
        `)
      : [];

    const items = itemsRows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      conteudoId: row.conteudoId,
      tabelaPrecoId: row.tabelaPrecoId,
      recursoId: row.recursoId,
      recursoNome: row.recursoNome || 'Desconhecido',
      valorHora: toNumber(row.valorHora),
      quantidade: row.quantidade ?? 1,
      quantidadeHoras: toNumber(row.quantidadeHoras),
      valorTotal: toNumber(row.valorTotal),
      descontoPercentual: toNumber(row.descontoPercentual),
      valorComDesconto: toNumber(row.valorComDesconto),
    }));

    const addedIds = new Set(items.map((item) => item.recursoId));
    const availableResources = priceRows
      .filter((row) => !addedIds.has(row.recursoId))
      .map((row) => ({
        recursoId: row.recursoId,
        recursoNome: row.recursoNome || 'Desconhecido',
        valorHora: toNumber(row.valorHora),
      }));

    return { items, availableResources };
  }

  async findResourceById(id: string, tipo: ConteudoResourceType): Promise<ConteudoResourceItemRecord | null> {
    await ensureConteudosSchema();

    const names = buildContentResourceTableNames(tipo);
    const itemTable = Prisma.raw(names.relationTable);
    const itemResourceColumn = Prisma.raw(names.relationIdColumn);
    const resourceTable = Prisma.raw(names.resourceTable);

    const rows = await prisma.$queryRaw<Array<{
      id: string;
      tenantId: string;
      conteudoId: string;
      tabelaPrecoId: string | null;
      recursoId: string;
      recursoNome: string | null;
      valorHora: Prisma.Decimal | number | string | null;
      quantidade: number | null;
      quantidadeHoras: Prisma.Decimal | number | string | null;
      valorTotal: Prisma.Decimal | number | string | null;
      descontoPercentual: Prisma.Decimal | number | string | null;
      valorComDesconto: Prisma.Decimal | number | string | null;
    }>>(Prisma.sql`
      select
        cr.id,
        cr.tenant_id as "tenantId",
        cr.conteudo_id as "conteudoId",
        cr.tabela_preco_id as "tabelaPrecoId",
        cr.${itemResourceColumn} as "recursoId",
        r.nome as "recursoNome",
        cr.valor_hora as "valorHora",
        cr.quantidade,
        cr.quantidade_horas as "quantidadeHoras",
        cr.valor_total as "valorTotal",
        cr.desconto_percentual as "descontoPercentual",
        cr.valor_com_desconto as "valorComDesconto"
      from ${itemTable} cr
      left join ${resourceTable} r on r.id = cr.${itemResourceColumn}
      where cr.id = ${id}
      limit 1
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      tenantId: row.tenantId,
      conteudoId: row.conteudoId,
      tabelaPrecoId: row.tabelaPrecoId,
      recursoId: row.recursoId,
      recursoNome: row.recursoNome || 'Desconhecido',
      valorHora: toNumber(row.valorHora),
      quantidade: row.quantidade ?? 1,
      quantidadeHoras: toNumber(row.quantidadeHoras),
      valorTotal: toNumber(row.valorTotal),
      descontoPercentual: toNumber(row.descontoPercentual),
      valorComDesconto: toNumber(row.valorComDesconto),
    };
  }

  async addResource(input: SaveConteudoResourceInput): Promise<ConteudoResourceItemRecord> {
    await ensureConteudosSchema();

    const names = buildContentResourceTableNames(input.tipo);
    const itemTable = Prisma.raw(names.relationTable);
    const itemResourceColumn = Prisma.raw(names.relationIdColumn);
    const id = randomUUID();

    await prisma.$executeRaw(Prisma.sql`
      insert into ${itemTable} (
        id,
        tenant_id,
        conteudo_id,
        tabela_preco_id,
        ${itemResourceColumn},
        valor_hora,
        quantidade,
        quantidade_horas,
        valor_total,
        desconto_percentual,
        valor_com_desconto
      ) values (
        ${id},
        ${input.tenantId},
        ${input.conteudoId},
        ${input.tabelaPrecoId ?? null},
        ${input.recursoId},
        ${input.valorHora},
        ${input.quantidade},
        ${input.quantidadeHoras},
        ${input.valorTotal},
        ${input.descontoPercentual},
        ${input.valorComDesconto}
      )
    `);

    const saved = await this.findResourceById(id, input.tipo);
    if (!saved) {
      throw new Error('Recurso do conteudo nao encontrado apos salvar');
    }

    return saved;
  }

  async updateResource(input: UpdateConteudoResourceInput, tipo: ConteudoResourceType): Promise<ConteudoResourceItemRecord | null> {
    await ensureConteudosSchema();
    const names = buildContentResourceTableNames(tipo);
    const itemTable = Prisma.raw(names.relationTable);

    await prisma.$executeRaw(Prisma.sql`
      update ${itemTable}
      set
        quantidade = ${input.quantidade},
        quantidade_horas = ${input.quantidadeHoras},
        valor_total = ${input.valorTotal},
        desconto_percentual = ${input.descontoPercentual},
        valor_com_desconto = ${input.valorComDesconto}
      where id = ${input.id}
    `);

    return this.findResourceById(input.id, tipo);
  }

  async removeResource(id: string, tipo: ConteudoResourceType): Promise<void> {
    await ensureConteudosSchema();
    const names = buildContentResourceTableNames(tipo);
    const itemTable = Prisma.raw(names.relationTable);
    await prisma.$executeRaw(Prisma.sql`delete from ${itemTable} where id = ${id}`);
  }

  async listTerceiros(
    tenantId: string,
    conteudoId: string,
  ): Promise<{ items: ConteudoTerceiroItemRecord[]; servicos: ConteudoTerceiroServicoRecord[] }> {
    await ensureConteudosSchema();

    const [itemsRows, servicos] = await Promise.all([
      prisma.$queryRaw<Array<{
        id: string;
        tenantId: string;
        conteudoId: string;
        servicoId: string;
        servicoNome: string | null;
        valorPrevisto: Prisma.Decimal | number | string | null;
      }>>(Prisma.sql`
        select
          ct.id,
          ct.tenant_id as "tenantId",
          ct.conteudo_id as "conteudoId",
          ct.servico_id as "servicoId",
          s.nome as "servicoNome",
          ct.valor_previsto as "valorPrevisto"
        from public.conteudo_terceiros ct
        left join public.servicos s on s.id = ct.servico_id
        where ct.tenant_id = ${tenantId}
          and ct.conteudo_id = ${conteudoId}
        order by s.nome asc, ct.id asc
      `),
      prisma.$queryRaw<Array<{ id: string; nome: string }>>(Prisma.sql`
        select id, nome
        from public.servicos
        where tenant_id = ${tenantId}
        order by nome asc
      `),
    ]);

    return {
      items: itemsRows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        conteudoId: row.conteudoId,
        servicoId: row.servicoId,
        servicoNome: row.servicoNome || 'Serviço',
        valorPrevisto: toNumber(row.valorPrevisto),
      })),
      servicos,
    };
  }

  async findTerceiroById(id: string): Promise<ConteudoTerceiroItemRecord | null> {
    await ensureConteudosSchema();

    const rows = await prisma.$queryRaw<Array<{
      id: string;
      tenantId: string;
      conteudoId: string;
      servicoId: string;
      servicoNome: string | null;
      valorPrevisto: Prisma.Decimal | number | string | null;
    }>>(Prisma.sql`
      select
        ct.id,
        ct.tenant_id as "tenantId",
        ct.conteudo_id as "conteudoId",
        ct.servico_id as "servicoId",
        s.nome as "servicoNome",
        ct.valor_previsto as "valorPrevisto"
      from public.conteudo_terceiros ct
      left join public.servicos s on s.id = ct.servico_id
      where ct.id = ${id}
      limit 1
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      tenantId: row.tenantId,
      conteudoId: row.conteudoId,
      servicoId: row.servicoId,
      servicoNome: row.servicoNome || 'Serviço',
      valorPrevisto: toNumber(row.valorPrevisto),
    };
  }

  async addTerceiro(input: SaveConteudoTerceiroInput): Promise<ConteudoTerceiroItemRecord> {
    await ensureConteudosSchema();

    const id = randomUUID();
    await prisma.$executeRaw`
      insert into public.conteudo_terceiros (
        id,
        tenant_id,
        conteudo_id,
        servico_id,
        valor_previsto,
        created_by
      ) values (
        ${id},
        ${input.tenantId},
        ${input.conteudoId},
        ${input.servicoId},
        ${input.valorPrevisto},
        ${input.createdBy ?? null}
      )
    `;

    const saved = await this.findTerceiroById(id);
    if (!saved) {
      throw new Error('Terceiro do conteudo nao encontrado apos salvar');
    }

    return saved;
  }

  async updateTerceiro(input: UpdateConteudoTerceiroInput): Promise<ConteudoTerceiroItemRecord | null> {
    await ensureConteudosSchema();

    await prisma.$executeRaw`
      update public.conteudo_terceiros
      set valor_previsto = ${input.valorPrevisto}
      where id = ${input.id}
    `;

    return this.findTerceiroById(input.id);
  }

  async removeTerceiro(id: string): Promise<void> {
    await ensureConteudosSchema();
    await prisma.$executeRaw`delete from public.conteudo_terceiros where id = ${id}`;
  }

  async generateGravacoes(input: { tenantId: string; conteudoId: string; createdById?: string | null }): Promise<GeneratedConteudoGravacaoRecord[]> {
    await ensureConteudosSchema();

    const conteudo = await this.findById(input.conteudoId);
    if (!conteudo) {
      throw new Error('Conteudo nao encontrado');
    }

    const quantidade = conteudo.quantidadeEpisodios ?? 0;
    if (quantidade <= 0) {
      return [];
    }

    const existing = await prisma.gravacao.findMany({
      where: {
        tenantId: input.tenantId,
        conteudoId: input.conteudoId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    });

    if (existing.length >= quantidade) {
      return [];
    }

    const statusRow = (await tableExists('status_gravacao'))
      ? (await prisma.$queryRaw<Array<{ nome: string | null }>>(Prisma.sql`
          select nome
          from public.status_gravacao
          where is_inicial = true
          order by nome asc
          limit 1
        `))[0]
        ?? (await prisma.$queryRaw<Array<{ nome: string | null }>>(Prisma.sql`
          select nome
          from public.status_gravacao
          order by nome asc
          limit 1
        `))[0]
      : null;

    const statusNome = statusRow?.nome || 'Planejada';
    const totalToGenerate = quantidade - existing.length;
    const startEpisode = existing.length + 1;
    const orcamentoPorGravacao =
      conteudo.orcamento > 0 && quantidade > 0 ? conteudo.orcamento / quantidade : 0;

    const recursosTecnicos = await prisma.$queryRaw<Array<{
      recursoId: string;
      quantidade: number | null;
      quantidadeHoras: Prisma.Decimal | number | string | null;
    }>>(Prisma.sql`
      select
        recurso_tecnico_id as "recursoId",
        quantidade,
        quantidade_horas as "quantidadeHoras"
      from public.conteudo_recursos_tecnicos
      where tenant_id = ${input.tenantId}
        and conteudo_id = ${input.conteudoId}
    `);

    const recursosFisicos = await prisma.$queryRaw<Array<{
      recursoId: string;
      quantidade: number | null;
      quantidadeHoras: Prisma.Decimal | number | string | null;
    }>>(Prisma.sql`
      select
        recurso_fisico_id as "recursoId",
        quantidade,
        quantidade_horas as "quantidadeHoras"
      from public.conteudo_recursos_fisicos
      where tenant_id = ${input.tenantId}
        and conteudo_id = ${input.conteudoId}
    `);

    const frequencyDates = [];
    if (conteudo.frequenciaDataInicio && conteudo.frequenciaDataFim && conteudo.frequenciaDiasSemana?.length) {
      const current = new Date(`${conteudo.frequenciaDataInicio}T00:00:00.000Z`);
      const end = new Date(`${conteudo.frequenciaDataFim}T00:00:00.000Z`);
      while (current <= end) {
        if (conteudo.frequenciaDiasSemana.includes(current.getUTCDay())) {
          frequencyDates.push(current.toISOString().slice(0, 10));
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    const createdIds: string[] = [];
    for (let index = 0; index < totalToGenerate; index += 1) {
      const episodeNumber = startEpisode + index;
      const gravacao = await prisma.gravacao.create({
        data: {
          tenantId: input.tenantId,
          codigo: generateGravacaoCodigo(),
          codigoExterno: null,
          nome: `${conteudo.descricao} - Episódio ${episodeNumber}`,
          descricao: null,
          unidadeNegocioId: conteudo.unidadeNegocioId ?? null,
          centroLucro: conteudo.centroLucroNome ?? null,
          classificacao: conteudo.classificacaoNome ?? null,
          tipoConteudo: conteudo.tipoConteudoNome ?? null,
          status: statusNome,
          dataPrevista: frequencyDates[episodeNumber - 1]
            ? new Date(`${frequencyDates[episodeNumber - 1]}T00:00:00.000Z`)
            : null,
          conteudoId: input.conteudoId,
          orcamento: orcamentoPorGravacao,
          programaId: conteudo.programaId ?? null,
          createdById: input.createdById ?? null,
        },
        select: { id: true },
      });

      createdIds.push(gravacao.id);

      const toTimeRange = (value: Prisma.Decimal | number | string | null) => {
        const hours = toNumber(value);
        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return {
          horaInicio: '00:00',
          horaFim: `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}`,
        };
      };

      for (const item of recursosTecnicos) {
        const quantity = Math.max(1, item.quantidade ?? 1);
        const timeRange = toTimeRange(item.quantidadeHoras);
        for (let i = 0; i < quantity; i += 1) {
          await prisma.$executeRaw`
            insert into public.gravacao_recursos (
              id,
              tenant_id,
              gravacao_id,
              recurso_tecnico_id,
              recurso_humano_id,
              recurso_fisico_id,
              hora_inicio,
              hora_fim
            ) values (
              ${randomUUID()},
              ${input.tenantId},
              ${gravacao.id},
              ${item.recursoId},
              null,
              null,
              ${timeRange.horaInicio},
              ${timeRange.horaFim}
            )
          `;
        }
      }

      for (const item of recursosFisicos) {
        const quantity = Math.max(1, item.quantidade ?? 1);
        const timeRange = toTimeRange(item.quantidadeHoras);
        for (let i = 0; i < quantity; i += 1) {
          await prisma.$executeRaw`
            insert into public.gravacao_recursos (
              id,
              tenant_id,
              gravacao_id,
              recurso_tecnico_id,
              recurso_humano_id,
              recurso_fisico_id,
              hora_inicio,
              hora_fim
            ) values (
              ${randomUUID()},
              ${input.tenantId},
              ${gravacao.id},
              null,
              null,
              ${item.recursoId},
              ${timeRange.horaInicio},
              ${timeRange.horaFim}
            )
          `;
        }
      }
    }

    if (createdIds.length === 0) {
      return [];
    }

    const rows = await prisma.gravacao.findMany({
      where: {
        id: { in: createdIds },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        codigo: true,
        codigoExterno: true,
        nome: true,
        status: true,
        dataPrevista: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      codigo: row.codigo,
      codigoExterno: row.codigoExterno,
      nome: row.nome,
      status: row.status,
      dataPrevista: row.dataPrevista,
      createdAt: row.createdAt,
    }));
  }
}
