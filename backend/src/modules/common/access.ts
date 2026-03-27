import type { SessionUser } from '../auth/auth.types.js';

export class AccessError extends Error {
  constructor(message: string, readonly statusCode = 403) {
    super(message);
    this.name = 'AccessError';
  }
}

export function resolveTenantId(actor: SessionUser, requestedTenantId?: string | null): string {
  if (actor.role === 'GLOBAL_ADMIN') {
    if (!requestedTenantId) {
      throw new AccessError('tenantId e obrigatorio para administracao global');
    }

    return requestedTenantId;
  }

  if (!actor.tenantId) {
    throw new AccessError('Usuario sem tenant associado');
  }

  if (requestedTenantId && requestedTenantId !== actor.tenantId) {
    throw new AccessError('Operacao fora do tenant permitido');
  }

  return actor.tenantId;
}

export function ensureSameTenant(actor: SessionUser, targetTenantId: string | null): void {
  if (actor.role === 'GLOBAL_ADMIN') {
    return;
  }

  if (!actor.tenantId || actor.tenantId !== targetTenantId) {
    throw new AccessError('Operacao fora do tenant permitido');
  }
}
