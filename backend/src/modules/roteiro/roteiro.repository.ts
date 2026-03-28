import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type CenaRecord = {
  id: string;
  ordem: number;
  capitulo: string | null;
  numeroCena: string | null;
  ambiente: string | null;
  tipoAmbiente: string | null;
  periodo: string | null;
  localGravacao: string | null;
  personagens: string[];
  figurantes: string[];
  tempoAproximado: string | null;
  ritmo: string | null;
  descricao: string | null;
};

export type ElencoOptionRecord = {
  id: string;
  pessoaId: string;
  nome: string;
  nomeTrabalho: string | null;
  personagem: string | null;
};

export type FiguranteOptionRecord = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  status: string | null;
};

export type SaveCenaInput = Omit<CenaRecord, 'id'> & {
  id?: string;
  tenantId: string;
  gravacaoId: string;
};

type CenaRow = {
  id: string;
  ordem: number;
  capitulo: string | null;
  numeroCena: string | null;
  ambiente: string | null;
  tipoAmbiente: string | null;
  periodo: string | null;
  localGravacao: string | null;
  personagens: unknown;
  figurantes: unknown;
  tempoAproximado: string | null;
  ritmo: string | null;
  descricao: string | null;
};

type ElencoRow = {
  id: string;
  pessoaId: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string | null;
  personagem: string | null;
};

type GravacaoTenantRow = {
  id: string;
  tenantId: string;
};

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export interface RoteiroRepository {
  findGravacao(id: string): Promise<GravacaoTenantRow | null>;
  list(tenantId: string, gravacaoId: string, conteudoId?: string | null): Promise<{
    cenas: CenaRecord[];
    elenco: ElencoOptionRecord[];
    figurantes: FiguranteOptionRecord[];
  }>;
  saveCena(input: SaveCenaInput): Promise<CenaRecord>;
  removeCena(tenantId: string, gravacaoId: string, sceneId: string): Promise<void>;
}

export class PrismaRoteiroRepository implements RoteiroRepository {
  private ready: Promise<void> | null = null;

  async findGravacao(id: string): Promise<GravacaoTenantRow | null> {
    const gravacao = await prisma.gravacao.findUnique({
      where: { id },
      select: { id: true, tenantId: true },
    });

    return gravacao ? { id: gravacao.id, tenantId: gravacao.tenantId } : null;
  }

  async list(tenantId: string, gravacaoId: string, conteudoId?: string | null) {
    await this.ensureTables();

    const [cenas, elencoGravacao, elencoConteudo, figurantes] = await Promise.all([
      prisma.$queryRaw<CenaRow[]>(Prisma.sql`
        SELECT
          id,
          ordem,
          capitulo,
          numero_cena AS "numeroCena",
          ambiente,
          tipo_ambiente AS "tipoAmbiente",
          periodo,
          local_gravacao AS "localGravacao",
          personagens,
          figurantes,
          tempo_aproximado AS "tempoAproximado",
          ritmo,
          descricao
        FROM gravacao_cenas
        WHERE tenant_id = ${tenantId}
          AND gravacao_id = ${gravacaoId}
        ORDER BY ordem ASC, created_at ASC
      `),
      prisma.$queryRaw<ElencoRow[]>(Prisma.sql`
        SELECT
          ge.id,
          ge.pessoa_id AS "pessoaId",
          p.nome,
          p.sobrenome,
          p.nome_trabalho AS "nomeTrabalho",
          ge.personagem
        FROM gravacao_elenco ge
        INNER JOIN pessoas p ON p.id = ge.pessoa_id
        WHERE ge.tenant_id = ${tenantId}
          AND ge.gravacao_id = ${gravacaoId}
        ORDER BY p.nome ASC, p.sobrenome ASC
      `),
      conteudoId
        ? prisma.$queryRaw<ElencoRow[]>(Prisma.sql`
            SELECT
              ge.id,
              ge.pessoa_id AS "pessoaId",
              p.nome,
              p.sobrenome,
              p.nome_trabalho AS "nomeTrabalho",
              ge.personagem
            FROM gravacao_elenco ge
            INNER JOIN pessoas p ON p.id = ge.pessoa_id
            WHERE ge.tenant_id = ${tenantId}
              AND ge.conteudo_id = ${conteudoId}
              AND ge.gravacao_id IS NULL
            ORDER BY p.nome ASC, p.sobrenome ASC
          `)
        : Promise.resolve([]),
      this.loadFigurantes(tenantId),
    ]);

    const elenco = [...elencoGravacao];
    const pessoaIds = new Set(elencoGravacao.map((item) => item.pessoaId));
    for (const item of elencoConteudo) {
      if (!pessoaIds.has(item.pessoaId)) {
        elenco.push(item);
        pessoaIds.add(item.pessoaId);
      }
    }

    return {
      cenas: cenas.map((item) => ({
        id: item.id,
        ordem: Number(item.ordem),
        capitulo: item.capitulo,
        numeroCena: item.numeroCena,
        ambiente: item.ambiente,
        tipoAmbiente: item.tipoAmbiente,
        periodo: item.periodo,
        localGravacao: item.localGravacao,
        personagens: parseStringArray(item.personagens),
        figurantes: parseStringArray(item.figurantes),
        tempoAproximado: item.tempoAproximado,
        ritmo: item.ritmo,
        descricao: item.descricao,
      })),
      elenco: elenco.map((item) => ({
        id: item.id,
        pessoaId: item.pessoaId,
        nome: `${item.nome} ${item.sobrenome}`.trim(),
        nomeTrabalho: item.nomeTrabalho,
        personagem: item.personagem,
      })),
      figurantes,
    };
  }

