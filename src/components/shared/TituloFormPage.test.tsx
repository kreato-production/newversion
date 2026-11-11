import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TituloFormPage } from './TituloFormPage';
import type { TituloFormConfig, TituloFormValues } from './TituloFormPage.types';

const push = vi.fn();
const permissions = vi.hoisted(() => ({
  canIncluir: (..._args: string[]): boolean => true,
  canAlterar: (..._args: string[]): boolean => true,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useParams: () => ({}),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => permissions,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/shared/ColorPicker', () => ({ ColorPicker: () => <div>cor</div> }));
vi.mock('@/components/shared/TraducaoTab', () => ({ TraducaoTab: () => <div>traducao</div> }));

function makeConfig(overrides: Partial<TituloFormConfig> = {}): TituloFormConfig {
  return {
    routes: { basePath: '/financeiro/status-contas-pagar', navStorageKey: 'test_nav' },
    newTitle: 'Novo Status',
    editTitle: 'Editar Status',
    notFoundTitle: 'Status não encontrado',
    entityArticle: 'o status',
    descricaoPlaceholder: '...',
    flags: [
      { key: 'isInicial', label: 'Status inicial', description: 'inicial' },
      { key: 'isBaixa', label: 'Status de baixa', description: 'baixa' },
    ],
    load: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    messages: { created: 'criado', updated: 'atualizado' },
    ...overrides,
  };
}

const STATUS: TituloFormValues = {
  id: 's1',
  codigoExterno: 'AB',
  titulo: 'Em aberto',
  descricao: '',
  cor: '#ff0000',
  traducoes: {},
  flags: { isInicial: true, isBaixa: false },
};

describe('TituloFormPage', () => {
  beforeEach(() => {
    push.mockClear();
    sessionStorage.clear();
  });

  it('cadastra com as flags marcadas e volta para a lista', async () => {
    const config = makeConfig();
    render(<TituloFormPage config={config} />);

    expect(screen.getByRole('heading', { name: 'Novo Status' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'Pago' } });
    fireEvent.click(screen.getByLabelText('Status de baixa'));
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() =>
      expect(config.save).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Pago',
          cor: '#3b82f6',
          flags: { isInicial: false, isBaixa: true },
        }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/financeiro/status-contas-pagar'));
  });

  it('carrega o registro com as flags', async () => {
    const config = makeConfig({ load: vi.fn().mockResolvedValue(STATUS) });
    render(<TituloFormPage config={config} id="s1" />);

    expect(await screen.findByDisplayValue('Em aberto')).toBeInTheDocument();
    expect(config.load).toHaveBeenCalledWith('s1');
    expect(screen.getByLabelText('Status inicial')).toBeChecked();
    expect(screen.getByLabelText('Status de baixa')).not.toBeChecked();
  });

  it('nao mostra flags quando a configuracao nao tem', () => {
    render(<TituloFormPage config={makeConfig({ flags: undefined })} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('mostra registro nao encontrado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const config = makeConfig({
      load: vi.fn().mockRejectedValue(new Error('Registro não encontrado')),
    });
    render(<TituloFormPage config={config} id="x" />);

    expect(await screen.findByText('Status não encontrado')).toBeInTheDocument();
  });

  it('preserva flags ocultas (ex.: isInicial alterado na lista) ao salvar', async () => {
    const config = makeConfig({
      flags: undefined,
      load: vi.fn().mockResolvedValue({ ...STATUS, flags: { isInicial: true } }),
    });
    render(<TituloFormPage config={config} id="s1" />);

    await screen.findByDisplayValue('Em aberto');
    // Edit mode labels the button with t('common.save'); the mock returns the key.
    fireEvent.click(screen.getByRole('button', { name: /common.save/ }));

    await waitFor(() =>
      expect(config.save).toHaveBeenCalledWith(
        expect.objectContaining({ flags: { isInicial: true } }),
      ),
    );
  });

  it('usa os rotulos configurados e exige o codigo quando configurado', () => {
    render(
      <TituloFormPage
        config={makeConfig({ nameLabel: 'Nome', codigoLabel: 'Código', codigoRequired: true })}
      />,
    );
    expect(screen.getByLabelText(/^Nome/)).toBeRequired();
    expect(screen.getByLabelText(/^Código/)).toBeRequired();
  });

  it('oculta cor, descricao e abas quando desativadas', () => {
    render(
      <TituloFormPage
        config={makeConfig({
          flags: undefined,
          showCor: false,
          showDescricao: false,
          showTraducao: false,
        })}
      />,
    );
    expect(screen.queryByText('cor')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Descrição')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('mostra aba extra apenas na edicao quando requiresRecord', async () => {
    const render1 = vi.fn(({ id }: { id: string | undefined }) => (
      <div>classificacoes de {id}</div>
    ));
    const extraTabs = [
      { value: 'extra', label: 'Classificações', requiresRecord: true, render: render1 },
    ];

    const { unmount } = render(<TituloFormPage config={makeConfig({ extraTabs })} />);
    expect(screen.queryByRole('tab', { name: 'Classificações' })).not.toBeInTheDocument();
    unmount();

    render(
      <TituloFormPage
        config={makeConfig({ extraTabs, load: vi.fn().mockResolvedValue(STATUS) })}
        id="s1"
      />,
    );
    expect(await screen.findByRole('tab', { name: 'Classificações' })).toBeInTheDocument();
  });

  it('abre somente leitura sem permissao de alterar', async () => {
    permissions.canAlterar = () => false;
    try {
      const config = makeConfig({
        permission: ['Produção', 'Parametrizações', 'Status'],
        load: vi.fn().mockResolvedValue(STATUS),
      });
      render(<TituloFormPage config={config} id="s1" />);

      expect(await screen.findByDisplayValue('Em aberto')).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Salvar|common.save/ })).not.toBeInTheDocument();
    } finally {
      permissions.canAlterar = () => true;
    }
  });

  it('o Enter no campo envia o formulario mesmo com as abas fora do form', async () => {
    const config = makeConfig({ flags: undefined });
    render(<TituloFormPage config={config} />);

    const titulo = screen.getByLabelText(/Título/);
    fireEvent.change(titulo, { target: { value: 'Novo' } });
    fireEvent.submit(titulo.closest('form') ?? (titulo as HTMLInputElement).form!);

    await waitFor(() => expect(config.save).toHaveBeenCalled());
  });
});
