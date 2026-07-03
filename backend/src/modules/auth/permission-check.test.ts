import { describe, expect, it } from 'vitest';
import { canPerformAction, isModuleVisible, normalizePermissionKey } from './permission-check.js';
import type { PermissionItem } from './auth.types.js';

function permission(overrides: Partial<PermissionItem> & Pick<PermissionItem, 'modulo'>): PermissionItem {
  return {
    id: 'x',
    subModulo1: '-',
    subModulo2: '-',
    campo: '-',
    acao: 'visible',
    somenteLeitura: false,
    incluir: true,
    alterar: true,
    excluir: true,
    tipo: 'modulo',
    ...overrides,
  };
}

describe('normalizePermissionKey', () => {
  it('normaliza acentos, espacos e caixa', () => {
    expect(normalizePermissionKey('Produção')).toBe(normalizePermissionKey('producao'));
    expect(normalizePermissionKey('  Recursos   Humanos ')).toBe('recursos humanos');
  });
});

describe('canPerformAction', () => {
  it('permite tudo para GLOBAL_ADMIN independente de permissions', () => {
    const ctx = { role: 'GLOBAL_ADMIN' as const, permissions: [], enabledModules: [] };
    expect(canPerformAction(ctx, 'Produção', 'Programas', 'excluir')).toBe(true);
  });

  it('fail-open: permite quando nao ha nenhuma entrada de permissao configurada', () => {
    const ctx = { role: 'USER' as const, permissions: [], enabledModules: [] };
    expect(canPerformAction(ctx, 'Produção', 'Programas', 'incluir')).toBe(true);
  });

  it('bloqueia quando o modulo esta marcado invisible para o perfil', () => {
    const ctx = {
      role: 'USER' as const,
      permissions: [permission({ modulo: 'Produção', acao: 'invisible', tipo: 'modulo' })],
      enabledModules: ['Produção'],
    };
    expect(canPerformAction(ctx, 'Produção', 'Programas', 'incluir')).toBe(false);
  });

  it('bloqueia incluir quando o perfil desativou incluir para o submodulo', () => {
    const ctx = {
      role: 'USER' as const,
      permissions: [
        permission({ modulo: 'Produção', tipo: 'modulo' }),
        permission({ modulo: 'Produção', subModulo1: 'Programas', tipo: 'submodulo1', incluir: false }),
      ],
      enabledModules: ['Produção'],
    };
    expect(canPerformAction(ctx, 'Produção', 'Programas', 'incluir')).toBe(false);
    expect(canPerformAction(ctx, 'Produção', 'Programas', 'alterar')).toBe(true);
  });

  it('bloqueia quando o modulo do tenant esta desabilitado (enabledModules)', () => {
    const ctx = {
      role: 'USER' as const,
      permissions: [],
      enabledModules: ['Dashboard'],
    };
    expect(isModuleVisible(ctx, 'Financeiro')).toBe(false);
    expect(canPerformAction(ctx, 'Financeiro', 'Contas a Pagar', 'incluir')).toBe(false);
  });

  it('reproduz o cenario relatado: perfil com Producao marcada invisible bloqueia acoes', () => {
    // Regressao do caso luis_colaco / Tear - Operacional
    const ctx = {
      role: 'USER' as const,
      permissions: [
        permission({ modulo: 'Dashboard', tipo: 'modulo' }),
        permission({ modulo: 'Produção', acao: 'invisible', tipo: 'modulo' }),
      ],
      enabledModules: ['Dashboard', 'Produção', 'Recursos'],
    };
    expect(canPerformAction(ctx, 'Produção', 'Programas', 'incluir')).toBe(false);
    expect(canPerformAction(ctx, 'Produção', 'Programas', 'excluir')).toBe(false);
  });
});
