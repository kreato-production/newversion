import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type TenantRecord = {
  id: string;
  nome: string;
  slug: string;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  plano: string | null;
  notas: string | null;
  createdAt: Date;
  licencaFim: Date | null;
};

export type SaveTenantInput = {
  id?: string;
  nome: string;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  plano?: string | null;
  notas?: string | null;
};

export type TenantLicenseRecord = {
  id: string;
  tenantId: string;
  dataInicio: Date;
  dataFim: Date;
};

export type TenantModuleRecord = {
  modulo: string;
};

export type TenantUnidadeRecord = {
  id: string;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  moeda: string;
};

export type SaveTenantUnidadeInput = {
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  moeda?: string | null;
  createdByName?: string | null;
};

type TenantRow = {
  id: string;
  nome: string;
  slug: string;
  status: string;
  plano: string | null;
  notas: string | null;
  createdAt: Date;
  licencaFim: Date | null;
};

export interface TenantsRepository {
  list(): Promise<TenantRecord[]>;
  findById(id: string): Promise<TenantRecord | null>;
  findBySlug(slug: string): Promise<TenantRecord | null>;
  save(input: SaveTenantInput): Promise<TenantRecord>;
  remove(id: string): Promise<void>;
  listLicencas(tenantId: string): Promise<TenantLicenseRecord[]>;
  addLicenca(input: { tenantId: string; dataInicio: Date; dataFim: Date }): Promise<TenantLicenseRecord>;
  removeLicenca(tenantId: string, licencaId: string): Promise<void>;
  listModulos(tenantId: string): Promise<TenantModuleRecord[]>;
  setModulo(input: { tenantId: string; modulo: string; enabled: boolean }): Promise<void>;
  listUnidades(tenantId: string): Promise<TenantUnidadeRecord[]>;
  findUnidadeById(tenantId: string, unidadeId: string): Promise<TenantUnidadeRecord | null>;
  createUnidade(input: SaveTenantUnidadeInput): Promise<TenantUnidadeRecord>;
  updateUnidade(unidadeId: string, input: SaveTenantUnidadeInput): Promise<TenantUnidadeRecord>;
  removeUnidade(tenantId: string, unidadeId: string): Promise<void>;
}

function mapTenant(row: TenantRow): TenantRecord {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    status: row.status as TenantRecord['status'],
    plano: row.plano,
    notas: row.notas,
    createdAt: row.createdAt,
    licencaFim: row.licencaFim,
  };
}

function slugify(value: string): string {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || 'tenant';
}

const tenantSelection = Prisma.sql`
  SELECT
    t.id,
    t.nome,
    t.slug,
    t.status::text AS status,
    t.plano,
    t.notas,
    t."createdAt" AS "createdAt",
    (
      SELECT MAX(l."dataFim")
      FROM "TenantLicense" l
      WHERE l."tenantId" = t.id
    ) AS "licencaFim"
  FROM "Tenant" t
`;

const DEFAULT_TENANT_MODULES = ['Dashboard', 'Produção', 'Recursos', 'Financeiro', 'Administração'];

// Normalize legacy mojibake values stored in DB back to correct UTF-8
function normalizeModuloName(value: string): string {
  if (value === 'ProduÃ§Ã£o') return 'Produção';
  if (value === 'AdministraÃ§Ã£o') return 'Administração';
  return value;
}

// Include legacy mojibake variants when deleting so old rows are also removed
function moduloVariants(value: string): string[] {
  if (value === 'Produção') return ['Produção', 'ProduÃ§Ã£o'];
  if (value === 'Administração') return ['Administração', 'AdministraÃ§Ã£o'];
  return [value];
}

export class PrismaTenantsRepository implements TenantsRepository {
  private tenantModulesReady: Promise<void> | null = null;

  async list(): Promise<TenantRecord[]> {
    const rows = await prisma.$queryRaw<TenantRow[]>(Prisma.sql`
      ${tenantSelection}
      ORDER BY t.nome ASC
    `);

    return rows.map(mapTenant);
  }

