import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PessoaForm from './PessoaForm';
import { usePermissions } from '@/hooks/usePermissions';
import { pessoasRepository } from '@/modules/pessoas/pessoas.repository.provider';
import type { Pessoa } from '@/modules/pessoas/pessoas.types';

const push = vi.fn();
const replace = vi.fn();
const toast = vi.hoisted(() => vi.fn());
// Field configuration of the "pessoa" form (Administração > Formulários).
const fieldConfig = vi.hoisted(() => ({
  campos: {} as Record<
    string,
    {
      tipoValidacao: string | null;
      tamanho: string | null;
      posicao: number | null;
      traducoes?: Record<string, string> | null;
    }
  >,
}));
// System language (LanguageContext).
const lang = vi.hoisted(() => ({ language: 'pt' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));
vi.mock('@/hooks/usePermissions');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));
vi.mock('@/modules/admin/admin-config.api', () => ({
  ApiAdminConfigRepository: class {
    getFormularioCamposFull = () => Promise.resolve(fieldConfig.campos);
  },
}));

const NOME = /^Nome\*?$/;
const SOBRENOME = /^Sobrenome\*?$/;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { tenantId: 'tenant-1' } }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: lang.language }),
}));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));
vi.mock('@/components/shared/SearchableSelect', () => ({
  SearchableSelect: () => <div>select</div>,
}));
vi.mock('@/components/recursos/PessoaGravacoesTab', () => ({
  PessoaGravacoesTab: () => <div>gravacoes</div>,
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/modules/pessoas/pessoas.repository.provider', () => ({
  pessoasRepository: {
    getById: vi.fn(),
    listOptions: vi.fn().mockResolvedValue({ classificacoes: [], tags: [] }),
    save: vi.fn().mockResolvedValue(undefined),
  },
}));

const PESSOA: Pessoa = {
  id: 'p1',
  codigoExterno: '',
  nome: 'Maria',
  sobrenome: 'Souza',
  nomeTrabalho: '',
  foto: '',
  dataNascimento: '',
  sexo: '',
  telefone: '',
  email: 'maria@kreato.app',
  classificacao: '',
  classificacaoId: '',
  documento: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  observacoes: '',
  paisNascimento: '',
  idiomaNativo: '',
  tags: [],
  status: 'Ativo',
} as Pessoa;

function mockPermissions({ incluir = true, alterar = true } = {}) {
  vi.mocked(usePermissions).mockReturnValue({
    canIncluir: () => incluir,
    canAlterar: () => alterar,
  } as unknown as ReturnType<typeof usePermissions>);
}

