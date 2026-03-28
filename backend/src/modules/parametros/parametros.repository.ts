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
  createdAt: Date | null;
  createdBy: string | null;
};

export type SaveParametroInput = {
  id?: string;
  tenantId: string;
  codigoExterno?: string | null;
  nome: string;
  descricao?: string | null;
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

  async listByTenant(storageKey: string, tenantId: string, opts?: ListOptions): Promise<PaginatedResult<ParametroRecord>> {
    const tableName = resolveTableName(storageKey);
    const take = Math.min(opts?.limit ?? 200, 200);
    const skip = opts?.offset ?? 0;

    const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
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
    const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
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
    const idInsertExpr = await this.buildColumnValueExpression(tableName, 'id', 1);
    const tenantInsertExpr = await this.buildColumnValueExpression(tableName, 'tenant_id', 2);
    const createdByInsertExpr = await this.buildColumnValueExpression(tableName, 'created_by', 6);

    if (input.id) {
      const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
        `
          UPDATE ${tableName}
          SET
            codigo_externo = $1,
            nome = $2,
            descricao = $3,
            updated_at = NOW()
          WHERE id::text = $4 AND tenant_id::text = $5
          RETURNING id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
        `,
        input.codigoExterno ?? null,
        input.nome,
        input.descricao ?? null,
        input.id,
        input.tenantId,
      );

      if (rows[0]) {
        return mapRow(rows[0]);
      }
    }

    const createdId = input.id ?? randomUUID();
    const rows = await prisma.$queryRawUnsafe<ParametroRow[]>(
      `
        INSERT INTO ${tableName} (
          id,
          tenant_id,
          codigo_externo,
          nome,
          descricao,
          created_at,
          updated_at,
          created_by
        )
        VALUES (${idInsertExpr}, ${tenantInsertExpr}, $3, $4, $5, NOW(), NOW(), ${createdByInsertExpr})
        RETURNING id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
      `,
      createdId,
      input.tenantId,
      input.codigoExterno ?? null,
      input.nome,
      input.descricao ?? null,
      input.createdBy ?? null,
    );

    return mapRow(rows[0]);
  }

  async remove(storageKey: string, id: string): Promise<void> {
    const tableName = resolveTableName(storageKey);
    await prisma.$executeRawUnsafe(`DELETE FROM ${tableName} WHERE id::text = $1`, id);
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
