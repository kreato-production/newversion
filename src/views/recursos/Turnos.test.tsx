import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Turnos, { TURNOS_PERMISSION_SCOPE } from './Turnos';
import { usePermissions } from '@/hooks/usePermissions';

vi.mock('@/hooks/usePermissions');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'pt-BR',
    setLanguage: vi.fn(),
  }),
}));
vi.mock('@/modules/turnos/turnos.repository.provider', () => ({
  turnosRepository: {
    list: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    remove: vi.fn(),
  },
}));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
  SearchBar: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input aria-label="search" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
  DataCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  EmptyState: ({
    title,
    description,
    actionLabel,
    onAction,
  }: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
      {onAction && actionLabel ? <button onClick={onAction}>{actionLabel}</button> : null}
    </div>
  ),
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/shared/NewButton', () => ({
  NewButton: ({ tooltip, onClick }: { tooltip: string; onClick: () => void }) => (
    <button onClick={onClick}>{tooltip}</button>
  ),
}));
vi.mock('@/components/shared/SortableTable', () => ({
  SortableTable: () => <div>table</div>,
}));
vi.mock('@/components/listing', () => ({
  useListingView: () => ({
    mode: 'list',
    setMode: vi.fn(),
    visibleColumnKeys: ['nome', 'actions'],
    toggleColumn: vi.fn(),
    resetColumns: vi.fn(),
    optionalColumns: [],
  }),
  ViewSwitcher: () => <div>switcher</div>,
  ColumnSelector: () => <div>columns</div>,
  CardGrid: () => <div>cards</div>,
  MasterDetail: () => <div>detail</div>,
}));
vi.mock('@/components/recursos/TurnoFormModal', () => ({
  TurnoFormModal: () => null,
}));

const mockUsePermissions = vi.mocked(usePermissions);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Turnos view', () => {
  it('usa o escopo correto de permissao do modulo', async () => {
    const canIncluir = vi.fn().mockReturnValue(false);
    const canAlterar = vi.fn().mockReturnValue(false);
    const canExcluir = vi.fn().mockReturnValue(false);

    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn().mockReturnValue(true),
      isVisible: vi.fn().mockReturnValue(true),
      isReadOnly: vi.fn().mockReturnValue(false),
      canIncluir,
      canAlterar,
      canExcluir,
      getFieldPermission: vi.fn().mockReturnValue(null),
      permissions: [],
      enabledModules: new Set<string>(),
    });

    render(<Turnos />);

    await waitFor(() => expect(screen.getByText('turns.title')).toBeInTheDocument());

    expect(canIncluir).toHaveBeenCalledWith(
      TURNOS_PERMISSION_SCOPE.modulo,
      TURNOS_PERMISSION_SCOPE.subModulo1,
      TURNOS_PERMISSION_SCOPE.subModulo2,
    );
    expect(canAlterar).toHaveBeenCalledWith(
      TURNOS_PERMISSION_SCOPE.modulo,
      TURNOS_PERMISSION_SCOPE.subModulo1,
      TURNOS_PERMISSION_SCOPE.subModulo2,
    );
    expect(canExcluir).toHaveBeenCalledWith(
      TURNOS_PERMISSION_SCOPE.modulo,
      TURNOS_PERMISSION_SCOPE.subModulo1,
      TURNOS_PERMISSION_SCOPE.subModulo2,
    );
    expect(screen.queryByText('turns.new')).not.toBeInTheDocument();
  });
});