describe('PessoaForm', () => {
  beforeEach(() => {
    push.mockClear();
    vi.mocked(pessoasRepository.getById).mockReset();
    vi.mocked(pessoasRepository.save).mockClear();
    toast.mockClear();
    fieldConfig.campos = {};
    lang.language = 'pt';
    sessionStorage.clear();
  });

  it('cadastra uma nova pessoa e volta para a lista', async () => {
    mockPermissions();
    render(<PessoaForm />);

    fireEvent.change(screen.getByLabelText(NOME), { target: { value: 'Joao' } });
    fireEvent.change(screen.getByLabelText(SOBRENOME), { target: { value: 'Lima' } });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/ }));

    await waitFor(() => expect(pessoasRepository.save).toHaveBeenCalled());
    expect(pessoasRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Joao', sobrenome: 'Lima', tenantId: 'tenant-1' }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/recursos/pessoas'));
    expect(pessoasRepository.getById).not.toHaveBeenCalled();
  });

  it('aplica os campos obrigatorios configurados no formulario', async () => {
    mockPermissions();
    fieldConfig.campos = {
      nome: { tipoValidacao: 'obrigatorio', tamanho: null, posicao: null },
      documento: { tipoValidacao: 'obrigatorio', tamanho: null, posicao: null },
      email: { tipoValidacao: 'sugerido', tamanho: null, posicao: null },
    };
    render(<PessoaForm />);

    // The configured required field gets the asterisk once the configuration loads.
    expect(await screen.findByLabelText('CPF/Documento*')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(NOME), { target: { value: 'Joao' } });
    fireEvent.change(screen.getByLabelText(SOBRENOME), { target: { value: 'Lima' } });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/ }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Campos obrigatórios',
          description: 'Preencha os campos obrigatórios: CPF/Documento',
        }),
      ),
    );
    expect(pessoasRepository.save).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('CPF/Documento*'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/ }));
    await waitFor(() =>
      expect(pessoasRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Joao', documento: '123' }),
      ),
    );
  });

  it('aplica o tamanho e a posição publicados em Formulários (a mesma grade do preview)', async () => {
    mockPermissions();
    fieldConfig.campos = {
      tags: { tipoValidacao: null, tamanho: '1/3', posicao: 1 },
    };
    render(<PessoaForm />);

    const field = (campo: string) =>
      document.querySelector(`[data-campo="${campo}"]`) as HTMLElement;
    await waitFor(() => expect(field('tags').style.order).toBe('1'));
    expect(field('tags').style.getPropertyValue('--field-span')).toBe('4');
    // Sem configuração: o padrão do formsRegistry (Nome em 1/3, Endereço na linha toda).
    expect(field('nome').style.getPropertyValue('--field-span')).toBe('4');
    expect(field('nome').style.order).toBe('3');
    expect(field('endereco').style.getPropertyValue('--field-span')).toBe('12');
    expect(field('tags').parentElement).toHaveClass('configurable-field-grid');
  });

  it('mostra o nome do campo traduzido no idioma do sistema; sem tradução, o padrão', async () => {
    mockPermissions();
    lang.language = 'en';
    fieldConfig.campos = {
      nome: { tipoValidacao: null, tamanho: null, posicao: null, traducoes: { en: 'First name' } },
      sobrenome: {
        tipoValidacao: null,
        tamanho: null,
        posicao: null,
        traducoes: { es: 'Apellido' },
      },
      documento: {
        tipoValidacao: 'obrigatorio',
        tamanho: null,
        posicao: null,
        traducoes: { en: 'ID document' },
      },
    };
    render(<PessoaForm />);

    expect(await screen.findByLabelText('First name*')).toBeInTheDocument();
    // Sobrenome só tem tradução em espanhol: em inglês fica o padrão.
    fireEvent.change(screen.getByLabelText(SOBRENOME), { target: { value: 'Lima' } });
    fireEvent.change(screen.getByLabelText('First name*'), { target: { value: 'Joao' } });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/ }));
    // A mensagem de obrigatório usa o nome traduzido.
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Preencha os campos obrigatórios: ID document' }),
      ),
    );
    expect(pessoasRepository.save).not.toHaveBeenCalled();
  });

  it('salva as tags informadas', async () => {
    mockPermissions();
    render(<PessoaForm />);

    fireEvent.change(screen.getByLabelText(NOME), { target: { value: 'Joao' } });
    fireEvent.change(screen.getByLabelText(SOBRENOME), { target: { value: 'Lima' } });
    const tags = screen.getByLabelText('Tags');
    fireEvent.change(tags, { target: { value: 'Bilíngue' } });
    fireEvent.keyDown(tags, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/ }));

    await waitFor(() =>
      expect(pessoasRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['Bilíngue'] }),
      ),
    );
  });

  it('carrega a pessoa na edicao', async () => {
    mockPermissions();
    vi.mocked(pessoasRepository.getById).mockResolvedValue(PESSOA);
    render(<PessoaForm pessoaId="p1" />);

    expect(await screen.findByDisplayValue('Maria')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Maria Souza' })).toBeInTheDocument();
    expect(pessoasRepository.getById).toHaveBeenCalledWith('p1');
  });

  it('abre somente leitura sem permissao de alterar', async () => {
    mockPermissions({ alterar: false });
    vi.mocked(pessoasRepository.getById).mockResolvedValue(PESSOA);
    render(<PessoaForm pessoaId="p1" />);

    expect(await screen.findByDisplayValue('Maria')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Salvar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('mostra pessoa nao encontrada', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockPermissions();
    vi.mocked(pessoasRepository.getById).mockRejectedValue(new Error('Pessoa não encontrada'));
    render(<PessoaForm pessoaId="x" />);

    // Title ("Pessoa não encontrada") and the API message happen to be the same text here.
    expect(await screen.findAllByText('Pessoa não encontrada')).toHaveLength(2);
    expect(screen.queryByLabelText(NOME)).not.toBeInTheDocument();
  });

  it('oferece anterior/proximo quando aberta a partir da lista', async () => {
    mockPermissions();
    sessionStorage.setItem('kreato_pessoas_nav_ids', JSON.stringify(['p0', 'p1', 'p2']));
    vi.mocked(pessoasRepository.getById).mockResolvedValue(PESSOA);
    render(<PessoaForm pessoaId="p1" />);

    expect(await screen.findByText('2 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Próximo registro'));
    expect(replace).toHaveBeenCalledWith('/recursos/pessoas/p2');
  });
});
