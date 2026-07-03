import type { PermissionItem } from './auth.types.js';

// Porta do backend para a mesma lógica de src/hooks/usePermissions.ts (frontend).
// Precisa espelhar exatamente as regras de lá — inclusive o comportamento
// "fail-open" quando não há entrada de permissão configurada — para que o que
// o usuário vê na UI corresponda ao que o backend efetivamente permite.

const decodeMojibake = (value: string): string => {
  let current = value;

  for (let index = 0; index < 3; index += 1) {
    if (!/[ÃÂ]/.test(current)) break;

    try {
      const bytes = Uint8Array.from(Array.from(current, (char) => char.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (!decoded || decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }

  return current;
};

export const normalizePermissionKey = (value?: string | null): string =>
  decodeMojibake(value || '-')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

function findPermission(
  permissions: PermissionItem[],
  modulo: string,
  subModulo1 = '-',
  subModulo2 = '-',
  campo = '-',
): PermissionItem | null {
  const normalizedModulo = normalizePermissionKey(modulo);
  const normalizedSubModulo1 = normalizePermissionKey(subModulo1);
  const normalizedSubModulo2 = normalizePermissionKey(subModulo2);
  const normalizedCampo = normalizePermissionKey(campo);

  return (
    permissions.find(
      (permission) =>
        normalizePermissionKey(permission.modulo) === normalizedModulo &&
        normalizePermissionKey(permission.subModulo1) === normalizedSubModulo1 &&
        normalizePermissionKey(permission.subModulo2) === normalizedSubModulo2 &&
        normalizePermissionKey(permission.campo) === normalizedCampo,
    ) || null
  );
}

function hasAnyEntryForModule(permissions: PermissionItem[], modulo: string): boolean {
  const normalizedModulo = normalizePermissionKey(modulo);
  return permissions.some((p) => normalizePermissionKey(p.modulo) === normalizedModulo);
}

export type PermissionAction = 'incluir' | 'alterar' | 'excluir';

export type PermissionCheckInput = {
  role: 'GLOBAL_ADMIN' | 'TENANT_ADMIN' | 'USER';
  permissions: PermissionItem[];
  enabledModules: string[];
};

/**
 * Mirrors usePermissions().isVisible for modulo/subModulo1 granularity.
 */
export function isModuleVisible(ctx: PermissionCheckInput, modulo: string, subModulo1 = '-'): boolean {
  const normalizedModulo = normalizePermissionKey(modulo);
  const normalizedEnabledModules = new Set(ctx.enabledModules.map((m) => normalizePermissionKey(m)));

  if (
    normalizedModulo !== normalizePermissionKey('Global') &&
    normalizedEnabledModules.size > 0 &&
    !normalizedEnabledModules.has(normalizedModulo)
  ) {
    return false;
  }

  if (ctx.role === 'GLOBAL_ADMIN') return true;

  const moduloPermission = findPermission(ctx.permissions, modulo, '-', '-', '-');
  if (moduloPermission?.acao === 'invisible') return false;

  if (subModulo1 === '-') return true;

  if (ctx.role !== 'TENANT_ADMIN' && ctx.permissions.length > 0 && !hasAnyEntryForModule(ctx.permissions, modulo)) {
    return true;
  }

  const subModulo1Permission = findPermission(ctx.permissions, modulo, subModulo1, '-', '-');
  if (subModulo1Permission?.acao === 'invisible') return false;

  return true;
}

/**
 * Mirrors usePermissions().canIncluir/canAlterar/canExcluir at modulo/subModulo1
 * granularity — the level that maps to a backend resource collection.
 * Field-level (campo) and somenteLeitura enforcement remain frontend-only.
 */
export function canPerformAction(
  ctx: PermissionCheckInput,
  modulo: string,
  subModulo1: string,
  action: PermissionAction,
): boolean {
  if (ctx.role === 'GLOBAL_ADMIN') return true;
  if (!isModuleVisible(ctx, modulo, subModulo1)) return false;

  const permission = findPermission(ctx.permissions, modulo, subModulo1, '-', '-');
  if (permission) return permission[action] ?? true;

  return true;
}
