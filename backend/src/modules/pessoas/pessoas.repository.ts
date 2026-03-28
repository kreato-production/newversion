import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type PessoaRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  foto: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  email: string | null;
  classificacao: string | null;
  classificacaoId: string | null;
  documento: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  status: string;
  createdAt: Date | null;
  createdByNome: string | null;
};

export type SavePessoaInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  sobrenome: string;
  nomeTrabalho?: string | null;
  foto?: string | null;
  dataNascimento?: string | null;
  sexo?: string | null;
  telefone?: string | null;
  email?: string | null;
  classificacaoId?: string | null;
  documento?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  observacoes?: string | null;
  status: string;
  createdBy?: string | null;
};

export type ClassificacaoPessoaOptionRecord = {
  id: string;
  nome: string;
};

export type GravacaoParticipacaoRecord = {
  id: string;
  codigo: string;
  nome: string;
  dataPrevista: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

type PessoaRow = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  foto: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  email: string | null;
  classificacao: string | null;
  classificacaoId: string | null;
  documento: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  status: string | null;
  createdAt: Date | null;
  createdByNome: string | null;
};

type GravacaoIdRow = {
  gravacaoId: string | null;
};

export interface PessoasRepository {
  listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<PessoaRecord>>;
  findById(id: string): Promise<PessoaRecord | null>;
  save(input: SavePessoaInput): Promise<PessoaRecord>;
  remove(id: string): Promise<void>;
  listClassificacoes(tenantId: string): Promise<ClassificacaoPessoaOptionRecord[]>;
  listGravacoes(tenantId: string, pessoaId: string): Promise<GravacaoParticipacaoRecord[]>;
}

export class PrismaPessoasRepository implements PessoasRepository {
  private ready: Promise<void> | null = null;

