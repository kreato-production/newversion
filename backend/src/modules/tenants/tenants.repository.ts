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

export class PrismaTenantsRepository implements TenantsRepository {
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
    await prisma.tenant.delete({ where: { id } });
  }

  private async generateUniqueSlug(nome: string, currentId?: string): Promise<string> {
    const base = slugify(nome);
    let candidate = base;
    let counter = 2;

    while (true) {
      const existing = await this.findBySlug(candidate);
      if (!existing || existing.id === currentId) {
        return candidate;
      }

      candidate = `${base}-${counter}`;
      counter += 1;
    }
  }
}
