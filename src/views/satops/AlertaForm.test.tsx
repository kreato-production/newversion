import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AlertaForm from './AlertaForm';

const push = vi.fn();
const repo = vi.hoisted(() => ({ getAlerta: vi.fn(), saveAlerta: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock('@/modules/satops/satops.api.repository', () => ({
  ApiSatOpsRepository: class {
    getAlerta = repo.getAlerta;
    saveAlerta = repo.saveAlerta;
  },
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

describe('AlertaForm', () => {
  beforeEach(() => {
    push.mockClear();
    repo.getAlerta.mockReset();
    repo.saveAlerta.mockReset().mockResolvedValue({});
  });

  it('cadastra com os valores padrao de tempo, regra e campo', async () => {
    render(<AlertaForm />);

    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Fecho em breve' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() =>
      expect(repo.saveAlerta).toHaveBeenCalledWith({
        nome: 'Fecho em breve',
        tempoParaAlerta: '00:30:00',
        regra: 'Antes',
        campoReferencia: 'fechoPrevisto',
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/satops/alertas'));
  });

  it('carrega o alerta para edicao', async () => {
    repo.getAlerta.mockResolvedValue({
      id: 'a1',
      nome: 'Abertura atrasada',
      tempoParaAlerta: '00:10:00',
      regra: 'Depois',
      campoReferencia: 'aberturaPrevia',
      dataCadastro: '2026-11-10T12:00:00.000Z',
      usuarioCadastro: 'Ana Silva',
    });
    render(<AlertaForm id="a1" />);

    expect(await screen.findByDisplayValue('Abertura atrasada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('00:10:00')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
  });
});
