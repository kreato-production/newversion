import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type ElencoEntityType = 'gravacao' | 'conteudo';

export type ElencoPessoaOptionRecord = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  foto: string | null;
  classificacao: string | null;
  telefone: string | null;
  email: string | null;
  status: string | null;
};

export type ElencoFigurinoOptionRecord = {
  id: string;
  codigoFigurino: string;
  descricao: string;
  imagens: Array<{ id: string; url: string; isPrincipal: boolean }>;
};

export type ElencoFigurinoRecord = {
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  imagemPrincipal: string | null;
};

export type ElencoItemRecord = {
  id: string;
  tenantId: string;
  pessoaId: string;
  entityType: ElencoEntityType;
  entityId: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  foto: string | null;
  classificacao: string | null;
  personagem: string | null;
  descricaoPersonagem: string | null;
  figurinos: ElencoFigurinoRecord[];
};

export type SaveElencoItemInput = {
  tenantId: string;
  entityType: ElencoEntityType;
  entityId: string;
  pessoaId: string;
  personagem: string;
  descricaoPersonagem?: string | null;
  figurinoIds?: string[];
};

export type UpdateElencoItemInput = {
  id: string;
  personagem?: string | null;
  descricaoPersonagem?: string | null;
  figurinoIds?: string[];
};

export type ElencoRelationRecord = {
  id: string;
  tenantId: string;
  entityType: ElencoEntityType;
  entityId: string;
};

type ElencoRow = {
  id: string;
  tenantId: string;
  gravacaoId: string | null;
  conteudoId: string | null;
  pessoaId: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  foto: string | null;
  classificacao: string | null;
  personagem: string | null;
  descricaoPersonagem: string | null;
};

type ElencoFigurinoJoinRow = {
  elencoId: string;
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  imagemPrincipal: string | null;
};

type FigurinoImagemRow = {
  id: string;
  figurinoId: string;
  url: string;
  isPrincipal: boolean | null;
};

export interface ElencoRepository {
  findGravacao(id: string): Promise<{ id: string; tenantId: string } | null>;
  findConteudo(id: string): Promise<{ id: string; tenantId: string | null } | null>;
  list(entityType: ElencoEntityType, entityId: string, tenantId: string): Promise<{
    pessoas: ElencoPessoaOptionRecord[];
    figurinos: ElencoFigurinoOptionRecord[];
    items: ElencoItemRecord[];
  }>;
  add(input: SaveElencoItemInput): Promise<ElencoItemRecord>;
  update(input: UpdateElencoItemInput): Promise<ElencoItemRecord | null>;
  findById(id: string): Promise<ElencoRelationRecord | null>;
  remove(id: string): Promise<void>;
}

export class PrismaElencoRepository implements ElencoRepository {
  private ready: Promise<void> | null = null;

  async findGravacao(id: string) {
    const item = await prisma.gravacao.findUnique({
      where: { id },
      select: { id: true, tenantId: true },
    });

    return item ? { id: item.id, tenantId: item.tenantId } : null;
  }

