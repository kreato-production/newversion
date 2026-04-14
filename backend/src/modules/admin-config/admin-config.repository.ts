import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

export type PerfilRecord = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  descricao: string | null;
  createdAt: Date;
  createdBy: string | null;
};

export type PermissionRecord = {
  id: string;
  perfilId: string;
  tenantId: string;
  modulo: string;
  subModulo1: string;
  subModulo2: string;
  campo: string;
  acao: 'visible' | 'invisible';
  somenteLeitura: boolean;
  incluir: boolean;
  alterar: boolean;
  excluir: boolean;
  tipo: 'modulo' | 'submodulo1' | 'submodulo2' | 'campo';
};

export type FormularioCampoRecord = {
  campo: string;
  tipoValidacao: 'obrigatorio' | 'sugerido' | null;
  tamanho: string | null;
  posicao: number | null;
};

export interface AdminConfigRepository {
  findPerfilById(tenantId: string, perfilId: string): Promise<PerfilRecord | null>;
  listPerfilPermissions(tenantId: string, perfilId: string): Promise<PermissionRecord[]>;
  replacePerfilPermissions(tenantId: string, perfilId: string, permissions: PermissionRecord[]): Promise<void>;
  listFormularioCampos(tenantId: string, formularioId: string): Promise<FormularioCampoRecord[]>;
  replaceFormularioCampos(tenantId: string, formularioId: string, campos: FormularioCampoRecord[]): Promise<void>;
}

type PerfilRow = {
  id: string;
  tenant_id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  created_at: Date;
  created_by: string | null;
};

type PermissionRow = {
  id: string;
  perfil_id: string;
  tenant_id: string;
  modulo: string;
  sub_modulo1: string | null;
  sub_modulo2: string | null;
  campo: string | null;
  acao: string;
  somente_leitura: boolean;
  incluir: boolean;
  alterar: boolean;
  excluir: boolean;
  tipo: string;
};

type FormularioCampoRow = {
  campo: string;
  tipo_validacao: 'obrigatorio' | 'sugerido' | null;
  tamanho: string | null;
  posicao: number | null;
};

