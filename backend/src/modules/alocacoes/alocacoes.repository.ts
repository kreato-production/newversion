import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type GravacaoResumoRecord = {
  id: string;
  tenantId: string;
  nome: string;
  codigo: string;
  dataPrevista: string | null;
  conteudoId: string | null;
};

export type AlocacaoRecord = {
  id: string;
  gravacaoId: string;
  parentRecursoId: string | null;
  recursoTecnicoId: string | null;
  recursoTecnicoNome: string | null;
  recursoTecnicoFuncaoOperador: string | null;
  recursoFisicoId: string | null;
  recursoFisicoNome: string | null;
  recursoHumanoId: string | null;
  recursoHumanoNome: string | null;
  recursoHumanoSobrenome: string | null;
  estoqueItemId: string | null;
  estoqueItemNome: string | null;
  estoqueItemCodigo: string | null;
  estoqueItemNumerador: number | null;
  horaInicio: string | null;
  horaFim: string | null;
};

export type AlocacaoTerceiroRecord = {
  gravacaoId: string;
  valor: number | null;
};

export type AlocacaoConflictRecord = {
  gravacaoId: string;
  gravacaoNome: string;
  dataPrevista: string | null;
};

type AlocacaoRow = {
  id: string;
  gravacaoId: string;
  parentRecursoId: string | null;
  recursoTecnicoId: string | null;
  recursoTecnicoNome: string | null;
  recursoTecnicoFuncaoOperador: string | null;
  recursoFisicoId: string | null;
  recursoFisicoNome: string | null;
  recursoHumanoId: string | null;
  recursoHumanoNome: string | null;
  recursoHumanoSobrenome: string | null;
  estoqueItemId: string | null;
  estoqueItemNome: string | null;
  estoqueItemCodigo: string | null;
  estoqueItemNumerador: number | null;
  horaInicio: string | null;
  horaFim: string | null;
};

type OverviewTerceiroRow = {
  gravacaoId: string;
  valor: Prisma.Decimal | number | string | null;
};

type GravacaoRecursosResourceType = 'tecnico' | 'fisico';

export type SaveAlocacaoAnchorInput = {
  tenantId: string;
  gravacaoId: string;
  tipo: GravacaoRecursosResourceType;
  recursoId: string;
  estoqueItemId?: string | null;
};

export type SaveAlocacaoHorarioInput = {
  id: string;
  tenantId: string;
  gravacaoId: string;
  horaInicio: string | null;
  horaFim: string | null;
  estoqueItemId?: string | null;
};

export type SaveAlocacaoColaboradorInput = {
  tenantId: string;
  gravacaoId: string;
  parentRecursoId: string;
  recursoHumanoId: string;
  horaInicio: string;
  horaFim: string;
};

function toNullableNumber(value: Prisma.Decimal | number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return value.toNumber();
}

export interface AlocacoesRepository {
  findGravacao(id: string): Promise<GravacaoResumoRecord | null>;
  listByGravacao(tenantId: string, gravacaoId: string): Promise<AlocacaoRecord[]>;
  listOverview(tenantId: string): Promise<{ alocacoes: AlocacaoRecord[]; terceiros: AlocacaoTerceiroRecord[] }>;
  listConflicts(
    tenantId: string,
    gravacaoId: string,
    tipo: GravacaoRecursosResourceType,
    recursoId: string,
  ): Promise<AlocacaoConflictRecord[]>;
  findDefaultHours(
    tenantId: string,
    conteudoId: string | null,
    tipo: GravacaoRecursosResourceType,
    recursoId: string,
  ): Promise<number>;
  addAnchor(input: SaveAlocacaoAnchorInput): Promise<AlocacaoRecord>;
  updateHorario(input: SaveAlocacaoHorarioInput): Promise<AlocacaoRecord | null>;
  addColaborador(input: SaveAlocacaoColaboradorInput): Promise<AlocacaoRecord>;
  findAllocationById(id: string): Promise<AlocacaoRecord | null>;
  removeAllocation(id: string): Promise<void>;
}

export class PrismaAlocacoesRepository implements AlocacoesRepository {
  private ready: Promise<void> | null = null;