  async findConteudo(id: string) {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<Array<{ id: string; tenantId: string | null }>>(Prisma.sql`
      SELECT id, tenant_id AS "tenantId"
      FROM conteudos
      WHERE id = ${id}
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async list(entityType: ElencoEntityType, entityId: string, tenantId: string) {
    await this.ensureTables();

    const entityFilter = entityType === 'gravacao'
      ? Prisma.sql`e.gravacao_id = ${entityId}`
      : Prisma.sql`e.conteudo_id = ${entityId}`;
    const hasClassificacoes = await this.tableExists('classificacoes_pessoa');
    const classificacaoSelect = hasClassificacoes
      ? Prisma.sql`cp.nome AS classificacao`
      : Prisma.sql`NULL::text AS classificacao`;
    const classificacaoJoin = hasClassificacoes
      ? Prisma.sql`LEFT JOIN classificacoes_pessoa cp ON cp.id = p.classificacao_id`
      : Prisma.empty;

    const [pessoas, figurinosBase, items] = await Promise.all([
      this.queryPessoas(tenantId),
      prisma.$queryRaw<Array<{ id: string; codigoFigurino: string; descricao: string }>>(Prisma.sql`
        SELECT
          id,
          codigo_figurino AS "codigoFigurino",
          descricao
        FROM figurinos
        WHERE tenant_id = ${tenantId}
        ORDER BY codigo_figurino ASC
      `),
      prisma.$queryRaw<ElencoRow[]>(Prisma.sql`
        SELECT
          e.id,
          e.tenant_id AS "tenantId",
          e.gravacao_id AS "gravacaoId",
          e.conteudo_id AS "conteudoId",
          e.pessoa_id AS "pessoaId",
          p.nome,
          p.sobrenome,
          p.nome_trabalho AS "nomeTrabalho",
          p.foto_url AS foto,
          ${classificacaoSelect},
          e.personagem,
          e.descricao_personagem AS "descricaoPersonagem"
        FROM gravacao_elenco e
        INNER JOIN pessoas p ON p.id = e.pessoa_id
        ${classificacaoJoin}
        WHERE e.tenant_id = ${tenantId}
          AND ${entityFilter}
        ORDER BY p.nome ASC, p.sobrenome ASC
      `),
    ]);

    const figurinoIds = figurinosBase.map((item) => item.id);
    const [imagensByFigurino, figurinosByElenco] = await Promise.all([
      this.loadFigurinoImages(figurinoIds),
      this.loadFigurinosByElenco(items.map((item) => item.id)),
    ]);

    return {
      pessoas,
      figurinos: figurinosBase.map((item) => ({
        id: item.id,
        codigoFigurino: item.codigoFigurino,
        descricao: item.descricao,
        imagens: imagensByFigurino.get(item.id) ?? [],
      })),
      items: items.map((item) => {
        const resolvedEntityType: ElencoEntityType = item.gravacaoId ? 'gravacao' : 'conteudo';

        return {
          id: item.id,
          tenantId: item.tenantId,
          pessoaId: item.pessoaId,
          entityType: resolvedEntityType,
          entityId: item.gravacaoId ?? item.conteudoId ?? '',
          nome: item.nome,
          sobrenome: item.sobrenome,
          nomeTrabalho: item.nomeTrabalho,
          foto: item.foto,
          classificacao: item.classificacao,
          personagem: item.personagem,
          descricaoPersonagem: item.descricaoPersonagem,
          figurinos: figurinosByElenco.get(item.id) ?? [],
        };
      }),
    };
  }

  async add(input: SaveElencoItemInput): Promise<ElencoItemRecord> {
    await this.ensureTables();
    const id = randomUUID();

    await prisma.$executeRaw(
      input.entityType === 'gravacao'
        ? Prisma.sql`
            INSERT INTO gravacao_elenco (
              id,
              tenant_id,
              gravacao_id,
              conteudo_id,
              pessoa_id,
              personagem,
              descricao_personagem,
              created_at
            ) VALUES (
              ${id},
              ${input.tenantId},
              ${input.entityId},
              NULL,
              ${input.pessoaId},
              ${input.personagem},
              ${input.descricaoPersonagem ?? null},
              NOW()
            )
          `
        : Prisma.sql`
            INSERT INTO gravacao_elenco (
              id,
              tenant_id,
              gravacao_id,
              conteudo_id,
              pessoa_id,
              personagem,
              descricao_personagem,
              created_at
            ) VALUES (
              ${id},
              ${input.tenantId},
              NULL,
              ${input.entityId},
              ${input.pessoaId},
              ${input.personagem},
              ${input.descricaoPersonagem ?? null},
              NOW()
            )
          `,
    );

    await this.replaceFigurinos(id, input.tenantId, input.figurinoIds ?? []);

    const saved = await this.findCompleteById(id);
    if (!saved) {
      throw new Error('Membro do elenco nao encontrado apos salvar');
    }

    return saved;
  }

  async update(input: UpdateElencoItemInput): Promise<ElencoItemRecord | null> {
    await this.ensureTables();

    await prisma.$executeRaw`
      UPDATE gravacao_elenco
      SET
        personagem = ${input.personagem ?? null},
        descricao_personagem = ${input.descricaoPersonagem ?? null}
      WHERE id = ${input.id}
    `;

    const relation = await this.findById(input.id);
    if (!relation) {
      return null;
    }

    if (input.figurinoIds) {
      await this.replaceFigurinos(input.id, relation.tenantId, input.figurinoIds);
    }

    return this.findCompleteById(input.id);
  }

  async findById(id: string): Promise<ElencoRelationRecord | null> {
    await this.ensureTables();

    const rows = await prisma.$queryRaw<Array<{
      id: string;
      tenantId: string;
      gravacaoId: string | null;
      conteudoId: string | null;
    }>>(Prisma.sql`
      SELECT
        id,
        tenant_id AS "tenantId",
        gravacao_id AS "gravacaoId",
        conteudo_id AS "conteudoId"
      FROM gravacao_elenco
      WHERE id = ${id}
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      tenantId: row.tenantId,
      entityType: row.gravacaoId ? 'gravacao' : 'conteudo',
      entityId: row.gravacaoId ?? row.conteudoId ?? '',
    };
  }

