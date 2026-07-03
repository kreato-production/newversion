import type { preHandlerHookHandler } from 'fastify';
import type { AuthService } from '../modules/auth/auth.service.js';
import { AccessError } from '../modules/common/access.js';
import { AuthError } from '../modules/auth/auth.service.js';
import { canPerformAction, type PermissionAction } from '../modules/auth/permission-check.js';

/**
 * Enforces the "Perfis de Acesso" incluir/alterar/excluir permission for a
 * given (modulo, subModulo1) at the backend, so it can't be bypassed by
 * calling the API directly — the granular permission matrix was previously
 * enforced only in the frontend (src/hooks/usePermissions.ts).
 *
 * `request.user.permissions` cannot be trusted here: requests proxied from
 * Next.js via X-Internal-Token arrive with an empty `permissions` array by
 * design (see plugins/internal-auth.ts) to keep that hop fast. This always
 * re-resolves permissions from the database for the acting user.
 *
 * Scope: enforces at modulo/subModulo1 granularity (resource-collection
 * level) — matches what a backend route naturally operates on. Field-level
 * (campo) and somenteLeitura restrictions remain frontend-only concerns.
 */
export function createRequirePermission(
  authService: AuthService,
  modulo: string,
  subModulo1: string,
  action: PermissionAction,
): preHandlerHookHandler {
  return async (request) => {
    const user = request.user;
    if (!user) {
      throw new AuthError('Usuario nao autenticado', 401);
    }

    if (user.role === 'GLOBAL_ADMIN') return;

    const { permissions, enabledModules } = await authService.getPermissionsForUser(
      user.id,
      user.tenantId,
      user.role,
    );

    const allowed = canPerformAction({ role: user.role, permissions, enabledModules }, modulo, subModulo1, action);

    if (!allowed) {
      throw new AccessError('Sem permissao para esta acao', 403);
    }
  };
}
