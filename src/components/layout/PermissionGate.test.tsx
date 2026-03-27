import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGate } from './PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';

vi.mock('@/hooks/usePermissions');

const mockUsePermissions = vi.mocked(usePermissions);

function buildPermissions(hasPermission: boolean) {
  return {
    hasPermission: vi.fn().mockReturnValue(hasPermission),
    isVisible: vi.fn().mockReturnValue(hasPermission),
    isReadOnly: vi.fn().mockReturnValue(false),
    canIncluir: vi.fn().mockReturnValue(hasPermission),
    canAlterar: vi.fn().mockReturnValue(hasPermission),
    canExcluir: vi.fn().mockReturnValue(hasPermission),
    getFieldPermission: vi.fn().mockReturnValue(null),
    permissions: [],
    enabledModules: new Set<string>(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PermissionGate', () => {
  it('renderiza children quando usuario tem permissao', () => {
    mockUsePermissions.mockReturnValue(buildPermissions(true));

    render(
      <PermissionGate modulo="Producao">
        <span>Conteudo protegido</span>
      </PermissionGate>,
    );

    expect(screen.getByText('Conteudo protegido')).toBeInTheDocument();
  });

  it('nao renderiza children quando usuario nao tem permissao', () => {
    mockUsePermissions.mockReturnValue(buildPermissions(false));

    render(
      <PermissionGate modulo="Producao">
        <span>Conteudo protegido</span>
      </PermissionGate>,
    );

    expect(screen.queryByText('Conteudo protegido')).not.toBeInTheDocument();
  });

  it('renderiza fallback quando sem permissao e fallback fornecido', () => {
    mockUsePermissions.mockReturnValue(buildPermissions(false));

    render(
      <PermissionGate modulo="Producao" fallback={<span>Sem acesso</span>}>
        <span>Conteudo protegido</span>
      </PermissionGate>,
    );

    expect(screen.getByText('Sem acesso')).toBeInTheDocument();
    expect(screen.queryByText('Conteudo protegido')).not.toBeInTheDocument();
  });

  it('nao renderiza fallback quando usuario tem permissao', () => {
    mockUsePermissions.mockReturnValue(buildPermissions(true));

    render(
      <PermissionGate modulo="Producao" fallback={<span>Sem acesso</span>}>
        <span>Conteudo protegido</span>
      </PermissionGate>,
    );

    expect(screen.getByText('Conteudo protegido')).toBeInTheDocument();
    expect(screen.queryByText('Sem acesso')).not.toBeInTheDocument();
  });

  it('passa modulo e subModulo1 para hasPermission', () => {
    const perms = buildPermissions(true);
    mockUsePermissions.mockReturnValue(perms);

    render(
      <PermissionGate modulo="Producao" subModulo1="Gravacoes">
        <span>ok</span>
      </PermissionGate>,
    );

    expect(perms.hasPermission).toHaveBeenCalledWith('Producao', 'Gravacoes', undefined, undefined);
  });
});