function generatePermissionId(modulo: string, subModulo1: string, subModulo2: string, campo: string): string {
  return `${modulo}_${subModulo1}_${subModulo2}_${campo}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

function mapPerfil(row: PerfilRow): PerfilRecord {
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

function mapPermission(row: PermissionRow): PermissionRecord {
  const subModulo1 = row.sub_modulo1 || '-';
  const subModulo2 = row.sub_modulo2 || '-';
  const campo = row.campo || '-';

  return {
    id: generatePermissionId(row.modulo, subModulo1, subModulo2, campo),
    perfilId: row.perfil_id,
    tenantId: row.tenant_id,
    modulo: row.modulo,
    subModulo1,
    subModulo2,
    campo,
    acao: row.acao === 'invisible' ? 'invisible' : 'visible',
    somenteLeitura: row.somente_leitura ?? false,
    incluir: row.incluir ?? true,
    alterar: row.alterar ?? true,
    excluir: row.excluir ?? true,
    tipo: (row.tipo as PermissionRecord['tipo']) || 'campo',
  };
}

export class PrismaAdminConfigRepository implements AdminConfigRepository {
  private formularioCamposReady: Promise<void> | null = null;

  async findPerfilById(tenantId: string, perfilId: string): Promise<PerfilRecord | null> {
    const rows = await prisma.$queryRawUnsafe<PerfilRow[]>(
      `
        SELECT id, tenant_id, codigo_externo, nome, descricao, created_at, created_by
        FROM perfis_acesso
        WHERE id = $1::uuid AND tenant_id = $2::uuid
        LIMIT 1
      `,
      perfilId,
      tenantId,
    );

    return rows[0] ? mapPerfil(rows[0]) : null;
  }

  async listPerfilPermissions(tenantId: string, perfilId: string): Promise<PermissionRecord[]> {
    const rows = await prisma.$queryRawUnsafe<PermissionRow[]>(
      `
        SELECT id, perfil_id, tenant_id, modulo, sub_modulo1, sub_modulo2, campo, acao, somente_leitura, incluir, alterar, excluir, tipo
        FROM perfil_permissoes
        WHERE tenant_id = $1::uuid AND perfil_id = $2::uuid
        ORDER BY modulo, sub_modulo1 NULLS FIRST, sub_modulo2 NULLS FIRST, campo NULLS FIRST
      `,
      tenantId,
      perfilId,
    );

    return rows.map(mapPermission);
  }

  async replacePerfilPermissions(tenantId: string, perfilId: string, permissions: PermissionRecord[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
          DELETE FROM perfil_permissoes
          WHERE tenant_id = $1::uuid AND perfil_id = $2::uuid
        `,
        tenantId,
        perfilId,
      );

      for (const permission of permissions) {
        await tx.$executeRawUnsafe(
          `
            INSERT INTO perfil_permissoes (
              id,
              perfil_id,
              tenant_id,
              modulo,
              sub_modulo1,
              sub_modulo2,
              campo,
              acao,
              somente_leitura,
              incluir,
              alterar,
              excluir,
              tipo,
              created_at,
              updated_at
            )
            VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          `,
          randomUUID(),
          perfilId,
          tenantId,
          permission.modulo,
          permission.subModulo1 === '-' ? null : permission.subModulo1,
          permission.subModulo2 === '-' ? null : permission.subModulo2,
          permission.campo === '-' ? null : permission.campo,
          permission.acao,
          permission.somenteLeitura,
          permission.incluir,
          permission.alterar,
          permission.excluir,
          permission.tipo,
        );
      }
    });
  }

  async listFormularioCampos(tenantId: string, formularioId: string): Promise<FormularioCampoRecord[]> {
    await this.ensureFormularioCamposTable();

    const rows = await prisma.$queryRawUnsafe<FormularioCampoRow[]>(
      `
        SELECT campo, tipo_validacao, tamanho, posicao
        FROM formulario_campos
        WHERE tenant_id = $1 AND formulario = $2
        ORDER BY COALESCE(posicao, 9999) ASC, campo ASC
      `,
      tenantId,
      formularioId,
    );

    return rows.map((row) => ({
      campo: row.campo,
      tipoValidacao: row.tipo_validacao,
      tamanho: row.tamanho ?? null,
      posicao: row.posicao != null ? Number(row.posicao) : null,
    }));
  }

  async replaceFormularioCampos(tenantId: string, formularioId: string, campos: FormularioCampoRecord[]): Promise<void> {
    await this.ensureFormularioCamposTable();

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
          DELETE FROM formulario_campos
          WHERE tenant_id = $1 AND formulario = $2
        `,
        tenantId,
        formularioId,
      );

      for (const campo of campos) {
        if (!campo.tipoValidacao && campo.tamanho == null && campo.posicao == null) {
          continue;
        }

        await tx.$executeRawUnsafe(
          `
            INSERT INTO formulario_campos (
              id,
              tenant_id,
              formulario,
              campo,
              tipo_validacao,
              tamanho,
              posicao,
              created_at,
              updated_at
            )
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `,
          randomUUID(),
          tenantId,
          formularioId,
          campo.campo,
          campo.tipoValidacao,
          campo.tamanho ?? null,
          campo.posicao ?? null,
        );
      }
    });
  }

  private async ensureFormularioCamposTable(): Promise<void> {
    if (!this.formularioCamposReady) {
      this.formularioCamposReady = (async () => {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS formulario_campos (
            id uuid PRIMARY KEY,
            tenant_id text NOT NULL,
            formulario text NOT NULL,
            campo text NOT NULL,
            tipo_validacao text NULL,
            tamanho text NULL,
            posicao integer NULL,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            updated_at timestamptz NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, formulario, campo)
          )
        `);
        await prisma.$executeRawUnsafe(`
          ALTER TABLE formulario_campos ADD COLUMN IF NOT EXISTS tamanho text NULL
        `);
        await prisma.$executeRawUnsafe(`
          ALTER TABLE formulario_campos ADD COLUMN IF NOT EXISTS posicao integer NULL
        `);
      })();
    }

    await this.formularioCamposReady;
  }
}
