import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type ParametroStorageKey =
  | 'kreato_cargos'
  | 'kreato_funcoes'
  | 'kreato_servicos'
  | 'kreato_classificacao'
  | 'kreato_material'
  | 'kreato_tipos_gravacao'
  | 'kreato_categoria_fornecedores'
  | 'kreato_tipo_figurino'
  | 'kreato_classificacao_pessoas'
  | 'kreato_status_gravacao'
  | 'kreato_status_tarefa'
  | 'kreato_departamentos'
  | 'kreato_perfis_acesso'
  | 'kreato_unidades_negocio';

export type ParametroRecord = {
  id: string;
  tenantId: string | null;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  cor: string | null;
  traducoes: Record<string, string> | null;
  createdAt: Date | null;
  createdBy: string | null;
};

export type SaveParametroInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
  cor?: string | null;
  traducoes?: Record<string, string> | null;
  createdBy?: string | null;
};

export type ListOptions = { limit?: number; offset?: number };
export type PaginatedResult<T> = { data: T[]; total: number };

const tableMapping: Record<ParametroStorageKey, string> = {
  kreato_cargos: 'cargos',
  kreato_funcoes: 'funcoes',
  kreato_servicos: 'servicos',
  kreato_classificacao: 'classificacoes',
  kreato_material: 'materiais',
  kreato_tipos_gravacao: 'tipos_gravacao',
  kreato_categoria_fornecedores: 'categorias_fornecedor',
  kreato_tipo_figurino: 'tipos_figurino',
  kreato_classificacao_pessoas: 'classificacoes_pessoa',
  kreato_status_gravacao: 'status_gravacao',
  kreato_status_tarefa: 'status_tarefa',
  kreato_departamentos: 'departamentos',
  kreato_perfis_acesso: 'perfis_acesso',
  kreato_unidades_negocio: 'unidades_negocio',
};

type ParametroRow = {
  id: string;
  tenant_id: string | null;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  cor: string | null;
  traducoes: Record<string, string> | null;
  created_at: Date | null;
  created_by: string | null;
};

type CachedColumnType = 'uuid' | 'text' | 'other';

function resolveTableName(storageKey: string): string {
  const tableName = tableMapping[storageKey as ParametroStorageKey];
  if (!tableName) {
    throw new Error(`Parametro nao suportado: ${storageKey}`);
  }

  return tableName;
}

function mapRow(row: ParametroRow): ParametroRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    codigoExterno: row.codigo_externo,
    nome: row.nome,
    descricao: row.descricao,
    cor: row.cor ?? null,
    traducoes: row.traducoes ?? null,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export interface ParametrosRepository {
  listByTenant(storageKey: string, tenantId: string, opts?: ListOptions): Promise<PaginatedResult<ParametroRecord>>;
  findById(storageKey: string, id: string): Promise<ParametroRecord | null>;
  save(storageKey: string, input: SaveParametroInput): Promise<ParametroRecord>;
  remove(storageKey: string, id: string): Promise<void>;
}

export class PrismaParametrosRepository implements ParametrosRepository {
  private readonly columnTypeCache = new Map<string, CachedColumnType>();
  private readonly traducoesMigrated = new Set<string>();

  private async ensureTraducoes(tableName: string): Promise<void> {
    if (this.traducoesMigrated.has(tableName)) return;
    this.traducoesMigrated.add(tableName);
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS traducoes jsonb NULL DEFAULT '{}'::jsonb`,
      );
      // Warm up the hasColumn cache so subsequent calls don't re-query
      this.columnTypeCache.set(`${tableName}.traducoes.exists`, 'text');
    } catch {
      // Table might not exist yet — silently ignore
    }
  }

  async listByTenant(storageKey: string, tenantId: string, opts?: ListOptions): Promise<PaginatedResult<ParametroRecord>> {
    const tableName = resolveTableName(storageKey);
    await this.ensureTraducoes(tableName);
    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const hasCor = await this.hasColumn(tableName, 'cor');
    const corSelect = hasCor ? ', cor' : ', NULL::text AS cor';
    const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao${corSelect}, traducoes, created_at, created_by
        FROM ${tableName}
        WHERE tenant_id::text = $1
        ORDER BY nome ASC
        LIMIT $2 OFFSET $3
      `,
      tenantId,
      take,
      skip,
    );