  async findById(id: string): Promise<TenantRecord | null> {
    const rows = await prisma.$queryRaw<TenantRow[]>(Prisma.sql`
      ${tenantSelection}
      WHERE t.id = ${id}
      LIMIT 1
    `);

    return rows[0] ? mapTenant(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<TenantRecord | null> {
    const rows = await prisma.$queryRaw<TenantRow[]>(Prisma.sql`
      ${tenantSelection}
      WHERE t.slug = ${slug}
      LIMIT 1
    `);

    return rows[0] ? mapTenant(rows[0]) : null;
  }

  async save(input: SaveTenantInput): Promise<TenantRecord> {
    const slug = await this.generateUniqueSlug(input.nome, input.id);

    const rows = input.id
      ? await prisma.$queryRaw<TenantRow[]>(Prisma.sql`
          UPDATE "Tenant"
          SET
            nome = ${input.nome},
            slug = ${slug},
            status = CAST(${input.status} AS "TenantStatus"),
            plano = ${input.plano ?? 'Mensal'},
            notas = ${input.notas ?? ''},
            "updatedAt" = NOW()
          WHERE id = ${input.id}
          RETURNING
            id,
            nome,
            slug,
            status::text AS status,
            plano,
            notas,
            "createdAt" AS "createdAt",
            NULL::timestamptz AS "licencaFim"
        `)
      : await prisma.$queryRaw<TenantRow[]>(Prisma.sql`
          INSERT INTO "Tenant" (
            id,
            nome,
            slug,
            status,
            plano,
            notas,
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${randomUUID()},
            ${input.nome},
            ${slug},
            CAST(${input.status} AS "TenantStatus"),
            ${input.plano ?? 'Mensal'},
            ${input.notas ?? ''},
            NOW(),
            NOW()
          )
          RETURNING
            id,
            nome,
            slug,
            status::text AS status,
            plano,
            notas,
            "createdAt" AS "createdAt",
            NULL::timestamptz AS "licencaFim"
        `);

    return mapTenant(rows[0]);
  }

  async remove(id: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`DELETE FROM tenant_modulos_backend WHERE tenant_id = $1`, id).catch(() => undefined);

      await tx.tenantLicense.deleteMany({ where: { tenantId: id } });
      await tx.gravacao.deleteMany({ where: { tenantId: id } });
      await tx.programa.deleteMany({ where: { tenantId: id } });
      await tx.equipe.deleteMany({ where: { tenantId: id } });
      await tx.unidadeNegocio.deleteMany({ where: { tenantId: id } });
      await tx.user.deleteMany({ where: { tenantId: id } });
      await tx.tenant.delete({ where: { id } });
    });
  }

  async listLicencas(tenantId: string): Promise<TenantLicenseRecord[]> {
    const items = await prisma.tenantLicense.findMany({
      where: { tenantId },
      orderBy: { dataInicio: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      tenantId: item.tenantId,
      dataInicio: item.dataInicio,
      dataFim: item.dataFim,
    }));
  }

  async addLicenca(input: { tenantId: string; dataInicio: Date; dataFim: Date }): Promise<TenantLicenseRecord> {
    const item = await prisma.tenantLicense.create({
      data: {
        tenantId: input.tenantId,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
      },
    });

    return {
      id: item.id,
      tenantId: item.tenantId,
      dataInicio: item.dataInicio,
      dataFim: item.dataFim,
    };
  }

  async removeLicenca(tenantId: string, licencaId: string): Promise<void> {
    await prisma.tenantLicense.deleteMany({
      where: { id: licencaId, tenantId },
    });
  }

  async listModulos(tenantId: string): Promise<TenantModuleRecord[]> {
    await this.ensureTenantModulesTable();

    const rows = await prisma.$queryRaw<Array<{ modulo: string }>>`
      SELECT modulo
      FROM tenant_modulos_backend
      WHERE tenant_id = ${tenantId}
      ORDER BY modulo ASC
    `;

    const modulos = rows.length > 0 ? rows.map((row) => normalizeModuloName(row.modulo)) : DEFAULT_TENANT_MODULES;
    return [...new Set(modulos)].map((modulo) => ({ modulo }));
  }

  async setModulo(input: { tenantId: string; modulo: string; enabled: boolean }): Promise<void> {
    await this.ensureTenantModulesTable();
    await this.seedDefaultModulesIfNeeded(input.tenantId);
    const modulo = normalizeModuloName(input.modulo);

    if (input.enabled) {
      await prisma.$executeRaw`
        INSERT INTO tenant_modulos_backend (tenant_id, modulo, created_at)
        VALUES (${input.tenantId}, ${modulo}, NOW())
        ON CONFLICT (tenant_id, modulo) DO NOTHING
      `;
      return;
    }

    const variants = moduloVariants(modulo);
    await prisma.$executeRawUnsafe(
      `DELETE FROM tenant_modulos_backend WHERE tenant_id = $1 AND modulo = ANY($2::text[])`,
      input.tenantId,
      variants,
    );
  }

  async listUnidades(tenantId: string): Promise<TenantUnidadeRecord[]> {
    const items = await prisma.unidadeNegocio.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      codigoExterno: item.codigoExterno,
      nome: item.nome,
      descricao: item.descricao,
      moeda: item.moeda,
    }));
  }

  async findUnidadeById(tenantId: string, unidadeId: string): Promise<TenantUnidadeRecord | null> {
    const item = await prisma.unidadeNegocio.findFirst({
      where: { id: unidadeId, tenantId },
    });

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      codigoExterno: item.codigoExterno,
      nome: item.nome,
      descricao: item.descricao,
      moeda: item.moeda,
    };
  }

  async createUnidade(input: SaveTenantUnidadeInput): Promise<TenantUnidadeRecord> {
    const item = await prisma.unidadeNegocio.create({
      data: {
        tenantId: input.tenantId,
        codigoExterno: input.codigoExterno ?? null,
        nome: input.nome,
        descricao: input.descricao ?? null,
        imagemUrl: input.imagemUrl ?? null,
        moeda: input.moeda ?? 'BRL',
        createdByName: input.createdByName ?? null,
      },
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno,
      nome: item.nome,
      descricao: item.descricao,
      moeda: item.moeda,
    };
  }

  async updateUnidade(unidadeId: string, input: SaveTenantUnidadeInput): Promise<TenantUnidadeRecord> {
    const item = await prisma.unidadeNegocio.update({
      where: { id: unidadeId },
      data: {
        codigoExterno: input.codigoExterno ?? null,
        nome: input.nome,
        descricao: input.descricao ?? null,
        imagemUrl: input.imagemUrl ?? null,
        moeda: input.moeda ?? 'BRL',
        createdByName: input.createdByName ?? null,
      },
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno,
      nome: item.nome,
      descricao: item.descricao,
      moeda: item.moeda,
    };
  }

  async removeUnidade(tenantId: string, unidadeId: string): Promise<void> {
    await prisma.unidadeNegocio.deleteMany({
      where: { id: unidadeId, tenantId },
    });
  }

  private async generateUniqueSlug(nome: string, currentId?: string): Promise<string> {
    const base = slugify(nome);

    const rows = await prisma.$queryRaw<{ slug: string; id: string }[]>(Prisma.sql`
      SELECT slug, id FROM "Tenant"
      WHERE slug = ${base} OR slug LIKE ${`${base}-%`}
    `);

    const taken = new Set(
      rows.filter((r) => r.id !== currentId).map((r) => r.slug),
    );

    if (!taken.has(base)) return base;

    let counter = 2;
    while (taken.has(`${base}-${counter}`)) {
      counter++;
    }
    return `${base}-${counter}`;
  }

  private async ensureTenantModulesTable(): Promise<void> {
    if (!this.tenantModulesReady) {
      this.tenantModulesReady = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS tenant_modulos_backend (
            tenant_id text NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
            modulo text NOT NULL,
            created_at timestamptz NOT NULL DEFAULT NOW()
          )
        `);

        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS tenant_modulos_backend_tenant_modulo_key
          ON tenant_modulos_backend (tenant_id, modulo)
        `);

        // Migrate any legacy mojibake rows to correct UTF-8
        await prisma.$executeRawUnsafe(
          `UPDATE tenant_modulos_backend SET modulo = $1 WHERE modulo = $2`,
          'Produção', 'ProduÃ§Ã£o',
        );
        await prisma.$executeRawUnsafe(
          `UPDATE tenant_modulos_backend SET modulo = $1 WHERE modulo = $2`,
          'Administração', 'AdministraÃ§Ã£o',
        );
      })();
    }

    await this.tenantModulesReady;
  }

  private async seedDefaultModulesIfNeeded(tenantId: string): Promise<void> {
    const rows = await prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM tenant_modulos_backend
      WHERE tenant_id = ${tenantId}
    `;

    if (Number(rows[0]?.total ?? 0) > 0) {
      return;
    }

    for (const modulo of DEFAULT_TENANT_MODULES) {
      const normalizedModulo = normalizeModuloName(modulo);
      await prisma.$executeRaw`
        INSERT INTO tenant_modulos_backend (tenant_id, modulo, created_at)
        VALUES (${tenantId}, ${normalizedModulo}, NOW())
        ON CONFLICT (tenant_id, modulo) DO NOTHING
      `;
    }
  }
}
