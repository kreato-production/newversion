import type { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import type { AuthService } from '../modules/auth/auth.service.js';
import type { PermissionItem, SessionUser } from '../modules/auth/auth.types.js';
import { createRequireAdminOrPermission } from './permissions.js';

const permission = (alterar: boolean): PermissionItem =>
  ({
    modulo: 'Administração',
    subModulo1: 'Formulários',
    subModulo2: '-',
    campo: '-',
    acao: 'visible',
    incluir: true,
    alterar,
    excluir: true,
  }) as PermissionItem;

function setup(permissions: PermissionItem[]) {
  const getPermissionsForUser = vi.fn().mockResolvedValue({
    permissions,
    enabledModules: ['Administração'],
  });
  const authService = { getPermissionsForUser } as unknown as AuthService;
  const guard = createRequireAdminOrPermission(authService, 'Administração', 'Formulários', 'alterar');
  const run = (role: SessionUser['role']) =>
    (guard as unknown as (request: FastifyRequest, reply: FastifyReply) => Promise<void>)(
      { user: { id: 'u1', tenantId: 't1', role } as SessionUser } as FastifyRequest,
      {} as FastifyReply,
    );
  return { run, getPermissionsForUser };
}

describe('createRequireAdminOrPermission (Administração > Formulários > alterar)', () => {
  it('libera administradores sem consultar o perfil', async () => {
    const { run, getPermissionsForUser } = setup([permission(false)]);
    await expect(run('TENANT_ADMIN')).resolves.toBeUndefined();
    await expect(run('GLOBAL_ADMIN')).resolves.toBeUndefined();
    expect(getPermissionsForUser).not.toHaveBeenCalled();
  });

  it('libera usuário comum com "alterar" no perfil', async () => {
    const { run } = setup([permission(true)]);
    await expect(run('USER')).resolves.toBeUndefined();
  });

  it('recusa usuário comum sem "alterar" no perfil', async () => {
    const { run } = setup([permission(false)]);
    await expect(run('USER')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('recusa sem usuário autenticado', async () => {
    const guard = createRequireAdminOrPermission(
      {} as AuthService,
      'Administração',
      'Formulários',
      'alterar',
    ) as unknown as (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    await expect(guard({} as FastifyRequest, {} as FastifyReply)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