  async remove(id: string): Promise<void> {
    await this.ensureTables();
    await prisma.$executeRaw`DELETE FROM gravacao_elenco_figurinos WHERE elenco_id = ${id}`;
    await prisma.$executeRaw`DELETE FROM gravacao_elenco WHERE id = ${id}`;
  }

  private async queryPessoas(tenantId: string): Promise<ElencoPessoaOptionRecord[]> {
    const hasClassificacoes = await this.tableExists('classificacoes_pessoa');

    if (hasClassificacoes) {
      return prisma.$queryRaw<ElencoPessoaOptionRecord[]>(Prisma.sql`
        SELECT
          p.id,
          p.nome,
          p.sobrenome,
          p.nome_trabalho AS "nomeTrabalho",
          p.foto_url AS foto,
          cp.nome AS classificacao,
          p.telefone,
          p.email,
          p.status
        FROM pessoas p
        LEFT JOIN classificacoes_pessoa cp ON cp.id = p.classificacao_id
        WHERE p.tenant_id = ${tenantId}
          AND COALESCE(p.status, 'Ativo') = 'Ativo'
        ORDER BY p.nome ASC, p.sobrenome ASC
      `);
    }

    return prisma.$queryRaw<ElencoPessoaOptionRecord[]>(Prisma.sql`
      SELECT
        p.id,
        p.nome,
        p.sobrenome,
        p.nome_trabalho AS "nomeTrabalho",
        p.foto_url AS foto,
        NULL::text AS classificacao,
        p.telefone,
        p.email,
        p.status
      FROM pessoas p
      WHERE p.tenant_id = ${tenantId}
        AND COALESCE(p.status, 'Ativo') = 'Ativo'
      ORDER BY p.nome ASC, p.sobrenome ASC
    `);
  }

  private async loadFigurinoImages(figurinoIds: string[]): Promise<Map<string, Array<{ id: string; url: string; isPrincipal: boolean }>>> {
    if (figurinoIds.length === 0 || !(await this.tableExists('figurino_imagens'))) {
      return new Map();
    }

    const rows = await prisma.$queryRaw<FigurinoImagemRow[]>(Prisma.sql`
      SELECT
        id,
        figurino_id AS "figurinoId",
        url,
        is_principal AS "isPrincipal"
      FROM figurino_imagens
      WHERE figurino_id IN (${Prisma.join(figurinoIds)})
      ORDER BY created_at ASC
    `);

    const map = new Map<string, Array<{ id: string; url: string; isPrincipal: boolean }>>();
    for (const row of rows) {
      const current = map.get(row.figurinoId) ?? [];
      current.push({
        id: row.id,
        url: row.url,
        isPrincipal: Boolean(row.isPrincipal),
      });
      map.set(row.figurinoId, current);
    }

    return map;
  }

  private async loadFigurinosByElenco(elencoIds: string[]): Promise<Map<string, ElencoFigurinoRecord[]>> {
    if (elencoIds.length === 0) {
      return new Map();
    }

    const rows = await prisma.$queryRaw<ElencoFigurinoJoinRow[]>(Prisma.sql`
      SELECT
        gef.elenco_id AS "elencoId",
        f.id AS "figurinoId",
        f.codigo_figurino AS "codigoFigurino",
        f.descricao,
        (
          SELECT fi.url
          FROM figurino_imagens fi
          WHERE fi.figurino_id = f.id
          ORDER BY fi.is_principal DESC, fi.created_at ASC
          LIMIT 1
        ) AS "imagemPrincipal"
      FROM gravacao_elenco_figurinos gef
      INNER JOIN figurinos f ON f.id = gef.figurino_id
      WHERE gef.elenco_id IN (${Prisma.join(elencoIds)})
      ORDER BY f.codigo_figurino ASC
    `);

    const map = new Map<string, ElencoFigurinoRecord[]>();
    for (const row of rows) {
      const current = map.get(row.elencoId) ?? [];
      current.push({
        figurinoId: row.figurinoId,
        codigoFigurino: row.codigoFigurino,
        descricao: row.descricao,
        imagemPrincipal: row.imagemPrincipal,
      });
      map.set(row.elencoId, current);
    }

    return map;
  }

