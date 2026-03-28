import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { resolveTenantId } from '../common/access.js';
import type { AdminConfigRepository } from './admin-config.repository.js';

export const permissionItemSchema = z.object({
  id: z.string().min(1),
  modulo: z.string().min(1),
  subModulo1: z.string().min(1),
  subModulo2: z.string().min(1),
  campo: z.string().min(1),
  acao: z.enum(['visible', 'invisible']),
  somenteLeitura: z.boolean(),
  incluir: z.boolean(),
  alterar: z.boolean(),
  excluir: z.boolean(),
  tipo: z.enum(['modulo', 'submodulo1', 'submodulo2', 'campo']),
});

export const savePerfilPermissionsSchema = z.object({
  permissoes: z.array(permissionItemSchema),
});

export const saveFormularioCamposSchema = z.object({
  campos: z.array(
    z.object({
      campo: z.string().min(1),
      tipoValidacao: z.enum(['obrigatorio', 'sugerido']).nullable(),
    }),
  ),
});

export type SavePerfilPermissionsDto = z.infer<typeof savePerfilPermissionsSchema>;
export type SaveFormularioCamposDto = z.infer<typeof saveFormularioCamposSchema>;

export class AdminConfigService {
  constructor(private readonly repository: AdminConfigRepository) {}

  async getPerfilPermissions(actor: SessionUser, perfilId: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const perfil = await this.repository.findPerfilById(tenantId, perfilId);

    if (!perfil) {
      throw new Error('Perfil nao encontrado');
    }

    const permissoes = await this.repository.listPerfilPermissions(tenantId, perfilId);
    return {
      perfilId,
      permissoes: permissoes.map((permission) => ({
        id: permission.id,
        modulo: permission.modulo,
        subModulo1: permission.subModulo1,
        subModulo2: permission.subModulo2,
        campo: permission.campo,
        acao: permission.acao,
        somenteLeitura: permission.somenteLeitura,
        incluir: permission.incluir,
        alterar: permission.alterar,
        excluir: permission.excluir,
        tipo: permission.tipo,
      })),
    };
  }

  async savePerfilPermissions(actor: SessionUser, perfilId: string, input: SavePerfilPermissionsDto) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const perfil = await this.repository.findPerfilById(tenantId, perfilId);

    if (!perfil) {
      throw new Error('Perfil nao encontrado');
    }

    await this.repository.replacePerfilPermissions(
      tenantId,
      perfilId,
      input.permissoes.map((permission) => ({
        ...permission,
        perfilId,
        tenantId,
      })),
    );
  }

  async getFormularioCampos(actor: SessionUser, formularioId: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const campos = await this.repository.listFormularioCampos(tenantId, formularioId);

    return {
      formulario: formularioId,
      campos: campos.map((campo) => ({
        campo: campo.campo,
        tipoValidacao: campo.tipoValidacao,
      })),
    };
  }

  async saveFormularioCampos(actor: SessionUser, formularioId: string, input: SaveFormularioCamposDto) {
    const tenantId = resolveTenantId(actor, actor.tenantId);

    await this.repository.replaceFormularioCampos(
      tenantId,
      formularioId,
      input.campos.map((campo) => ({
        campo: campo.campo,
        tipoValidacao: campo.tipoValidacao,
      })),
    );
  }
}
