import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

type StatusRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  cor: string | null;
  is_inicial: boolean | null;
  created_at: Date | null;
  created_by: string | null;
};

type TituloRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  titulo: string;
  descricao: string | null;
  cor?: string | null;
  created_at: Date | null;
  created_by: string | null;
};

type CentroLucroRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  status: string | null;
  parent_id: string | null;
  created_at: Date | null;
  created_by: string | null;
};

type UnidadeRow = {
  id: string;
  nome: string;
};

type CentroLucroUnidadeRow = {
  id: string;
  unidade_negocio_id: string;
};

let ensurePromise: Promise<void> | null = null;

async function ensureTables() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS categorias_incidencia (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          titulo text NOT NULL,
          descricao text NULL,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS classificacoes_incidencia (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          categoria_incidencia_id text NOT NULL REFERENCES categorias_incidencia(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          titulo text NOT NULL,
          descricao text NULL,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS severidades_incidencia (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          titulo text NOT NULL,
          descricao text NULL,
          cor text NULL DEFAULT '#888888',
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS impactos_incidencia (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          titulo text NOT NULL,
          descricao text NULL,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS status_gravacao (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          codigo text NULL,
          nome text NOT NULL,
          descricao text NULL,
          cor text NULL DEFAULT '#888888',
          is_inicial boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW(),
          created_by text NULL
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS status_tarefa (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          codigo text NULL,
          nome text NOT NULL,
          descricao text NULL,
          cor text NULL DEFAULT '#888888',
          is_inicial boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW(),
          created_by text NULL
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS centros_lucro (
          id text PRIMARY KEY,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          codigo_externo text NULL,
          nome text NOT NULL,
          descricao text NULL,
          status text NULL DEFAULT 'Ativo',
          parent_id text NULL REFERENCES centros_lucro(id) ON DELETE SET NULL,
          created_by text NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS centro_lucro_unidades (
          id text PRIMARY KEY,
          centro_lucro_id text NOT NULL REFERENCES centros_lucro(id) ON DELETE CASCADE,
          tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
          unidade_negocio_id text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS centro_lucro_unidades_unique
        ON centro_lucro_unidades (centro_lucro_id, unidade_negocio_id)
      `);
    })();
  }

  await ensurePromise;
}

export type SaveStatusGravacaoInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
  cor?: string | null;
  isInicial?: boolean;
  createdBy?: string | null;
};

export type SaveStatusTarefaInput = {
  id?: string;
  tenantId: string;
  codigo?: string | null;
  nome: string;
  descricao?: string | null;
  cor?: string | null;
  isInicial?: boolean;
  createdBy?: string | null;
};

export type SaveTituloInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  titulo: string;
  descricao?: string | null;
  cor?: string | null;
  createdBy?: string | null;
};

export type SaveClassificacaoInput = SaveTituloInput & {
  categoriaIncidenciaId: string;
};

export type SaveCentroLucroInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
  status?: string | null;
  parentId?: string | null;
  createdBy?: string | null;
};

export class PrismaParametrizacoesRepository {
  async listStatusGravacao(tenantId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<StatusRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
        FROM status_gravacao
        WHERE tenant_id = $1
        ORDER BY nome ASC
      `,
      tenantId,
    );
  }

  async findStatusGravacao(id: string) {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<StatusRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
        FROM status_gravacao
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ?? null;
  }

  async saveStatusGravacao(input: SaveStatusGravacaoInput) {
    await ensureTables();

    if (input.isInicial) {
      await prisma.$executeRawUnsafe(
        `UPDATE status_gravacao SET is_inicial = false, updated_at = NOW() WHERE tenant_id = $1`,
        input.tenantId,
      );
    }

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<StatusRow[]>(
        `
          UPDATE status_gravacao
          SET
            codigo_externo = $1,
            nome = $2,
            descricao = $3,
            cor = $4,
            is_inicial = $5,
            updated_at = NOW()
          WHERE id = $6 AND tenant_id = $7
          RETURNING id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.nome,
        input.descricao ?? null,
        input.cor ?? '#888888',
        input.isInicial ?? false,
        input.id,
        input.tenantId,
      );

      if (rows[0]) {
        return rows[0];
      }
    }

    const id = input.id ?? randomUUID();
    const rows = await prisma.$queryRawUnsafe<StatusRow[]>(
      `
        INSERT INTO status_gravacao (
          id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, updated_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9)
        RETURNING id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
      `,
      id,
      input.tenantId,
      input.codigoExterno ?? null,
      input.codigoExterno ?? null,
      input.nome,
      input.descricao ?? null,
      input.cor ?? '#888888',
      input.isInicial ?? false,
      input.createdBy ?? null,
    );

    return rows[0];
  }

  async removeStatusGravacao(id: string) {
    await ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM status_gravacao WHERE id = $1`, id);
  }

  async setStatusGravacaoInicial(tenantId: string, id: string, value: boolean) {
    await ensureTables();
    if (value) {
      await prisma.$executeRawUnsafe(`UPDATE status_gravacao SET is_inicial = false, updated_at = NOW() WHERE tenant_id = $1`, tenantId);
    }

    const rows = await prisma.$queryRawUnsafe<StatusRow[]>(
      `
        UPDATE status_gravacao
        SET is_inicial = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
      `,
      value,
      id,
      tenantId,
    );

    return rows[0] ?? null;
  }

  async listStatusTarefa(tenantId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<StatusRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
        FROM status_tarefa
        WHERE tenant_id = $1
        ORDER BY nome ASC
      `,
      tenantId,
    );
  }

  async findStatusTarefa(id: string) {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<StatusRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
        FROM status_tarefa
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ?? null;
  }

  async saveStatusTarefa(input: SaveStatusTarefaInput) {
    await ensureTables();

    if (input.isInicial) {
      await prisma.$executeRawUnsafe(
        `UPDATE status_tarefa SET is_inicial = false, updated_at = NOW() WHERE tenant_id = $1`,
        input.tenantId,
      );
    }

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<StatusRow[]>(
        `
          UPDATE status_tarefa
          SET
            codigo = $1,
            codigo_externo = $2,
            nome = $3,
            descricao = $4,
            cor = $5,
            is_inicial = $6,
            updated_at = NOW()
          WHERE id = $7 AND tenant_id = $8
          RETURNING id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
        `,
        input.codigo ?? null,
        input.codigo ?? null,
        input.nome,
        input.descricao ?? null,
        input.cor ?? '#888888',
        input.isInicial ?? false,
        input.id,
        input.tenantId,
      );

      if (rows[0]) {
        return rows[0];
      }
    }

    const id = input.id ?? randomUUID();
    const rows = await prisma.$queryRawUnsafe<StatusRow[]>(
      `
        INSERT INTO status_tarefa (
          id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, updated_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9)
        RETURNING id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
      `,
      id,
      input.tenantId,
      input.codigo ?? null,
      input.codigo ?? null,
      input.nome,
      input.descricao ?? null,
      input.cor ?? '#888888',
      input.isInicial ?? false,
      input.createdBy ?? null,
    );

    return rows[0];
  }

  async removeStatusTarefa(id: string) {
    await ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM status_tarefa WHERE id = $1`, id);
  }

  async setStatusTarefaInicial(tenantId: string, id: string, value: boolean) {
    await ensureTables();
    if (value) {
      await prisma.$executeRawUnsafe(`UPDATE status_tarefa SET is_inicial = false, updated_at = NOW() WHERE tenant_id = $1`, tenantId);
    }

    const rows = await prisma.$queryRawUnsafe<StatusRow[]>(
      `
        UPDATE status_tarefa
        SET is_inicial = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING id, tenant_id, codigo_externo, codigo, nome, descricao, cor, is_inicial, created_at, created_by
      `,
      value,
      id,
      tenantId,
    );

    return rows[0] ?? null;
  }

  async listCategoriasIncidencia(tenantId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<TituloRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
        FROM categorias_incidencia
        WHERE tenant_id = $1
        ORDER BY titulo ASC
      `,
      tenantId,
    );
  }

  async findCategoriaIncidencia(id: string) {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
        FROM categorias_incidencia
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ?? null;
  }

  async saveCategoriaIncidencia(input: SaveTituloInput) {
    await ensureTables();
    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
        `
          UPDATE categorias_incidencia
          SET codigo_externo = $1, titulo = $2, descricao = $3, updated_at = NOW()
          WHERE id = $4 AND tenant_id = $5
          RETURNING id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.titulo,
        input.descricao ?? null,
        input.id,
        input.tenantId,
      );
      if (rows[0]) return rows[0];
    }

    const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
      `
        INSERT INTO categorias_incidencia (id, tenant_id, codigo_externo, titulo, descricao, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
      `,
      input.id ?? randomUUID(),
      input.tenantId,
      input.codigoExterno ?? null,
      input.titulo,
      input.descricao ?? null,
      input.createdBy ?? null,
    );

    return rows[0];
  }

  async removeCategoriaIncidencia(id: string) {
    await ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM categorias_incidencia WHERE id = $1`, id);
  }

  async listClassificacoesIncidencia(categoriaId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<TituloRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
        FROM classificacoes_incidencia
        WHERE categoria_incidencia_id = $1
        ORDER BY titulo ASC
      `,
      categoriaId,
    );
  }

  async findClassificacaoIncidencia(id: string) {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<Array<TituloRow & { categoria_incidencia_id: string }>>(
      `
        SELECT id, tenant_id, categoria_incidencia_id, codigo_externo, titulo, descricao, created_at, created_by
        FROM classificacoes_incidencia
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );
    return rows[0] ?? null;
  }

  async saveClassificacaoIncidencia(input: SaveClassificacaoInput) {
    await ensureTables();
    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
        `
          UPDATE classificacoes_incidencia
          SET codigo_externo = $1, titulo = $2, descricao = $3, updated_at = NOW()
          WHERE id = $4 AND tenant_id = $5
          RETURNING id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.titulo,
        input.descricao ?? null,
        input.id,
        input.tenantId,
      );
      if (rows[0]) return rows[0];
    }

    const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
      `
        INSERT INTO classificacoes_incidencia (
          id, tenant_id, categoria_incidencia_id, codigo_externo, titulo, descricao, created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
      `,
      input.id ?? randomUUID(),
      input.tenantId,
      input.categoriaIncidenciaId,
      input.codigoExterno ?? null,
      input.titulo,
      input.descricao ?? null,
      input.createdBy ?? null,
    );

    return rows[0];
  }

  async removeClassificacaoIncidencia(id: string) {
    await ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM classificacoes_incidencia WHERE id = $1`, id);
  }

  async listSeveridadesIncidencia(tenantId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<TituloRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, titulo, descricao, cor, created_at, created_by
        FROM severidades_incidencia
        WHERE tenant_id = $1
        ORDER BY titulo ASC
      `,
      tenantId,
    );
  }

  async findSeveridadeIncidencia(id: string) {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, titulo, descricao, cor, created_at, created_by
        FROM severidades_incidencia
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );
    return rows[0] ?? null;
  }

  async saveSeveridadeIncidencia(input: SaveTituloInput) {
    await ensureTables();
    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
        `
          UPDATE severidades_incidencia
          SET codigo_externo = $1, titulo = $2, descricao = $3, cor = $4, updated_at = NOW()
          WHERE id = $5 AND tenant_id = $6
          RETURNING id, tenant_id, codigo_externo, titulo, descricao, cor, created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.titulo,
        input.descricao ?? null,
        input.cor ?? '#888888',
        input.id,
        input.tenantId,
      );
      if (rows[0]) return rows[0];
    }

    const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
      `
        INSERT INTO severidades_incidencia (id, tenant_id, codigo_externo, titulo, descricao, cor, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, tenant_id, codigo_externo, titulo, descricao, cor, created_at, created_by
      `,
      input.id ?? randomUUID(),
      input.tenantId,
      input.codigoExterno ?? null,
      input.titulo,
      input.descricao ?? null,
      input.cor ?? '#888888',
      input.createdBy ?? null,
    );

    return rows[0];
  }

  async removeSeveridadeIncidencia(id: string) {
    await ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM severidades_incidencia WHERE id = $1`, id);
  }

  async listImpactosIncidencia(tenantId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<TituloRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
        FROM impactos_incidencia
        WHERE tenant_id = $1
        ORDER BY titulo ASC
      `,
      tenantId,
    );
  }

  async findImpactoIncidencia(id: string) {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
        FROM impactos_incidencia
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );
    return rows[0] ?? null;
  }

  async saveImpactoIncidencia(input: SaveTituloInput) {
    await ensureTables();
    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
        `
          UPDATE impactos_incidencia
          SET codigo_externo = $1, titulo = $2, descricao = $3, updated_at = NOW()
          WHERE id = $4 AND tenant_id = $5
          RETURNING id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.titulo,
        input.descricao ?? null,
        input.id,
        input.tenantId,
      );
      if (rows[0]) return rows[0];
    }

    const rows = await prisma.$queryRawUnsafe<TituloRow[]>(
      `
        INSERT INTO impactos_incidencia (id, tenant_id, codigo_externo, titulo, descricao, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, tenant_id, codigo_externo, titulo, descricao, created_at, created_by
      `,
      input.id ?? randomUUID(),
      input.tenantId,
      input.codigoExterno ?? null,
      input.titulo,
      input.descricao ?? null,
      input.createdBy ?? null,
    );

    return rows[0];
  }

  async removeImpactoIncidencia(id: string) {
    await ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM impactos_incidencia WHERE id = $1`, id);
  }

  async listCentrosLucro(tenantId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<CentroLucroRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao, status, parent_id, created_at, created_by
        FROM centros_lucro
        WHERE tenant_id = $1
        ORDER BY nome ASC
      `,
      tenantId,
    );
  }

  async findCentroLucro(id: string) {
    await ensureTables();
    const rows = await prisma.$queryRawUnsafe<CentroLucroRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao, status, parent_id, created_at, created_by
        FROM centros_lucro
        WHERE id = $1
        LIMIT 1
      `,
      id,
    );
    return rows[0] ?? null;
  }

  async saveCentroLucro(input: SaveCentroLucroInput) {
    await ensureTables();
    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<CentroLucroRow[]>(
        `
          UPDATE centros_lucro
          SET
            codigo_externo = $1,
            nome = $2,
            descricao = $3,
            status = $4,
            parent_id = $5,
            updated_at = NOW()
          WHERE id = $6 AND tenant_id = $7
          RETURNING id, tenant_id, codigo_externo, nome, descricao, status, parent_id, created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.nome,
        input.descricao ?? null,
        input.status ?? 'Ativo',
        input.parentId ?? null,
        input.id,
        input.tenantId,
      );
      if (rows[0]) return rows[0];
    }

    const rows = await prisma.$queryRawUnsafe<CentroLucroRow[]>(
      `
        INSERT INTO centros_lucro (id, tenant_id, codigo_externo, nome, descricao, status, parent_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, tenant_id, codigo_externo, nome, descricao, status, parent_id, created_at, created_by
      `,
      input.id ?? randomUUID(),
      input.tenantId,
      input.codigoExterno ?? null,
      input.nome,
      input.descricao ?? null,
      input.status ?? 'Ativo',
      input.parentId ?? null,
      input.createdBy ?? null,
    );

    return rows[0];
  }

  async removeCentroLucro(id: string) {
    await ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM centros_lucro WHERE id = $1`, id);
  }

  async listUnidadesNegocio(tenantId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<UnidadeRow[]>(
      `
        SELECT id::text as id, nome
        FROM unidades_negocio
        WHERE tenant_id::text = $1
        ORDER BY nome ASC
      `,
      tenantId,
    );
  }

  async listCentroLucroUnidades(centroLucroId: string) {
    await ensureTables();
    return prisma.$queryRawUnsafe<CentroLucroUnidadeRow[]>(
      `
        SELECT id, unidade_negocio_id
        FROM centro_lucro_unidades
        WHERE centro_lucro_id = $1
        ORDER BY created_at ASC
      `,
      centroLucroId,
    );
  }

  async replaceCentroLucroUnidades(tenantId: string, centroLucroId: string, unidadeIds: string[]) {
    await ensureTables();
    await prisma.$executeRawUnsafe(`DELETE FROM centro_lucro_unidades WHERE centro_lucro_id = $1`, centroLucroId);

    for (const unidadeId of unidadeIds) {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO centro_lucro_unidades (id, centro_lucro_id, tenant_id, unidade_negocio_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `,
        randomUUID(),
        centroLucroId,
        tenantId,
        unidadeId,
      );
    }
  }
}