  async listByTenant(tenantId: string, opts?: ListOptions): Promise<PaginatedResult<PessoaRecord>> {
    await this.ensureTables();

    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;
    const rows = await this.queryPessoas(
      Prisma.sql`
        WHERE p.tenant_id = ${tenantId}
        ORDER BY p.nome ASC, p.sobrenome ASC
        LIMIT ${take} OFFSET ${skip}
      `,
    );

    const totals = await prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM pessoas
      WHERE tenant_id = ${tenantId}
    `);

    return {
      data: rows.map((row) => this.mapPessoa(row)),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(id: string): Promise<PessoaRecord | null> {
    await this.ensureTables();
    const rows = await this.queryPessoas(Prisma.sql`WHERE p.id = ${id} LIMIT 1`);
    return rows[0] ? this.mapPessoa(rows[0]) : null;
  }

  async save(input: SavePessoaInput): Promise<PessoaRecord> {
    await this.ensureTables();
    const id = input.id ?? randomUUID();

    if (input.id) {
      await prisma.$executeRaw`
        UPDATE pessoas
        SET
          codigo_externo = ${input.codigoExterno ?? null},
          nome = ${input.nome},
          sobrenome = ${input.sobrenome},
          nome_trabalho = ${input.nomeTrabalho ?? null},
          foto_url = ${input.foto ?? null},
          data_nascimento = ${input.dataNascimento ? Prisma.sql`${input.dataNascimento}::date` : Prisma.sql`NULL`},
          sexo = ${input.sexo ?? null},
          telefone = ${input.telefone ?? null},
          email = ${input.email ?? null},
          classificacao_id = ${input.classificacaoId ?? null},
          documento = ${input.documento ?? null},
          endereco = ${input.endereco ?? null},
          cidade = ${input.cidade ?? null},
          estado = ${input.estado ?? null},
          cep = ${input.cep ?? null},
          observacoes = ${input.observacoes ?? null},
          status = ${input.status},
          updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${input.tenantId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO pessoas (
          id,
          tenant_id,
          codigo_externo,
          nome,
          sobrenome,
          nome_trabalho,
          foto_url,
          data_nascimento,
          sexo,
          telefone,
          email,
          classificacao_id,
          documento,
          endereco,
          cidade,
          estado,
          cep,
          observacoes,
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
          ${input.nomeTrabalho ?? null},
          ${input.foto ?? null},
          ${input.dataNascimento ? Prisma.sql`${input.dataNascimento}::date` : Prisma.sql`NULL`},
          ${input.sexo ?? null},
          ${input.telefone ?? null},
          ${input.email ?? null},
          ${input.classificacaoId ?? null},
          ${input.documento ?? null},
          ${input.endereco ?? null},
          ${input.cidade ?? null},
          ${input.estado ?? null},
          ${input.cep ?? null},
          ${input.observacoes ?? null},
          ${input.status},
          NOW(),
          NOW(),
          ${input.createdBy ?? null}
        )
      `;
    }

    const saved = await this.findById(id);
    if (!saved) {
      throw new Error('Pessoa nao encontrada apos salvar');
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();

    if (await this.tableExists('gravacao_elenco')) {
      await prisma.$executeRaw`DELETE FROM gravacao_elenco WHERE pessoa_id = ${id}`;
    }

    if (await this.tableExists('gravacao_convidados')) {
      await prisma.$executeRaw`DELETE FROM gravacao_convidados WHERE pessoa_id = ${id}`;
    }

    await prisma.$executeRaw`DELETE FROM pessoas WHERE id = ${id}`;
  }

  async listClassificacoes(tenantId: string): Promise<ClassificacaoPessoaOptionRecord[]> {
    if (!(await this.tableExists('classificacoes_pessoa'))) {
      return [];
    }

    return prisma.$queryRaw<ClassificacaoPessoaOptionRecord[]>(Prisma.sql`
      SELECT id, nome
      FROM classificacoes_pessoa
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `);
  }

  async listGravacoes(tenantId: string, pessoaId: string): Promise<GravacaoParticipacaoRecord[]> {
    await this.ensureTables();

    const gravacaoIds = new Set<string>();

    if (await this.tableExists('gravacao_elenco')) {
      const elenco = await prisma.$queryRaw<GravacaoIdRow[]>(Prisma.sql`
        SELECT gravacao_id AS "gravacaoId"
        FROM gravacao_elenco
        WHERE tenant_id = ${tenantId}
          AND pessoa_id = ${pessoaId}
          AND gravacao_id IS NOT NULL
      `);

      for (const item of elenco) {
        if (item.gravacaoId) {
          gravacaoIds.add(item.gravacaoId);
        }
      }
    }

    if (await this.tableExists('gravacao_convidados')) {
      const convidados = await prisma.$queryRaw<GravacaoIdRow[]>(Prisma.sql`
        SELECT gravacao_id AS "gravacaoId"
        FROM gravacao_convidados
        WHERE tenant_id = ${tenantId}
          AND pessoa_id = ${pessoaId}
          AND gravacao_id IS NOT NULL
      `);

      for (const item of convidados) {
        if (item.gravacaoId) {
          gravacaoIds.add(item.gravacaoId);
        }
      }
    }

    if (gravacaoIds.size === 0) {
      return [];
    }

    const ids = Array.from(gravacaoIds);

    if (await this.tableExists('gravacoes')) {
      return prisma.$queryRaw<GravacaoParticipacaoRecord[]>(Prisma.sql`
        SELECT
          id,
          codigo,
          nome,
          to_char(data_prevista, 'YYYY-MM-DD') AS "dataPrevista"
        FROM gravacoes
        WHERE id IN (${Prisma.join(ids)})
        ORDER BY data_prevista DESC NULLS LAST, nome ASC
      `);
    }

    if (await this.tableExists('"Gravacao"')) {
      return prisma.$queryRaw<GravacaoParticipacaoRecord[]>(Prisma.sql`
        SELECT
          id,
          codigo,
          nome,
          to_char("dataPrevista", 'YYYY-MM-DD') AS "dataPrevista"
        FROM "Gravacao"
        WHERE id IN (${Prisma.join(ids)})
        ORDER BY "dataPrevista" DESC NULLS LAST, nome ASC
      `);
    }

    return [];
  }

  private async queryPessoas(whereSql: Prisma.Sql): Promise<PessoaRow[]> {
    const hasClassificacoes = await this.tableExists('classificacoes_pessoa');

    if (hasClassificacoes) {
      return prisma.$queryRaw<PessoaRow[]>(Prisma.sql`
        SELECT
          p.id,
          p.tenant_id AS "tenantId",
          p.codigo_externo AS "codigoExterno",
          p.nome,
          p.sobrenome,
          p.nome_trabalho AS "nomeTrabalho",
          p.foto_url AS foto,
          to_char(p.data_nascimento, 'YYYY-MM-DD') AS "dataNascimento",
          p.sexo,
          p.telefone,
          p.email,
          cp.nome AS classificacao,
          p.classificacao_id AS "classificacaoId",
          p.documento,
          p.endereco,
          p.cidade,
          p.estado,
          p.cep,
          p.observacoes,
          p.status,
          p.created_at AS "createdAt",
          u.nome AS "createdByNome"
        FROM pessoas p
        LEFT JOIN classificacoes_pessoa cp ON cp.id = p.classificacao_id
        LEFT JOIN "User" u ON u.id = p.created_by
        ${whereSql}
      `);
    }

    return prisma.$queryRaw<PessoaRow[]>(Prisma.sql`
      SELECT
        p.id,
        p.tenant_id AS "tenantId",
        p.codigo_externo AS "codigoExterno",
        p.nome,
        p.sobrenome,
        p.nome_trabalho AS "nomeTrabalho",
        p.foto_url AS foto,
        to_char(p.data_nascimento, 'YYYY-MM-DD') AS "dataNascimento",
        p.sexo,
        p.telefone,
        p.email,
        NULL::text AS classificacao,
        p.classificacao_id AS "classificacaoId",
        p.documento,
        p.endereco,
        p.cidade,
        p.estado,
        p.cep,
        p.observacoes,
        p.status,
        p.created_at AS "createdAt",
        u.nome AS "createdByNome"
      FROM pessoas p
      LEFT JOIN "User" u ON u.id = p.created_by
      ${whereSql}
    `);
  }

  private mapPessoa(row: PessoaRow): PessoaRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      codigoExterno: row.codigoExterno,
      nome: row.nome,
      sobrenome: row.sobrenome,
      nomeTrabalho: row.nomeTrabalho,
      foto: row.foto,
      dataNascimento: row.dataNascimento,
      sexo: row.sexo,
      telefone: row.telefone,
      email: row.email,
      classificacao: row.classificacao,
      classificacaoId: row.classificacaoId,
      documento: row.documento,
      endereco: row.endereco,
      cidade: row.cidade,
      estado: row.estado,
      cep: row.cep,
      observacoes: row.observacoes,
      status: row.status || 'Ativo',
      createdAt: row.createdAt,
      createdByNome: row.createdByNome,
    };
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS pessoas (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            codigo_externo text NULL,
            nome text NOT NULL,
            sobrenome text NOT NULL DEFAULT '',
            nome_trabalho text NULL,
            foto_url text NULL,
            data_nascimento date NULL,
            sexo text NULL,
            telefone text NULL,
            email text NULL,
            classificacao_id text NULL,
            documento text NULL,
            endereco text NULL,
            cidade text NULL,
            estado text NULL,
            cep text NULL,
            observacoes text NULL,
            status text NOT NULL DEFAULT 'Ativo',
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW(),
            created_by text NULL REFERENCES "User"(id) ON DELETE SET NULL
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS pessoas_tenant_nome_idx
          ON pessoas (tenant_id, nome, sobrenome)
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