  private async replaceFigurinos(elencoId: string, tenantId: string, figurinoIds: string[]) {
    await prisma.$executeRaw`DELETE FROM gravacao_elenco_figurinos WHERE elenco_id = ${elencoId}`;

    if (figurinoIds.length === 0) {
      return;
    }

    const validFigurinos = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM figurinos
      WHERE tenant_id = ${tenantId}
        AND id IN (${Prisma.join(figurinoIds)})
    `);

    for (const figurino of validFigurinos) {
      await prisma.$executeRaw`
        INSERT INTO gravacao_elenco_figurinos (
          id,
          tenant_id,
          elenco_id,
          figurino_id,
          created_at
        ) VALUES (
          ${randomUUID()},
          ${tenantId},
          ${elencoId},
          ${figurino.id},
          NOW()
        )
      `;
    }
  }

  private async findCompleteById(id: string): Promise<ElencoItemRecord | null> {
    await this.ensureTables();
    const hasClassificacoes = await this.tableExists('classificacoes_pessoa');
    const classificacaoSelect = hasClassificacoes
      ? Prisma.sql`cp.nome AS classificacao`
      : Prisma.sql`NULL::text AS classificacao`;
    const classificacaoJoin = hasClassificacoes
      ? Prisma.sql`LEFT JOIN classificacoes_pessoa cp ON cp.id = p.classificacao_id`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<ElencoRow[]>(Prisma.sql`
      SELECT
        e.id,
        e.tenant_id AS "tenantId",
        e.gravacao_id AS "gravacaoId",
        e.conteudo_id AS "conteudoId",
        e.pessoa_id AS "pessoaId",
        p.nome,
        p.sobrenome,
        p.nome_trabalho AS "nomeTrabalho",
        p.foto_url AS foto,
        ${classificacaoSelect},
        e.personagem,
        e.descricao_personagem AS "descricaoPersonagem"
      FROM gravacao_elenco e
      INNER JOIN pessoas p ON p.id = e.pessoa_id
      ${classificacaoJoin}
      WHERE e.id = ${id}
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const figurinosByElenco = await this.loadFigurinosByElenco([row.id]);

    return {
      id: row.id,
      tenantId: row.tenantId,
      pessoaId: row.pessoaId,
      entityType: row.gravacaoId ? 'gravacao' : 'conteudo',
      entityId: row.gravacaoId ?? row.conteudoId ?? '',
      nome: row.nome,
      sobrenome: row.sobrenome,
      nomeTrabalho: row.nomeTrabalho,
      foto: row.foto,
      classificacao: row.classificacao,
      personagem: row.personagem,
      descricaoPersonagem: row.descricaoPersonagem,
      figurinos: figurinosByElenco.get(row.id) ?? [],
    };
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_elenco (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            conteudo_id text NULL REFERENCES conteudos(id) ON DELETE CASCADE,
            pessoa_id text NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
            personagem text NULL,
            descricao_personagem text NULL,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          ALTER TABLE gravacao_elenco
          ADD COLUMN IF NOT EXISTS descricao_personagem text NULL
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_elenco_figurinos (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            elenco_id text NOT NULL REFERENCES gravacao_elenco(id) ON DELETE CASCADE,
            figurino_id text NOT NULL REFERENCES figurinos(id) ON DELETE CASCADE,
            created_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS gravacao_elenco_entity_idx
          ON gravacao_elenco (gravacao_id, conteudo_id, pessoa_id)
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS gravacao_elenco_figurinos_elenco_idx
          ON gravacao_elenco_figurinos (elenco_id, figurino_id)
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
