import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ParametroFormRoute } from './ParametroFormPage';
import { usePermissions } from '@/hooks/usePermissions';
import { PARAMETROS } from '@/modules/parametros/parametros.config';
import type { ParametroApiItem } from '@/modules/parametros/parametros.api.repository';

const push = vi.fn();
const navigation = vi.hoisted(() => ({
  pathname: '/recursos/cargos/novo',
  params: {} as { id?: string },
}));
const repo = vi.hoisted(() => ({
  getById: vi.fn(),
  save: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => navigation.pathname,
  useParams: () => navigation.params,
}));
vi.mock('@/modules/parametros/parametros.api.repository', () => ({
  ApiParametrosRepository: class {
    getById = repo.getById;
    save = repo.save;
  },
}));
const fieldConfigs = vi.hoisted(() => ({
  getFormularioCamposFull: vi.fn(),
}));
vi.mock('@/modules/admin/admin-config.api', () => ({
  ApiAdminConfigRepository: class {
    getFormularioCamposFull = fieldConfigs.getFormularioCamposFull;
  },
}));
vi.mock('@/hooks/usePermissions');
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) =>
      (
        ({
          'common.new': 'Novo',
          'common.edit': 'Editar',
          'common.save': 'Salvar',
          'common.updated': 'Atualizado',
          'common.name': 'Nome',
          'common.description': 'Descrição',
          'common.externalCode': 'Código Externo',
          'common.cancel': 'Cancelar',
          'common.back': 'Voltar',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/shared/ColorPicker', () => ({
  ColorPicker: () => <div>color-picker</div>,
}));
vi.mock('@/components/shared/TraducaoTab', () => ({
  TraducaoTab: () => <div>traducao</div>,
}));

const CARGO: ParametroApiItem = {
  id: 'c1',
  codigo_externo: 'C1',
  nome: 'Produtor',
  descricao: 'Produtor executivo',
  cor: null,
  traducoes: null,
  created_at: '2026-11-10T12:00:00.000Z',
  created_by: 'u1',
};

function mockPermissions({ incluir = true, alterar = true } = {}) {
  vi.mocked(usePermissions).mockReturnValue({
    canIncluir: () => incluir,
    canAlterar: () => alterar,
  } as unknown as ReturnType<typeof usePermissions>);
}

function at(pathname: string, id?: string) {
  navigation.pathname = pathname;
  navigation.params = id ? { id } : {};
}

describe('ParametroFormPage', () => {
  beforeEach(() => {
    push.mockClear();
    repo.getById.mockReset();
    repo.save.mockReset().mockResolvedValue(CARGO);
    sessionStorage.clear();
    mockPermissions();
    fieldConfigs.getFormularioCamposFull.mockReset().mockResolvedValue({});
  });

  it('cadastra um novo parametro no storageKey da configuracao', async () => {
    at('/recursos/cargos/novo');
    render(<ParametroFormRoute config={PARAMETROS.cargos} />);

    expect(screen.getByRole('heading', { name: 'Novo Cargo' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Editor' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() =>
      expect(repo.save).toHaveBeenCalledWith(
        'kreato_cargos',
        expect.objectContaining({ id: undefined, nome: 'Editor' }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/recursos/cargos'));
    expect(repo.getById).not.toHaveBeenCalled();
  });

  it('carrega o registro na edicao', async () => {
    at('/recursos/cargos/c1', 'c1');
    repo.getById.mockResolvedValue(CARGO);
    render(<ParametroFormRoute config={PARAMETROS.cargos} />);

    expect(await screen.findByDisplayValue('Produtor')).toBeInTheDocument();
    expect(repo.getById).toHaveBeenCalledWith('kreato_cargos', 'c1');
    expect(screen.getByRole('heading', { name: 'Produtor' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('C1')).toBeInTheDocument();
  });

  it('volta para a lista do menu de origem (Servicos em Eventos)', async () => {
    at('/eventos/parametrizacoes/servicos/s1', 's1');
    repo.getById.mockResolvedValue({ ...CARGO, id: 's1', nome: 'Catering' });
    render(<ParametroFormRoute config={PARAMETROS.servicos} />);

    await screen.findByDisplayValue('Catering');
    fireEvent.click(screen.getByRole('button', { name: /Voltar/ }));
    expect(push).toHaveBeenCalledWith('/eventos/parametrizacoes/servicos');
  });

  it('abre somente leitura sem permissao de alterar', async () => {
    mockPermissions({ alterar: false });
    at('/recursos/cargos/c1', 'c1');
    repo.getById.mockResolvedValue(CARGO);
    render(<ParametroFormRoute config={PARAMETROS.cargos} />);

    expect(await screen.findByDisplayValue('Produtor')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Salvar/ })).not.toBeInTheDocument();
  });

  it('mostra o seletor de cor apenas quando configurado', () => {
    at('/producao/classificacao/novo');
    const { unmount } = render(<ParametroFormRoute config={PARAMETROS.classificacao} />);
    expect(screen.getByText('color-picker')).toBeInTheDocument();
    unmount();

    at('/recursos/cargos/novo');
    render(<ParametroFormRoute config={PARAMETROS.cargos} />);
    expect(screen.queryByText('color-picker')).not.toBeInTheDocument();
  });

  it('aplica a configuração do módulo Formulários (obrigatório, rótulo e posição)', async () => {
    fieldConfigs.getFormularioCamposFull.mockResolvedValue({
      descricao: { tipoValidacao: 'obrigatorio', tamanho: '2', posicao: 1, traducoes: null },
    });
    at('/recursos/cargos/novo');
    render(<ParametroFormRoute config={PARAMETROS.cargos} />);

    await waitFor(() => expect(fieldConfigs.getFormularioCamposFull).toHaveBeenCalledWith('cargo'));
    const descricao = await waitFor(() => {
      const cell = document.querySelector('[data-campo="descricao"]') as HTMLElement;
      expect(cell.style.order).toBe('1');
      return cell;
    });
    expect(descricao.querySelector('.text-destructive')).not.toBeNull();

    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Editor' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(repo.save).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/common.description|Descrição/), {
      target: { value: 'Editor de imagem' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));
    await waitFor(() => expect(repo.save).toHaveBeenCalled());
  });
});
