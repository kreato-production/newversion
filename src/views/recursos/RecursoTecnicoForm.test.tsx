import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecursoTecnicoForm from './RecursoTecnicoForm';

const push = vi.fn();
const repo = vi.hoisted(() => ({ getById: vi.fn(), save: vi.fn(), listOptions: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock('@/modules/recursos-tecnicos/recursos-tecnicos.repository.provider', () => ({
  recursosTecnicosRepository: repo,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { tenantId: 't1' } }) }));
vi.mock('@/hooks/useFormFieldConfig', () => ({
  useFormFieldConfig: () => ({
    getAsterisk: (): null => null,
    validate: (): boolean => true,
    fieldLabel: (campo: string, fallback?: string) => fallback ?? campo,
    fieldLayout: (campo: string) => ({ 'data-campo': campo, style: {} }),
  }),
  FieldAsterisk: (): null => null,
  ConfigurableFieldGrid: ({ children }: { children?: import('react').ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canIncluir: () => true, canAlterar: () => true }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/shared/SearchableSelect', () => ({
  SearchableSelect: ({ options }: { options: Array<{ label: string }> }) => (
    <div>{options.map((o) => o.label).join(',')}</div>
  ),
}));

describe('RecursoTecnicoForm', () => {
  beforeEach(() => {
    push.mockClear();
    repo.getById.mockReset();
    repo.save.mockReset().mockResolvedValue(undefined);
    repo.listOptions.mockReset().mockResolvedValue({ funcoes: [{ id: 'f1', nome: 'Operador' }] });
  });

  it('cadastra no tenant do usuario e lista as funcoes', async () => {
    render(<RecursoTecnicoForm />);

    expect(await screen.findByText('Operador')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Grua' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() =>
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Grua', tenantId: 't1', funcaoOperadorId: undefined }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/recursos/tecnicos'));
  });

  it('carrega o recurso para edicao', async () => {
    repo.getById.mockResolvedValue({
      id: 'r1',
      codigoExterno: 'GR1',
      nome: 'Grua',
      funcaoOperador: 'Operador',
      funcaoOperadorId: 'f1',
    });
    render(<RecursoTecnicoForm id="r1" />);

    expect(await screen.findByDisplayValue('Grua')).toBeInTheDocument();
    expect(screen.getByDisplayValue('GR1')).toBeInTheDocument();
    expect(repo.getById).toHaveBeenCalledWith('r1');
  });
});
