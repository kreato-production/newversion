import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordFormPage, type RecordFormBodyProps } from './RecordFormPage';

const push = vi.fn();
const toast = vi.fn();
const permissions = vi.hoisted(() => ({ incluir: true, alterar: true }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    canIncluir: () => permissions.incluir,
    canAlterar: () => permissions.alterar,
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => ({ 'common.save': 'Salvar', 'common.back': 'Voltar' })[key] ?? key,
  }),
}));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

type Item = { id: string; nome: string };
type Input = { nome: string };

/** Minimal body: keeps its own state initialized from `data`, like the real ones. */
function Body({ formId, data, readOnly, onSubmit }: RecordFormBodyProps<Item, Input>) {
  const [nome, setNome] = useState(data?.nome ?? '');
  return (
    <form
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({ nome });
      }}
    >
      <label htmlFor="nome">Nome</label>
      <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={readOnly} />
    </form>
  );
}

function renderPage(
  props: { id?: string; load?: () => Promise<Item>; save?: () => Promise<unknown> } = {},
) {
  const load = props.load ?? vi.fn().mockResolvedValue({ id: 'r1', nome: 'Registro' });
  const save = props.save ?? vi.fn().mockResolvedValue(undefined);
  render(
    <RecordFormPage<Item, Input>
      id={props.id}
      routes={{ basePath: '/recursos/itens', navStorageKey: 'test_nav' }}
      permission={['Recursos', 'Itens']}
      newTitle="Novo Item"
      editTitle={(record) => record?.nome ?? 'Editar Item'}
      notFoundTitle="Item não encontrado"
      load={load}
      save={save}
      messages={{ created: 'criado', updated: 'atualizado' }}
    >
      {(bodyProps) => <Body {...bodyProps} />}
    </RecordFormPage>,
  );
  return { load, save };
}

describe('RecordFormPage', () => {
  beforeEach(() => {
    push.mockClear();
    toast.mockClear();
    permissions.incluir = true;
    permissions.alterar = true;
    sessionStorage.clear();
  });

  it('inclui: nao carrega, salva e volta para a lista', async () => {
    const { load, save } = renderPage();

    expect(screen.getByRole('heading', { name: 'Novo Item' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Novo' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() => expect(save).toHaveBeenCalledWith({ nome: 'Novo' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/recursos/itens'));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'criado' }));
    expect(load).not.toHaveBeenCalled();
  });

  it('edita: monta o corpo apenas depois de carregar o registro', async () => {
    const { load } = renderPage({ id: 'r1' });

    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Nome')).toHaveValue('Registro');
    expect(load).toHaveBeenCalledWith('r1');
    expect(screen.getByRole('heading', { name: 'Registro' })).toBeInTheDocument();
  });

  it('mantem a pagina aberta e avisa quando o salvamento falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const save = vi.fn().mockRejectedValue(new Error('falhou'));
    renderPage({ save });

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive', description: 'Erro ao salvar: falhou' }),
      ),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('somente leitura sem permissao de alterar: campos desabilitados e sem salvar', async () => {
    permissions.alterar = false;
    const { save } = renderPage({ id: 'r1' });

    expect(await screen.findByLabelText('Nome')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Salvar/ })).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it('mostra nao encontrado quando o registro nao carrega', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderPage({ id: 'x', load: vi.fn().mockRejectedValue(new Error('404')) });

    expect(await screen.findByText('Item não encontrado')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
  });
});
