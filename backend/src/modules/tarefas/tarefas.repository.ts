import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type TarefaRecord = {
  id: string;
  tenantId: string;
  gravacaoId: string | null;
  gravacaoNome: string | null;
  recursoHumanoId: string | null;
  recursoHumanoNome: string | null;
  recursoHumanoSobrenome: string | null;
  recursoTecnicoId: string | null;
  recursoTecnicoNome: string | null;
  titulo: string;
  descricao: string | null;
  statusId: string | null;
  statusNome: string | null;
  statusCor: string | null;
  statusCodigo: string | null;
  prioridade: 'baixa' | 'media' | 'alta';
  dataInicio: string | null;
  dataFim: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  observacoes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type TarefaStatusOptionRecord = {
  id: string;
  codigo: string;
  nome: string;
  cor: string | null;
  isInicial: boolean;
};

export type TarefaGravacaoOptionRecord = {
  id: string;
  nome: string;
};

export type TarefaRecursoHumanoOptionRecord = {
  id: string;
  nome: string;
  sobrenome: string;
  status: string | null;
  funcaoId: string | null;
};

export type SaveTarefaInput = {
  id?: string;
  tenantId: string;
  gravacaoId?: string | null;
  recursoHumanoId?: string | null;
  recursoTecnicoId?: string | null;
  titulo: string;
  descricao?: string | null;
  statusId?: string | null;
  prioridade: 'baixa' | 'media' | 'alta';
  dataInicio?: string | null;
  dataFim?: string | null;
  horaInicio?: string | null;
  horaFim?: string | null;
  observacoes?: string | null;
};

export type ListTarefasOptions = {
  limit?: number;
  offset?: number;
  unidadeIds?: string[];
  allowedRhIds?: string[] | null;
};

type TarefaRow = {
  id: string;
  tenant_id: string;
  gravacao_id: string | null;
  gravacao_nome: string | null;
  recurso_humano_id: string | null;
  recurso_humano_nome: string | null;
  recurso_humano_sobrenome: string | null;
  recurso_tecnico_id: string | null;
  recurso_tecnico_nome: string | null;
  titulo: string;
  descricao: string | null;
  status_id: string | null;
  status_nome: string | null;
  status_cor: string | null;
  status_codigo: string | null;
  prioridade: 'baixa' | 'media' | 'alta';
  data_inicio: string | null;
  data_fim: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  observacoes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function mapTarefa(row: TarefaRow): TarefaRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    gravacaoId: row.gravacao_id,
    gravacaoNome: row.gravacao_nome,
    recursoHumanoId: row.recurso_humano_id,
    recursoHumanoNome: row.recurso_humano_nome,
    recursoHumanoSobrenome: row.recurso_humano_sobrenome,
    recursoTecnicoId: row.recurso_tecnico_id,
    recursoTecnicoNome: row.recurso_tecnico_nome,
    titulo: row.titulo,
    descricao: row.descricao,
    statusId: row.status_id,
    statusNome: row.status_nome,
    statusCor: row.status_cor,
    statusCodigo: row.status_codigo,
    prioridade: row.prioridade || 'media',
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    horaInicio: row.hora_inicio,
    horaFim: row.hora_fim,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface TarefasRepository {
  listByTenant(tenantId: string, opts?: ListTarefasOptions): Promise<{ data: TarefaRecord[]; total: number }>;
  listByGravacao(tenantId: string, gravacaoId: string, allowedRhIds?: string[] | null): Promise<TarefaRecord[]>;
  findById(id: string): Promise<TarefaRecord | null>;
  save(input: SaveTarefaInput): Promise<TarefaRecord>;
  remove(id: string): Promise<void>;
  listStatusOptions(tenantId: string): Promise<TarefaStatusOptionRecord[]>;
  listGravacaoOptions(tenantId: string, unidadeIds?: string[]): Promise<TarefaGravacaoOptionRecord[]>;
  listRecursoHumanoOptions(tenantId: string, allowedRhIds?: string[] | null): Promise<TarefaRecursoHumanoOptionRecord[]>;
  getUserRecursoHumanoId(userId: string): Promise<string | null>;
  listTeamRecursoHumanoIds(userId: string): Promise<string[]>;
}

export class PrismaTarefasRepository implements TarefasRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListTarefasOptions) {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;
    const filters = this.buildFilters(tenantId, opts?.unidadeIds, opts?.allowedRhIds);

    const rows = await prisma.$queryRaw<TarefaRow[]>(Prisma.sql`
      SELECT
        t.id,
        t.tenant_id,
        t.gravacao_id,
        COALESCE(g.nome, g.codigo, 'Gravacao sem nome') AS gravacao_nome,
        t.recurso_humano_id,
        rh.nome AS recurso_humano_nome,
        rh.sobrenome AS recurso_humano_sobrenome,
        t.recurso_tecnico_id,
        rt.nome AS recurso_tecnico_nome,
        t.titulo,
        t.descricao,
        t.status_id,
        st.nome AS status_nome,
        st.cor AS status_cor,
        st.codigo AS status_codigo,
        t.prioridade,
        to_char(t.data_inicio, 'YYYY-MM-DD') AS data_inicio,
        to_char(t.data_fim, 'YYYY-MM-DD') AS data_fim,
        t.hora_inicio,
        t.hora_fim,
        t.observacoes,
        t.created_at,
        t.updated_at
      FROM tarefas t
      LEFT JOIN "Gravacao" g ON g.id = t.gravacao_id
      LEFT JOIN recursos_humanos rh ON rh.id = t.recurso_humano_id
      LEFT JOIN recursos_tecnicos rt ON rt.id = t.recurso_tecnico_id
      LEFT JOIN status_tarefa st ON st.id = t.status_id
      ${filters.where}
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT ${take} OFFSET ${skip}
    `);

    const totalRows = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM tarefas t
      LEFT JOIN "Gravacao" g ON g.id = t.gravacao_id
      ${filters.where}
    `);

    return {
      data: rows.map(mapTarefa),
      total: Number(totalRows[0]?.total ?? 0),
    };
  }

  async listByGravacao(tenantId: string, gravacaoId: string, allowedRhIds?: string[] | null) {
    await this.ensureTables();

    const where = [
      Prisma.sql`t.tenant_id = ${tenantId}`,
      Prisma.sql`t.gravacao_id = ${gravacaoId}`,
    ];

    if (allowedRhIds !== null && allowedRhIds !== undefined) {
      if (allowedRhIds.length === 0) {
        return [];
      }

      where.push(Prisma.sql`t.recurso_humano_id IN (${Prisma.join(allowedRhIds)})`);
    }

    const rows = await prisma.$queryRaw<TarefaRow[]>(Prisma.sql`
      SELECT
        t.id,
        t.tenant_id,
        t.gravacao_id,
        COALESCE(g.nome, g.codigo, 'Gravacao sem nome') AS gravacao_nome,
        t.recurso_humano_id,
        rh.nome AS recurso_humano_nome,
        rh.sobrenome AS recurso_humano_sobrenome,
        t.recurso_tecnico_id,
        rt.nome AS recurso_tecnico_nome,
        t.titulo,
        t.descricao,
        t.status_id,
        st.nome AS status_nome,
        st.cor AS status_cor,
        st.codigo AS status_codigo,
        t.prioridade,
        to_char(t.data_inicio, 'YYYY-MM-DD') AS data_inicio,
        to_char(t.data_fim, 'YYYY-MM-DD') AS data_fim,
        t.hora_inicio,
        t.hora_fim,
        t.observacoes,
        t.created_at,
        t.updated_at
      FROM tarefas t
      LEFT JOIN "Gravacao" g ON g.id = t.gravacao_id
      LEFT JOIN recursos_humanos rh ON rh.id = t.recurso_humano_id
      LEFT JOIN recursos_tecnicos rt ON rt.id = t.recurso_tecnico_id
      LEFT JOIN status_tarefa st ON st.id = t.status_id
      WHERE ${Prisma.join(where, ' AND ')}
      ORDER BY t.data_fim ASC NULLS LAST, t.created_at DESC
    `);

    return rows.map(mapTarefa);
  }

  async findById(id: string) {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<TarefaRow[]>(Prisma.sql`
      SELECT
        t.id,
        t.tenant_id,
        t.gravacao_id,
        COALESCE(g.nome, g.codigo, 'Gravacao sem nome') AS gravacao_nome,
        t.recurso_humano_id,
        rh.nome AS recurso_humano_nome,
        rh.sobrenome AS recurso_humano_sobrenome,
        t.recurso_tecnico_id,
        rt.nome AS recurso_tecnico_nome,
        t.titulo,
        t.descricao,
        t.status_id,
        st.nome AS status_nome,
        st.cor AS status_cor,
        st.codigo AS status_codigo,
        t.prioridade,
        to_char(t.data_inicio, 'YYYY-MM-DD') AS data_inicio,
        to_char(t.data_fim, 'YYYY-MM-DD') AS data_fim,
        t.hora_inicio,
        t.hora_fim,
        t.observacoes,
        t.created_at,
        t.updated_at
      FROM tarefas t
      LEFT JOIN "Gravacao" g ON g.id = t.gravacao_id
      LEFT JOIN recursos_humanos rh ON rh.id = t.recurso_humano_id
      LEFT JOIN recursos_tecnicos rt ON rt.id = t.recurso_tecnico_id
      LEFT JOIN status_tarefa st ON st.id = t.status_id
      WHERE t.id = ${id}
      LIMIT 1
    `);

    return rows[0] ? mapTarefa(rows[0]) : null;
  }

  async save(input: SaveTarefaInput) {
    await this.ensureTables();

    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRaw`
        UPDATE tarefas
        SET
          gravacao_id = ${input.gravacaoId ?? null},
          recurso_humano_id = ${input.recursoHumanoId ?? null},
          recurso_tecnico_id = ${input.recursoTecnicoId ?? null},
          titulo = ${input.titulo},
          descricao = ${input.descricao ?? null},
          status_id = ${input.statusId ?? null},
          prioridade = ${input.prioridade},
          data_inicio = ${input.dataInicio ? Prisma.sql`${input.dataInicio}::date` : Prisma.sql`NULL`},
          data_fim = ${input.dataFim ? Prisma.sql`${input.dataFim}::date` : Prisma.sql`NULL`},
          hora_inicio = ${input.horaInicio ?? null},
          hora_fim = ${input.horaFim ?? null},
          observacoes = ${input.observacoes ?? null},
          updated_at = NOW()
        WHERE id = ${input.id}
          AND tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO tarefas (
          id,
          tenant_id,
          gravacao_id,
          recurso_humano_id,
          recurso_tecnico_id,
          titulo,
          descricao,
          status_id,
          prioridade,
          data_inicio,
          data_fim,
          hora_inicio,
          hora_fim,
          observacoes,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${input.tenantId},
          ${input.gravacaoId ?? null},
          ${input.recursoHumanoId ?? null},
          ${input.recursoTecnicoId ?? null},
          ${input.titulo},
          ${input.descricao ?? null},
          ${input.statusId ?? null},
          ${input.prioridade},
          ${input.dataInicio ? Prisma.sql`${input.dataInicio}::date` : Prisma.sql`NULL`},
          ${input.dataFim ? Prisma.sql`${input.dataFim}::date` : Prisma.sql`NULL`},
          ${input.horaInicio ?? null},
          ${input.horaFim ?? null},
          ${input.observacoes ?? null},
          NOW(),
          NOW()
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Tarefa nao encontrada apos salvar');
    }

    return saved;
  }

  async remove(id: string) {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM tarefas WHERE id = ${id}`;
  }

  async listStatusOptions(tenantId: string) {
    await this.ensureTables();

    return prisma.$queryRaw<TarefaStatusOptionRecord[]>(Prisma.sql`
      SELECT
        id,
        codigo,
        nome,
        cor,
        COALESCE(is_inicial, false) AS "isInicial"
      FROM status_tarefa
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `);
  }

  async listGravacaoOptions(tenantId: string, unidadeIds?: string[]) {
    const unitFilter = unidadeIds && unidadeIds.length > 0
      ? Prisma.sql`AND g."unidadeNegocioId" IN (${Prisma.join(unidadeIds)})`
      : Prisma.empty;

    return prisma.$queryRaw<TarefaGravacaoOptionRecord[]>(Prisma.sql`
      SELECT
        g.id,
        COALESCE(g.nome, g.codigo, 'Gravacao sem nome') AS nome
      FROM "Gravacao" g
      WHERE g."tenantId" = ${tenantId}
      ${unitFilter}
      ORDER BY nome ASC
    `);
  }

  async listRecursoHumanoOptions(tenantId: string, allowedRhIds?: string[] | null) {
    await this.ensureTables();

    if (allowedRhIds !== null && allowedRhIds !== undefined && allowedRhIds.length === 0) {
      return [];
    }

    const where = [
      Prisma.sql`tenant_id = ${tenantId}`,
    ];

    if (allowedRhIds !== null && allowedRhIds !== undefined) {
      where.push(Prisma.sql`id IN (${Prisma.join(allowedRhIds)})`);
    }

    return prisma.$queryRaw<TarefaRecursoHumanoOptionRecord[]>(Prisma.sql`
      SELECT
        id,
        nome,
        sobrenome,
        status,
        funcao_id AS "funcaoId"
      FROM recursos_humanos
      WHERE ${Prisma.join(where, ' AND ')}
      ORDER BY nome ASC, sobrenome ASC
    `);
  }

  async getUserRecursoHumanoId(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { recursoHumanoId: true },
    });

    return user?.recursoHumanoId ?? null;
  }

  async listTeamRecursoHumanoIds(userId: string) {
    const rows = await prisma.$queryRaw<Array<{ recursoHumanoId: string | null }>>(Prisma.sql`
      SELECT DISTINCT u."recursoHumanoId" AS "recursoHumanoId"
      FROM usuario_equipes ue_self
      INNER JOIN usuario_equipes ue ON ue.equipe_id = ue_self.equipe_id
      INNER JOIN "User" u ON u.id = ue.usuario_id
      WHERE ue_self.usuario_id = ${userId}
    `);

    return rows
      .map((row) => row.recursoHumanoId)
      .filter((value): value is string => Boolean(value));
  }

  private buildFilters(tenantId: string, unidadeIds?: string[], allowedRhIds?: string[] | null) {
    const conditions = [
      Prisma.sql`t.tenant_id = ${tenantId}`,
    ];

    if (unidadeIds && unidadeIds.length > 0) {
      conditions.push(Prisma.sql`g."unidadeNegocioId" IN (${Prisma.join(unidadeIds)})`);
    }

    if (allowedRhIds !== null && allowedRhIds !== undefined) {
      if (allowedRhIds.length === 0) {
        conditions.push(Prisma.sql`1 = 0`);
      } else {
        conditions.push(Prisma.sql`t.recurso_humano_id IN (${Prisma.join(allowedRhIds)})`);
      }
    }

    return {
      where: Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`,
    };
  }

  private async ensureTables() {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS tarefas (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NULL REFERENCES "Gravacao"(id) ON DELETE SET NULL,
            recurso_humano_id text NULL REFERENCES recursos_humanos(id) ON DELETE SET NULL,
            recurso_tecnico_id text NULL REFERENCES recursos_tecnicos(id) ON DELETE SET NULL,
            titulo text NOT NULL,
            descricao text NULL,
            status_id text NULL REFERENCES status_tarefa(id) ON DELETE SET NULL,
            prioridade text NOT NULL DEFAULT 'media',
            data_inicio date NULL,
            data_fim date NULL,
            hora_inicio text NULL,
            hora_fim text NULL,
            observacoes text NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS tarefas_tenant_gravacao_idx
          ON tarefas (tenant_id, gravacao_id)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS tarefas_tenant_responsavel_idx
          ON tarefas (tenant_id, recurso_humano_id)
        `);
      })();
    }

    await this.ready;
  }
}