  async saveCena(input: SaveCenaInput): Promise<CenaRecord> {
    await this.ensureTables();

    const sceneId = input.id || randomUUID();

    await prisma.$executeRaw`
      INSERT INTO gravacao_cenas (
        id,
        tenant_id,
        gravacao_id,
        ordem,
        capitulo,
        numero_cena,
        ambiente,
        tipo_ambiente,
        periodo,
        local_gravacao,
        personagens,
        figurantes,
        tempo_aproximado,
        ritmo,
        descricao,
        created_at,
        updated_at
      ) VALUES (
        ${sceneId},
        ${input.tenantId},
        ${input.gravacaoId},
        ${input.ordem},
        ${input.capitulo ?? null},
        ${input.numeroCena ?? null},
        ${input.ambiente ?? null},
        ${input.tipoAmbiente ?? null},
        ${input.periodo ?? null},
        ${input.localGravacao ?? null},
        ${JSON.stringify(input.personagens ?? [])}::jsonb,
        ${JSON.stringify(input.figurantes ?? [])}::jsonb,
        ${input.tempoAproximado ?? null},
        ${input.ritmo ?? null},
        ${input.descricao ?? null},
        NOW(),
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET
        ordem = EXCLUDED.ordem,
        capitulo = EXCLUDED.capitulo,
        numero_cena = EXCLUDED.numero_cena,
        ambiente = EXCLUDED.ambiente,
        tipo_ambiente = EXCLUDED.tipo_ambiente,
        periodo = EXCLUDED.periodo,
        local_gravacao = EXCLUDED.local_gravacao,
        personagens = EXCLUDED.personagens,
        figurantes = EXCLUDED.figurantes,
        tempo_aproximado = EXCLUDED.tempo_aproximado,
        ritmo = EXCLUDED.ritmo,
        descricao = EXCLUDED.descricao,
        updated_at = NOW()
    `;

    const rows = await prisma.$queryRaw<CenaRow[]>(Prisma.sql`
      SELECT
        id,
        ordem,
        capitulo,
        numero_cena AS "numeroCena",
        ambiente,
        tipo_ambiente AS "tipoAmbiente",
        periodo,
        local_gravacao AS "localGravacao",
        personagens,
        figurantes,
        tempo_aproximado AS "tempoAproximado",
        ritmo,
        descricao
      FROM gravacao_cenas
      WHERE id = ${sceneId}
      LIMIT 1
    `);

    const row = rows[0];
    if (!row) {
      throw new Error('Cena nao encontrada apos salvar');
    }

    return {
      id: row.id,
      ordem: Number(row.ordem),
      capitulo: row.capitulo,
      numeroCena: row.numeroCena,
      ambiente: row.ambiente,
      tipoAmbiente: row.tipoAmbiente,
      periodo: row.periodo,
      localGravacao: row.localGravacao,
      personagens: parseStringArray(row.personagens),
      figurantes: parseStringArray(row.figurantes),
      tempoAproximado: row.tempoAproximado,
      ritmo: row.ritmo,
      descricao: row.descricao,
    };
  }

  async removeCena(tenantId: string, gravacaoId: string, sceneId: string): Promise<void> {
    await this.ensureTables();

    await prisma.$executeRaw`
      DELETE FROM gravacao_cenas
      WHERE id = ${sceneId}
        AND tenant_id = ${tenantId}
        AND gravacao_id = ${gravacaoId}
    `;
  }

  private async loadFigurantes(tenantId: string): Promise<FiguranteOptionRecord[]> {
    const hasClassificacoes = await this.tableExists('classificacoes_pessoa');

    if (hasClassificacoes) {
      const classificacoes = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id
        FROM classificacoes_pessoa
        WHERE tenant_id = ${tenantId}
          AND (
            LOWER(nome) LIKE '%figurante%'
            OR LOWER(nome) LIKE '%extra%'
          )
      `);

      if (classificacoes.length > 0) {
        return prisma.$queryRaw<FiguranteOptionRecord[]>(Prisma.sql`
          SELECT
            id,
            nome,
            sobrenome,
            nome_trabalho AS "nomeTrabalho",
            status
          FROM pessoas
          WHERE tenant_id = ${tenantId}
            AND classificacao_id IN (${Prisma.join(classificacoes.map((item) => item.id))})
            AND COALESCE(status, 'Ativo') = 'Ativo'
          ORDER BY nome ASC, sobrenome ASC
        `);
      }
    }

    return prisma.$queryRaw<FiguranteOptionRecord[]>(Prisma.sql`
      SELECT
        id,
        nome,
        sobrenome,
        nome_trabalho AS "nomeTrabalho",
        status
      FROM pessoas
      WHERE tenant_id = ${tenantId}
        AND COALESCE(status, 'Ativo') = 'Ativo'
      ORDER BY nome ASC, sobrenome ASC
    `);
  }

  private async ensureTables(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS gravacao_cenas (
            id text PRIMARY KEY,
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            gravacao_id text NOT NULL REFERENCES "Gravacao"(id) ON DELETE CASCADE,
            ordem integer NOT NULL DEFAULT 1,
            capitulo text NULL,
            numero_cena text NULL,
            ambiente text NULL,
            tipo_ambiente text NULL,
            periodo text NULL,
            local_gravacao text NULL,
            personagens jsonb NOT NULL DEFAULT '[]'::jsonb,
            figurantes jsonb NOT NULL DEFAULT '[]'::jsonb,
            tempo_aproximado text NULL,
            ritmo text NULL,
            descricao text NULL,
            created_at timestamptz NULL DEFAULT NOW(),
            updated_at timestamptz NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS gravacao_cenas_gravacao_ordem_idx
          ON gravacao_cenas (gravacao_id, ordem)
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