  async findGravacao(id: string): Promise<GravacaoResumoRecord | null> {
    const gravacao = await prisma.gravacao.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        nome: true,
        codigo: true,
        dataPrevista: true,
        conteudoId: true,
      },
    });

    if (!gravacao) {
      return null;
    }

    return {
      id: gravacao.id,
      tenantId: gravacao.tenantId,
      nome: gravacao.nome,
      codigo: gravacao.codigo,
      dataPrevista: gravacao.dataPrevista ? gravacao.dataPrevista.toISOString().slice(0, 10) : null,
      conteudoId: gravacao.conteudoId,
    };
  }

  async listByGravacao(tenantId: string, gravacaoId: string): Promise<AlocacaoRecord[]> {
    await this.ensureTables();
    const rows = await prisma.$queryRaw<AlocacaoRow[]>(Prisma.sql`
      SELECT
        gr.id,
        gr.gravacao_id AS "gravacaoId",
        gr.parent_recurso_id AS "parentRecursoId",
        gr.recurso_tecnico_id AS "recursoTecnicoId",
        rt.nome AS "recursoTecnicoNome",
        fop.nome AS "recursoTecnicoFuncaoOperador",
        gr.recurso_fisico_id AS "recursoFisicoId",
        rf.nome AS "recursoFisicoNome",
        gr.recurso_humano_id AS "recursoHumanoId",
        rh.nome AS "recursoHumanoNome",
        rh.sobrenome AS "recursoHumanoSobrenome",
        gr.estoque_item_id AS "estoqueItemId",
        ei.nome AS "estoqueItemNome",
        ei.codigo AS "estoqueItemCodigo",
        ei.numerador AS "estoqueItemNumerador",
        gr.hora_inicio AS "horaInicio",
        gr.hora_fim AS "horaFim"
      FROM gravacao_recursos gr
      LEFT JOIN recursos_tecnicos rt ON rt.id = gr.recurso_tecnico_id
      LEFT JOIN funcoes fop ON fop.id = rt.funcao_operador_id
      LEFT JOIN recursos_fisicos rf ON rf.id = gr.recurso_fisico_id
      LEFT JOIN recursos_humanos rh ON rh.id = gr.recurso_humano_id
      LEFT JOIN rf_estoque_itens ei ON ei.id = gr.estoque_item_id
      WHERE gr.tenant_id = ${tenantId}
        AND gr.gravacao_id = ${gravacaoId}
      ORDER BY gr.created_at ASC, gr.id ASC
    `);

    return rows.map((row) => ({
      ...row,
      estoqueItemNumerador: row.estoqueItemNumerador === null ? null : Number(row.estoqueItemNumerador),
    }));
  }

  async listOverview(tenantId: string) {
    await this.ensureTables();

    const [alocacoes, terceiros] = await Promise.all([
      prisma.$queryRaw<AlocacaoRow[]>(Prisma.sql`
        SELECT
          gr.id,
          gr.gravacao_id AS "gravacaoId",
          gr.parent_recurso_id AS "parentRecursoId",
          gr.recurso_tecnico_id AS "recursoTecnicoId",
          rt.nome AS "recursoTecnicoNome",
          fop.nome AS "recursoTecnicoFuncaoOperador",
          gr.recurso_fisico_id AS "recursoFisicoId",
          rf.nome AS "recursoFisicoNome",
          gr.recurso_humano_id AS "recursoHumanoId",
          rh.nome AS "recursoHumanoNome",
          rh.sobrenome AS "recursoHumanoSobrenome",
          gr.estoque_item_id AS "estoqueItemId",
          ei.nome AS "estoqueItemNome",
          ei.codigo AS "estoqueItemCodigo",
          ei.numerador AS "estoqueItemNumerador",
          gr.hora_inicio AS "horaInicio",
          gr.hora_fim AS "horaFim"
        FROM gravacao_recursos gr
        LEFT JOIN recursos_tecnicos rt ON rt.id = gr.recurso_tecnico_id
        LEFT JOIN funcoes fop ON fop.id = rt.funcao_operador_id
        LEFT JOIN recursos_fisicos rf ON rf.id = gr.recurso_fisico_id
        LEFT JOIN recursos_humanos rh ON rh.id = gr.recurso_humano_id
        LEFT JOIN rf_estoque_itens ei ON ei.id = gr.estoque_item_id
        WHERE gr.tenant_id = ${tenantId}
        ORDER BY gr.created_at ASC, gr.id ASC
      `),
      (await this.tableExists('gravacao_terceiros'))
        ? prisma.$queryRaw<OverviewTerceiroRow[]>(Prisma.sql`
            SELECT
              gravacao_id AS "gravacaoId",
              valor
            FROM gravacao_terceiros
            WHERE tenant_id = ${tenantId}
          `)
        : Promise.resolve([]),
    ]);

    return {
      alocacoes: alocacoes.map((row) => ({
        ...row,
        estoqueItemNumerador: row.estoqueItemNumerador === null ? null : Number(row.estoqueItemNumerador),
      })),
      terceiros: terceiros.map((row) => ({
        gravacaoId: row.gravacaoId,
        valor: toNullableNumber(row.valor),
      })),
    };
  }

  async listConflicts(
    tenantId: string,
    gravacaoId: string,
    tipo: GravacaoRecursosResourceType,
    recursoId: string,
  ): Promise<AlocacaoConflictRecord[]> {
    await this.ensureTables();

    const whereColumn = tipo === 'tecnico'
      ? Prisma.sql`recurso_tecnico_id`
      : Prisma.sql`recurso_fisico_id`;

    const rows = await prisma.$queryRaw<Array<{ gravacaoId: string }>>(Prisma.sql`
      SELECT DISTINCT gravacao_id AS "gravacaoId"
      FROM gravacao_recursos
      WHERE tenant_id = ${tenantId}
        AND gravacao_id <> ${gravacaoId}
        AND ${whereColumn} = ${recursoId}
    `);

    if (rows.length === 0) {
      return [];
    }

    const gravacoes = await prisma.gravacao.findMany({
      where: {
        id: { in: rows.map((row) => row.gravacaoId) },
        tenantId,
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
        dataPrevista: true,
      },
      orderBy: {
        dataPrevista: 'asc',
      },
    });

    return gravacoes.map((gravacao) => ({
      gravacaoId: gravacao.id,
      gravacaoNome: gravacao.nome || gravacao.codigo,
      dataPrevista: gravacao.dataPrevista ? gravacao.dataPrevista.toISOString().slice(0, 10) : null,
    }));
  }

  async findDefaultHours(
    tenantId: string,
    conteudoId: string | null,
    tipo: GravacaoRecursosResourceType,
    recursoId: string,
  ): Promise<number> {
    if (!conteudoId) {
      return 0;
    }

    const tableName = tipo === 'tecnico' ? 'conteudo_recursos_tecnicos' : 'conteudo_recursos_fisicos';
    const columnName = tipo === 'tecnico' ? 'recurso_tecnico_id' : 'recurso_fisico_id';

    if (!(await this.tableExists(tableName))) {
      return 0;
    }

    const rows = await prisma.$queryRaw<Array<{ quantidadeHoras: Prisma.Decimal | number | string | null }>>(
      Prisma.sql`
        SELECT quantidade_horas AS "quantidadeHoras"
        FROM ${Prisma.raw(tableName)}
        WHERE conteudo_id = ${conteudoId}
          AND tenant_id = ${tenantId}
          AND ${Prisma.raw(columnName)} = ${recursoId}
        LIMIT 1
      `,
    );

    return toNullableNumber(rows[0]?.quantidadeHoras) ?? 0;
  }

  async addAnchor(input: SaveAlocacaoAnchorInput): Promise<AlocacaoRecord> {
    await this.ensureTables();

    const id = randomUUID();

    if (input.tipo === 'tecnico') {
      await prisma.$executeRaw`
        INSERT INTO gravacao_recursos (
          id, tenant_id, gravacao_id, recurso_tecnico_id, estoque_item_id, created_at
        ) VALUES (
          ${id}, ${input.tenantId}, ${input.gravacaoId}, ${input.recursoId}, ${input.estoqueItemId ?? null}, NOW()
        )
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO gravacao_recursos (
          id, tenant_id, gravacao_id, recurso_fisico_id, estoque_item_id, created_at
        ) VALUES (
          ${id}, ${input.tenantId}, ${input.gravacaoId}, ${input.recursoId}, ${input.estoqueItemId ?? null}, NOW()
        )
      `;
    }

    const saved = await this.findAllocationById(id);
    if (!saved) {
      throw new Error('Alocacao nao encontrada apos salvar');
    }

    return saved;
  }

  async updateHorario(input: SaveAlocacaoHorarioInput): Promise<AlocacaoRecord | null> {
    await this.ensureTables();

    if (typeof input.estoqueItemId !== 'undefined') {
      await prisma.$executeRaw`
        UPDATE gravacao_recursos
        SET
          hora_inicio = ${input.horaInicio},
          hora_fim = ${input.horaFim},
          estoque_item_id = ${input.estoqueItemId}
        WHERE id = ${input.id}
          AND tenant_id = ${input.tenantId}
          AND gravacao_id = ${input.gravacaoId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE gravacao_recursos
        SET
          hora_inicio = ${input.horaInicio},
          hora_fim = ${input.horaFim}
        WHERE id = ${input.id}
          AND tenant_id = ${input.tenantId}
          AND gravacao_id = ${input.gravacaoId}
      `;
    }

    return this.findAllocationById(input.id);
  }

  async addColaborador(input: SaveAlocacaoColaboradorInput): Promise<AlocacaoRecord> {
    await this.ensureTables();

    const id = randomUUID();

    const parent = await this.findAllocationById(input.parentRecursoId);
    if (!parent?.recursoTecnicoId) {
      throw new Error('Recurso tecnico pai nao encontrado');
    }

    await prisma.$executeRaw`
      INSERT INTO gravacao_recursos (
        id,
        tenant_id,
        gravacao_id,
        recurso_tecnico_id,
        recurso_humano_id,
        parent_recurso_id,
        hora_inicio,
        hora_fim,
        created_at
      ) VALUES (
        ${id},
        ${input.tenantId},
        ${input.gravacaoId},
        ${parent.recursoTecnicoId},
        ${input.recursoHumanoId},
        ${input.parentRecursoId},
        ${input.horaInicio},
        ${input.horaFim},
        NOW()
      )
    `;

    const saved = await this.findAllocationById(id);
    if (!saved) {
      throw new Error('Alocacao do colaborador nao encontrada apos salvar');
    }

    return saved;
  }

  async findAllocationById(id: string): Promise<AlocacaoRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<AlocacaoRow[]>(Prisma.sql`
      SELECT
        gr.id,
        gr.gravacao_id AS "gravacaoId",
        gr.parent_recurso_id AS "parentRecursoId",
        gr.recurso_tecnico_id AS "recursoTecnicoId",
        rt.nome AS "recursoTecnicoNome",
        fop.nome AS "recursoTecnicoFuncaoOperador",
        gr.recurso_fisico_id AS "recursoFisicoId",
        rf.nome AS "recursoFisicoNome",
        gr.recurso_humano_id AS "recursoHumanoId",
        rh.nome AS "recursoHumanoNome",
        rh.sobrenome AS "recursoHumanoSobrenome",
        gr.estoque_item_id AS "estoqueItemId",
        ei.nome AS "estoqueItemNome",
        ei.codigo AS "estoqueItemCodigo",
        ei.numerador AS "estoqueItemNumerador",
        gr.hora_inicio AS "horaInicio",
        gr.hora_fim AS "horaFim"
      FROM gravacao_recursos gr
      LEFT JOIN recursos_tecnicos rt ON rt.id = gr.recurso_tecnico_id
      LEFT JOIN funcoes fop ON fop.id = rt.funcao_operador_id
      LEFT JOIN recursos_fisicos rf ON rf.id = gr.recurso_fisico_id
      LEFT JOIN recursos_humanos rh ON rh.id = gr.recurso_humano_id
      LEFT JOIN rf_estoque_itens ei ON ei.id = gr.estoque_item_id
      WHERE gr.id = ${id}
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      ...row,
      estoqueItemNumerador: row.estoqueItemNumerador === null ? null : Number(row.estoqueItemNumerador),
    };
  }

  async removeAllocation(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM gravacao_recursos WHERE id = ${id}`;
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_recursos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            recurso_tecnico_id text NULL REFERENCES recursos_tecnicos(id) ON DELETE CASCADE,
            recurso_fisico_id text NULL REFERENCES recursos_fisicos(id) ON DELETE CASCADE,
            recurso_humano_id text NULL REFERENCES recursos_humanos(id) ON DELETE CASCADE,
            estoque_item_id text NULL REFERENCES rf_estoque_itens(id) ON DELETE SET NULL,
            parent_recurso_id text NULL REFERENCES gravacao_recursos(id) ON DELETE CASCADE,
            hora_inicio text NULL,
            hora_fim text NULL,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS gravacao_recursos_gravacao_idx
          ON gravacao_recursos (gravacao_id)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS gravacao_recursos_parent_idx
          ON gravacao_recursos (parent_recurso_id)
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
