import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeriadoForm from './FeriadoForm';

const push = vi.fn();
const repo = vi.hoisted(() => ({ getById: vi.fn(), save: vi.fn() }));
const permissions = vi.hoisted(() => ({ alterar: true }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock('@/modules/feriados/feriados.api.repository', () => ({
  ApiFeriadosRepository: class {
    getById = repo.getById;
    save = repo.save;
  },
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canIncluir: () => true, canAlterar: () => permissions.alterar }),
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
vi.mock('@/components/shared/TraducaoTab', () => ({ TraducaoTab: () => <div>traducao</div> }));

describe('FeriadoForm', () => {
  beforeEach(() => {
    push.mockClear();
    repo.getById.mockReset();
    repo.save.mockReset().mockResolvedValue({});
    permissions.alterar = true;
  });

  it('cadastra um feriado e volta para a lista', async () => {
    render(<FeriadoForm />);

    fireEvent.change(screen.getByLabelText(/Data/), { target: { value: '2026-12-25' } });
    fireEvent.change(screen.getByLabelText(/^Feriado/), { target: { value: '  Natal ' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() =>
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: undefined, data: '2026-12-25', feriado: 'Natal' }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/recursos/feriados'));
  });

  it('carrega o feriado e respeita somente leitura', async () => {
    permissions.alterar = false;
    repo.getById.mockResolvedValue({
      id: 'f1',
      data: '2026-12-25',
      feriado: 'Natal',
      observacoes: '',
      traducoes: null,
      dataCadastro: '',
      usuarioCadastro: '',
    });
    render(<FeriadoForm id="f1" />);

    expect(await screen.findByDisplayValue('Natal')).toBeDisabled();
    expect(repo.getById).toHaveBeenCalledWith('f1');
    expect(screen.getByRole('heading', { name: 'Natal' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salvar|common\.save/ })).not.toBeInTheDocument();
  });
});
