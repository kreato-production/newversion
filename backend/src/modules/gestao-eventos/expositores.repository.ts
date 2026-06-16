import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type ExpositorProduto = {
  id: string;
  nome: string;
  descricao?: string | null;
  preco?: string | null;
};

export type ExpositorRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  logo: string | null;
  tipoExpositorId: string | null;
  tipoExpositorNome: string | null;
  descricao: string | null;
  tags: string[];
  contato: string | null;
  telefone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  produtos: ExpositorProduto[];
  createdAt: Date | null;
  createdBy: string | null;
};

export type SaveExpositorInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  logo?: string | null;
  tipoExpositorId?: string | null;
  descricao?: string | null;
  tags?: string[];
  contato?: string | null;
  telefone?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  produtos?: ExpositorProduto[];
  createdBy?: string | null;
};

export type ListExpositoresOptions = { limit?: number; offset?: number };
export type PaginatedExpositores = { data: ExpositorRecord[]; total: number };

type ExpositorRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  logo: string | null;
  tipo_expositor_id: string | null;
  tipo_expositor_nome: string | null;
  descricao: string | null;
  tags: string[] | null;
  contato: string | null;
  telefone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  produtos: ExpositorProduto[] | null;
  created_at: Date | null;
  created_by: string | null;
};

function mapRow(row: ExpositorRow): ExpositorRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    nome: row.nome,
    logo: row.logo,
    tipoExpositorId: row.tipo_expositor_id,
    tipoExpositorNome: row.tipo_expositor_nome,
    descricao: row.descricao,
    tags: Array.isArray(row.tags) ? row.tags : [],
    contato: row.contato,
    telefone: row.telefone,
    email: row.email,
    instagram: row.instagram,
    facebook: row.facebook,
    produtos: Array.isArray(row.produtos) ? row.produtos : [],
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export interface ExpositoresRepository {
  listByTenant(tenantId: string, opts?: ListExpositoresOptions): Promise<PaginatedExpositores>;
  findById(id: string, tenantId: string): Promise<ExpositorRecord | null>;
  save(input: SaveExpositorInput): Promise<ExpositorRecord>;
  remove(id: string, tenantId: string): Promise<void>;
}

export class PrismaExpositoresRepository implements ExpositoresRepository {
  async listByTenant(tenantId: string, opts?: ListExpositoresOptions): Promise<PaginatedExpositores> {
    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const [rows, totals] = await Promise.all([
      prisma.$queryRawUnsafe<ExpositorRow[]>(
        `SELECT e.id, e.tenant_id, e.codigo_externo, e.nome, e.logo, e.tipo_expositor_id,
                te.nome AS tipo_expositor_nome, e.descricao, e.tags, e.contato, e.telefone,
                e.email, e.instagram, e.facebook, e.produtos, e.created_at, e.created_by
         FROM expositores e
         LEFT JOIN tipos_expositor te ON te.id = e.tipo_expositor_id
         WHERE e.tenant_id = $1
         ORDER BY e.nome ASC
         LIMIT $2 OFFSET $3`,
        tenantId,
        take,
        skip,
      ),
      prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*)::bigint AS total FROM expositores WHERE tenant_id = $1`,
        tenantId,
      ),
    ]);

    return { data: rows.map(mapRow), total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: string, tenantId: string): Promise<ExpositorRecord | null> {
    const rows = await prisma.$queryRawUnsafe<ExpositorRow[]>(
      `SELECT e.id, e.tenant_id, e.codigo_externo, e.nome, e.logo, e.tipo_expositor_id,
              te.nome AS tipo_expositor_nome, e.descricao, e.tags, e.contato, e.telefone,
              e.email, e.instagram, e.facebook, e.produtos, e.created_at, e.created_by
       FROM expositores e
       LEFT JOIN tipos_expositor te ON te.id = e.tipo_expositor_id
       WHERE e.id = $1 AND e.tenant_id = $2
       LIMIT 1`,
      id,
      tenantId,
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async save(input: SaveExpositorInput): Promise<ExpositorRecord> {
    const tags = JSON.stringify(input.tags ?? []);
    const produtos = JSON.stringify(input.produtos ?? []);

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<ExpositorRow[]>(
        `UPDATE expositores
         SET codigo_externo = $1, nome = $2, logo = $3, tipo_expositor_id = $4,
             descricao = $5, tags = $6::jsonb, contato = $7, telefone = $8, email = $9,
             instagram = $10, facebook = $11, produtos = $12::jsonb, updated_at = NOW()
         WHERE id = $13 AND tenant_id = $14
         RETURNING id, tenant_id, codigo_externo, nome, logo, tipo_expositor_id,
                   NULL::text AS tipo_expositor_nome, descricao, tags, contato, telefone,
                   email, instagram, facebook, produtos, created_at, created_by`,
        input.codigoExterno ?? null,
        input.nome,
        input.logo ?? null,
        input.tipoExpositorId ?? null,
        input.descricao ?? null,
        tags,
        input.contato ?? null,
        input.telefone ?? null,
        input.email ?? null,
        input.instagram ?? null,
        input.facebook ?? null,
        produtos,
        input.id,
        input.tenantId,
      );
      return mapRow(rows[0]);
    }

    const newId = randomUUID();
    const rows = await prisma.$queryRawUnsafe<ExpositorRow[]>(
      `INSERT INTO expositores
         (id, tenant_id, codigo_externo, nome, logo, tipo_expositor_id, descricao, tags,
          contato, telefone, email, instagram, facebook, produtos, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14::jsonb, NOW(), NOW(), $15)
       RETURNING id, tenant_id, codigo_externo, nome, logo, tipo_expositor_id,
                 NULL::text AS tipo_expositor_nome, descricao, tags, contato, telefone,
                 email, instagram, facebook, produtos, created_at, created_by`,
      newId,
      input.tenantId,
      input.codigoExterno ?? null,
      input.nome,
      input.logo ?? null,
      input.tipoExpositorId ?? null,
      input.descricao ?? null,
      tags,
      input.contato ?? null,
      input.telefone ?? null,
      input.email ?? null,
      input.instagram ?? null,
      input.facebook ?? null,
      produtos,
      input.createdBy ?? null,
    );
    return mapRow(rows[0]);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await prisma.$executeRawUnsafe(
      `DELETE FROM expositores WHERE id = $1 AND tenant_id = $2`,
      id,
      tenantId,
    );
  }
}