    const totals = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `
        SELECT COUNT(*)::bigint AS total
        FROM ${tableName}
        WHERE tenant_id::text = $1
      `,
      tenantId,
    );

    return {
      data: rows.map(mapRow),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findById(storageKey: string, id: string): Promise<ParametroRecord | null> {
    const tableName = resolveTableName(storageKey);
    await this.ensureTraducoes(tableName);
    const hasCor = await this.hasColumn(tableName, 'cor');
    const corSelect = hasCor ? ', cor' : ', NULL::text AS cor';
    const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao${corSelect}, traducoes, created_at, created_by
        FROM ${tableName}
        WHERE id::text = $1
        LIMIT 1
      `,
      id,
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async save(storageKey: string, input: SaveParametroInput): Promise<ParametroRecord> {
    const tableName = resolveTableName(storageKey);
    await this.ensureTraducoes(tableName);
    const hasCor = await this.hasColumn(tableName, 'cor');
    const hasUpdatedAt = await this.hasColumn(tableName, 'updated_at');
    const corSelect = hasCor ? ', cor' : ', NULL::text AS cor';
    const idInsertExpr = await this.buildColumnValueExpression(tableName, 'id', 1);
    const tenantInsertExpr = await this.buildColumnValueExpression(tableName, 'tenant_id', 2);
    const createdByInsertExpr = await this.buildColumnValueExpression(tableName, 'created_by', 6);
    const traducoes = input.traducoes ? JSON.stringify(input.traducoes) : '{}';

    if (input.id) {
      const corUpdateClause = hasCor ? ', cor = $7' : '';
      const updatedAtClause = hasUpdatedAt ? ', updated_at = NOW()' : '';
      const updateArgs: unknown[] = [
        input.codigoExterno ?? null,
        input.nome,
        input.descricao ?? null,
        traducoes,
        input.id,
        input.tenantId,
      ];
      if (hasCor) updateArgs.push(input.cor ?? null);

      const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
        `
          UPDATE ${tableName}
          SET
            codigo_externo = $1,
            nome = $2,
            descricao = $3,
            traducoes = $4::jsonb${updatedAtClause}${corUpdateClause}
          WHERE id::text = $5 AND tenant_id::text = $6
          RETURNING id, tenant_id, codigo_externo, nome, descricao${corSelect}, traducoes, created_at, created_by
        `,
        ...updateArgs,
      );

      if (rows[0]) {
        return mapRow(rows[0]);
      }
    }

    const createdId = input.id ?? randomUUID();
    const updatedAtInsertCol = hasUpdatedAt ? ', updated_at' : '';
    const updatedAtInsertVal = hasUpdatedAt ? ', NOW()' : '';

    if (hasCor) {
      const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
        `
          INSERT INTO ${tableName} (
            id, tenant_id, codigo_externo, nome, descricao, cor, created_at${updatedAtInsertCol}, created_by, traducoes
          )
          VALUES (${idInsertExpr}, ${tenantInsertExpr}, $3, $4, $5, $7, NOW()${updatedAtInsertVal}, ${createdByInsertExpr}, $8::jsonb)
          RETURNING id, tenant_id, codigo_externo, nome, descricao, cor, created_at, created_by, traducoes
        `,
        createdId,
        input.tenantId,
        input.codigoExterno ?? null,
        input.nome,
        input.descricao ?? null,
        input.createdBy ?? null,
        input.cor ?? null,
        traducoes,
      );
      return mapRow(rows[0]);
    }

    const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
      `
        INSERT INTO ${tableName} (
          id, tenant_id, codigo_externo, nome, descricao, created_at${updatedAtInsertCol}, created_by, traducoes
        )
        VALUES (${idInsertExpr}, ${tenantInsertExpr}, $3, $4, $5, NOW()${updatedAtInsertVal}, ${createdByInsertExpr}, $7::jsonb)
        RETURNING id, tenant_id, codigo_externo, nome, descricao, NULL::text AS cor, created_at, created_by, traducoes
      `,
      createdId,
      input.tenantId,
      input.codigoExterno ?? null,
      input.nome,
      input.descricao ?? null,
      input.createdBy ?? null,
      traducoes,
    );

    return mapRow(rows[0]);
  }

  async remove(storageKey: string, id: string): Promise<void> {
    const tableName = resolveTableName(storageKey);
    await prisma.$executeRawUnsafe(`DELETE FROM ${tableName} WHERE id::text = $1`, id);
  }

  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const cacheKey = `${tableName}.${columnName}.exists`;
    const cached = this.columnTypeCache.get(cacheKey);
    if (cached !== undefined) return cached !== 'other';

    const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
      ) AS exists`,
      tableName,
      columnName,
    );
    const exists = rows[0]?.exists ?? false;
    this.columnTypeCache.set(cacheKey, exists ? 'text' : 'other');
    return exists;
  }

  private async buildColumnValueExpression(tableName: string, columnName: string, paramPosition: number): Promise<string> {
    const columnType = await this.getColumnType(tableName, columnName);

    if (columnType === 'uuid') {
      return `$${paramPosition}::uuid`;
    }

    return `$${paramPosition}`;
  }

  private async getColumnType(tableName: string, columnName: string): Promise<CachedColumnType> {
    const cacheKey = `${tableName}.${columnName}`;
    const cached = this.columnTypeCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ data_type: string }>>(
      `
        SELECT data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      tableName,
      columnName,
    );

    const resolved: CachedColumnType =
      rows[0]?.data_type === 'uuid' ? 'uuid' : rows[0]?.data_type === 'text' ? 'text' : 'other';

    this.columnTypeCache.set(cacheKey, resolved);
    return resolved;
  }
}
