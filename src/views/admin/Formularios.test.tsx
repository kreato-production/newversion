/**
 * Formulários (configuração de campos): a modal virou a página `/admin/formularios/[id]`.
 * Carga e gravação por tenant, formulário inexistente, GLOBAL_ADMIN sem tenant e a lista.
 */
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import FormularioForm from './FormularioForm';
import Formularios from './Formularios';
import { saveFormulariosTenant } from '@/modules/admin/formularios.navigation';
import { formsRegistry, tamanhoToSpan } from '@/data/formsRegistry';
import {
  changedCampos,
  defaultRows,
  computeFormLayout,
  moveCampo,
  resizeCampo,
  snapSpan,
  stepSpan,
  type FormularioCampoRow,
} from '@/components/admin/formularioLayout';

const openPreview = () => fireEvent.mouseDown(screen.getByRole('tab', { name: /Preview/ }));
const publishButton = () => screen.getByRole('button', { name: /Publicar alterações/ });

const push = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => vi.fn());
const toastApi = vi.hoisted(() => ({ toast }));
const translate = vi.hoisted(() => (key: string) => key);
const router = vi.hoisted(() => ({ push, replace: vi.fn() }));
const auth = vi.hoisted(() => ({
  user: { id: 'u1', role: 'TENANT_ADMIN' as string, tenantId: 't1' as string | null },
}));
const permissions = vi.hoisted(() => ({ enabledModules: new Set(['Produção']), alterar: true }));
const adminConfig = vi.hoisted(() => ({
  getFormularioCamposFull: vi.fn(),
  saveFormularioCamposFull: vi.fn(),
  getFormularioLista: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
beforeEach(() => {
  adminConfig.getFormularioLista.mockReset().mockResolvedValue({ zebrado: false, corZebra: null });
});
vi.mock('@/hooks/use-toast', () => ({ useToast: () => toastApi }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    enabledModules: permissions.enabledModules,
    canIncluir: () => true,
    canAlterar: () => permissions.alterar,
  }),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: translate }),
  languageLabels: {
    pt: { name: 'Português', flag: 'PT' },
    en: { name: 'English', flag: 'US' },
    es: { name: 'Español', flag: 'ES' },
  },
}));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div>
      {title}: {description}
    </div>
  ),
  SearchBar: (): null => null,
  DataCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/modules/admin/admin-config.api', () => ({
  ApiAdminConfigRepository: class {
    getFormularioCamposFull = adminConfig.getFormularioCamposFull;
    saveFormularioCamposFull = adminConfig.saveFormularioCamposFull;
    getFormularioLista = adminConfig.getFormularioLista;
  },
}));
vi.mock('@/modules/tenants/tenants.api.repository', () => ({
  ApiTenantsRepository: class {
    list = vi.fn().mockResolvedValue([]);
  },
}));

describe('FormularioForm (página de configuração)', () => {
  beforeEach(() => {
    push.mockClear();
    toast.mockClear();
    sessionStorage.clear();
    auth.user = { id: 'u1', role: 'TENANT_ADMIN', tenantId: 't1' };
    adminConfig.getFormularioCamposFull.mockReset().mockResolvedValue({
      nome: { campo: 'nome', tipoValidacao: 'obrigatorio', tamanho: '2', posicao: 1 },
    });
    adminConfig.saveFormularioCamposFull.mockReset().mockResolvedValue(undefined);
  });

  it('carrega os campos, publica as alterações pelo Preview e continua na página', async () => {
    render(<FormularioForm id="programa" />);

    expect(await screen.findByRole('heading', { name: 'Programa' })).toBeInTheDocument();
    expect(adminConfig.getFormularioCamposFull).toHaveBeenCalledWith('programa', undefined);
    // Todas as posições aparecem preenchidas. Nome (1) empata com Código Externo (1 por padrão,
    // vem antes no formulário): fica em 2º, como no formulário do módulo.
    expect(screen.getByLabelText('Posição de Código Externo')).toHaveValue(1);
    expect(screen.getByLabelText('Posição de Nome')).toHaveValue(2);
    expect(screen.getByLabelText('Posição de Descrição')).toHaveValue(5);
    // Grava só pelo Publicar: sem o Salvar da barra da página.
    expect(screen.queryByRole('button', { name: 'common.save' })).not.toBeInTheDocument();

    openPreview();
    expect(publishButton()).toBeDisabled();

    fireEvent.mouseDown(screen.getByRole('tab', { name: /Campos/ }));
    // Digitar a posição move o campo: Descrição vai para 4º e Unidade de Negócio desce para 5º.
    const descricao = screen.getByLabelText('Posição de Descrição');
    fireEvent.change(descricao, { target: { value: '4' } });
    fireEvent.blur(descricao);
    expect(screen.getByLabelText('Posição de Unidade de Negócio')).toHaveValue(5);
    expect(screen.getByText(/2 campos alterados/)).toBeInTheDocument();

    openPreview();
    expect(publishButton()).toBeEnabled();
    fireEvent.click(publishButton());

    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalledTimes(1));
    const [formId, campos, tenantId] = adminConfig.saveFormularioCamposFull.mock.calls[0];
    expect(formId).toBe('programa');
    expect(tenantId).toBeUndefined();
    expect(campos).toContainEqual({
      campo: 'nome',
      tipoValidacao: 'obrigatorio',
      tamanho: '2',
      posicao: 2,
      traducoes: null,
    });
    expect(campos).toContainEqual({
      campo: 'descricao',
      tipoValidacao: null,
      tamanho: null,
      posicao: 4,
      traducoes: null,
    });
    await waitFor(() => expect(publishButton()).toBeDisabled());
    expect(push).not.toHaveBeenCalled();
    expect(toast.mock.calls.at(-1)?.[0]).toMatchObject({
      description: 'Alterações publicadas no formulário do módulo.',
    });
  });

  it('volta ao padrão só depois de confirmar, e o padrão precisa ser publicado', async () => {
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });
    openPreview();

    fireEvent.click(screen.getByRole('button', { name: /Voltar ao padrão/ }));
    expect(await screen.findByText('Voltar à configuração padrão?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(screen.queryByText('Voltar à configuração padrão?')).not.toBeInTheDocument(),
    );
    expect(publishButton()).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Voltar ao padrão/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Voltar ao padrão' }));
    await waitFor(() => expect(publishButton()).toBeEnabled());
    expect(adminConfig.saveFormularioCamposFull).not.toHaveBeenCalled();

    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    const campos = adminConfig.saveFormularioCamposFull.mock.calls[0][1] as Array<{
      tipoValidacao: unknown;
      tamanho: unknown;
      posicao: unknown;
    }>;
    // Padrão: sem validação, tamanho padrão e a ordem original do formulário (1..n).
    expect(campos.every((c) => !c.tipoValidacao && c.tamanho === null)).toBe(true);
    expect(campos.map((c) => c.posicao)).toEqual([1, 2, 3, 4, 5]);
  });

  it('o preview posiciona cada campo pelo tamanho e pela posição configurados', async () => {
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });
    openPreview();

    // Configurado: Nome na posição 1 com 2 colunas. Código Externo tem posição padrão 1 e vem
    // antes no formulário (empate); Cor (4 colunas) não cabe no resto da linha 1.
    const cell = (campo: string) =>
      document.querySelector(`[data-campo="${campo}"]`) as HTMLElement;
    expect(cell('codigoExterno').dataset).toMatchObject({ linha: '1', coluna: '1', colunas: '3' });
    expect(cell('nome').dataset).toMatchObject({ linha: '1', coluna: '4', colunas: '6' });
    expect(cell('cor').dataset).toMatchObject({ linha: '2', coluna: '1', colunas: '12' });
    expect(screen.getByText('25%')).toBeInTheDocument(); // régua: marca de 1/4
    expect(screen.getByText('L4')).toBeInTheDocument();
  });

  it('mostra "não disponível" para um formulário inexistente ou de módulo desabilitado', async () => {
    render(<FormularioForm id="nao-existe" />);
    expect(await screen.findByText(/Formulário não disponível/)).toBeInTheDocument();
    expect(adminConfig.getFormularioCamposFull).not.toHaveBeenCalled();
  });

  it('GLOBAL_ADMIN configura o tenant escolhido na lista', async () => {
    auth.user = { id: 'g1', role: 'GLOBAL_ADMIN', tenantId: null };
    saveFormulariosTenant({ id: 't9', nome: 'Alcanena' });
    render(<FormularioForm id="programa" />);

    expect(await screen.findByText(/tenant Alcanena/)).toBeInTheDocument();
    expect(adminConfig.getFormularioCamposFull).toHaveBeenCalledWith('programa', 't9');

    fireEvent.change(screen.getByLabelText('Posição de Cor'), { target: { value: '9' } });
    fireEvent.blur(screen.getByLabelText('Posição de Cor'));
    openPreview();
    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    expect(adminConfig.saveFormularioCamposFull.mock.calls[0][2]).toBe('t9');
  });

  it('GLOBAL_ADMIN sem tenant escolhido não carrega nem grava', async () => {
    auth.user = { id: 'g1', role: 'GLOBAL_ADMIN', tenantId: null };
    render(<FormularioForm id="programa" />);

    expect(await screen.findByText(/Selecione um tenant/)).toBeInTheDocument();
    expect(adminConfig.getFormularioCamposFull).not.toHaveBeenCalled();
  });
});

describe('Formularios (lista)', () => {
  beforeEach(() => {
    push.mockClear();
    sessionStorage.clear();
    auth.user = { id: 'u1', role: 'TENANT_ADMIN', tenantId: 't1' };
  });

  it('abre a página do formulário em vez da modal, guardando a ordem da lista', () => {
    render(<Formularios />);
    fireEvent.click(screen.getAllByRole('button', { name: /Configurar/ })[0]);

    expect(push).toHaveBeenCalledWith('/admin/formularios/programa');
    const ids = JSON.parse(sessionStorage.getItem('kreato_formularios_nav') ?? '[]') as string[];
    expect(ids[0]).toBe('programa');
    expect(ids.length).toBeGreaterThan(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('computeFormLayout', () => {
  const programa = formsRegistry.find((form) => form.id === 'programa')!;
  const rows = programa.campos.map(
    (field): FormularioCampoRow => ({
      campo: field.campo,
      label: field.label,
      tipoValidacao: null,
      tamanho: null,
      posicao: null,
      traducoes: null,
    }),
  );

  it('sem configuração segue o padrão do formulário de Programa', () => {
    const layout = computeFormLayout(programa, rows);
    expect(layout.cells.map((c) => [c.campo, c.row, c.colStart, c.cols])).toEqual([
      ['codigoExterno', 0, 0, 3],
      ['nome', 0, 3, 6],
      ['cor', 1, 0, 12],
      ['unidadeNegocio', 2, 0, 12],
      ['descricao', 3, 0, 12],
    ]);
    expect(layout.rowCount).toBe(4);
  });

  it('quebra a linha quando o campo não cabe no espaço que sobra', () => {
    const custom = rows.map((row) =>
      row.campo === 'cor'
        ? { ...row, tamanho: '1' }
        : row.campo === 'unidadeNegocio'
          ? { ...row, tamanho: '2', posicao: 1 }
          : row,
    );
    const layout = computeFormLayout(programa, custom);
    // codigoExterno (3 col) + unidadeNegocio (6) na linha 1; nome (6) não cabe nas 3 que sobram.
    expect(layout.cells.map((c) => [c.campo, c.row, c.colStart])).toEqual([
      ['codigoExterno', 0, 0],
      ['unidadeNegocio', 0, 3],
      ['nome', 1, 0],
      ['cor', 1, 6],
      ['descricao', 2, 0],
    ]);
  });

  it('sem configuração, Pessoa fica como o formulário do módulo (linhas em metades, terços e quartos)', () => {
    const pessoa = formsRegistry.find((form) => form.id === 'pessoa')!;
    const empty = pessoa.campos.map(
      (field): FormularioCampoRow => ({
        campo: field.campo,
        label: field.label,
        tipoValidacao: null,
        tamanho: null,
        posicao: null,
        traducoes: null,
      }),
    );
    const layout = computeFormLayout(pessoa, empty);
    const linhas = Array.from({ length: layout.rowCount }, (_, row) =>
      layout.cells.filter((c) => c.row === row).map((c) => `${c.campo}:${c.cols}`),
    );
    expect(linhas).toEqual([
      ['codigoExterno:6', 'classificacao:6'],
      ['nome:4', 'sobrenome:4', 'nomeTrabalho:4'],
      ['dataNascimento:4', 'sexo:4', 'documento:4'],
      ['paisNascimento:6', 'idiomaNativo:6'],
      ['email:6', 'telefone:6'],
      ['endereco:12'],
      ['cidade:6', 'estado:3', 'cep:3'],
      ['status:3'],
      ['tags:12'],
      ['observacoes:12'],
    ]);
  });
});

describe('Preview: arrastar e redimensionar', () => {
  // jsdom has no DragEvent / PointerEvent: without them clientX does not reach the handlers.
  beforeAll(() => {
    class TestPointerEvent extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
      }
    }
    class TestDragEvent extends MouseEvent {
      dataTransfer: DataTransfer | null;
      constructor(type: string, init: DragEventInit = {}) {
        super(type, init);
        this.dataTransfer = init.dataTransfer ?? null;
      }
    }
    const w = window as unknown as Record<string, unknown>;
    w.PointerEvent ??= TestPointerEvent;
    w.DragEvent ??= TestDragEvent;
  });

  const cell = (campo: string) => document.querySelector(`[data-campo="${campo}"]`) as HTMLElement;
  const dataTransfer = () => {
    const store: Record<string, string> = {};
    return {
      effectAllowed: '',
      dropEffect: '',
      setData: (type: string, value: string) => {
        store[type] = value;
      },
      getData: (type: string) => store[type] ?? '',
    };
  };
  const rect = (left: number, width: number) =>
    ({
      left,
      width,
      top: 0,
      height: 80,
      right: left + width,
      bottom: 80,
      x: left,
      y: 0,
    }) as DOMRect;
  const openCampos = () => fireEvent.mouseDown(screen.getByRole('tab', { name: /Campos/ }));

  beforeEach(() => {
    push.mockClear();
    sessionStorage.clear();
    auth.user = { id: 'u1', role: 'TENANT_ADMIN', tenantId: 't1' };
    adminConfig.getFormularioCamposFull.mockReset().mockResolvedValue({});
    adminConfig.saveFormularioCamposFull.mockReset().mockResolvedValue(undefined);
  });

  async function renderPreview() {
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });
    openPreview();
  }

  it('arrastar um campo para antes de outro muda a posição, refletida em Campos e publicada', async () => {
    await renderPreview();
    // Ordem padrão: codigoExterno, nome, cor, unidadeNegocio, descricao.
    const dt = dataTransfer();
    vi.spyOn(cell('codigoExterno'), 'getBoundingClientRect').mockReturnValue(rect(0, 100));
    fireEvent.dragStart(cell('descricao'), { dataTransfer: dt });
    fireEvent.dragOver(cell('codigoExterno'), { dataTransfer: dt, clientX: 10 });
    fireEvent.drop(cell('codigoExterno'), { dataTransfer: dt, clientX: 10 });

    expect(cell('descricao').dataset).toMatchObject({ linha: '1', coluna: '1' });
    expect(cell('codigoExterno').dataset).toMatchObject({ linha: '2', coluna: '1' });

    openCampos();
    expect(screen.getByLabelText('Posição de Descrição')).toHaveValue(1);
    expect(screen.getByLabelText('Posição de Código Externo')).toHaveValue(2);
    expect(screen.getByLabelText('Posição de Unidade de Negócio')).toHaveValue(5);

    openPreview();
    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    const campos = adminConfig.saveFormularioCamposFull.mock.calls[0][1] as Array<{
      campo: string;
      posicao: number | null;
    }>;
    expect(campos.map((c) => [c.campo, c.posicao])).toEqual([
      ['codigoExterno', 2],
      ['nome', 3],
      ['cor', 4],
      ['unidadeNegocio', 5],
      ['descricao', 1],
    ]);
  });

  it('depois de arrastar, a coluna Posição mostra a ordem de todos os campos e publica todas', async () => {
    await renderPreview();
    const dt = dataTransfer();
    vi.spyOn(cell('nome'), 'getBoundingClientRect').mockReturnValue(rect(0, 100));
    fireEvent.dragStart(cell('cor'), { dataTransfer: dt });
    fireEvent.dragOver(cell('nome'), { dataTransfer: dt, clientX: 10 });
    fireEvent.drop(cell('nome'), { dataTransfer: dt, clientX: 10 });

    openCampos();
    expect(screen.getByLabelText('Posição de Código Externo')).toHaveValue(1);
    expect(screen.getByLabelText('Posição de Cor')).toHaveValue(2);
    expect(screen.getByLabelText('Posição de Nome')).toHaveValue(3);
    expect(screen.getByLabelText('Posição de Descrição')).toHaveValue(5);

    openPreview();
    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    const campos = adminConfig.saveFormularioCamposFull.mock.calls[0][1] as Array<{
      campo: string;
      posicao: number | null;
    }>;
    expect(campos.map((c) => c.posicao)).toEqual([1, 3, 2, 4, 5]);
    await waitFor(() => expect(publishButton()).toBeDisabled());
    openCampos();
    expect(screen.getByLabelText('Posição de Cor')).toHaveValue(2);
  });

  it('soltar numa área vazia leva o campo para o fim', async () => {
    await renderPreview();
    const dt = dataTransfer();
    fireEvent.dragStart(cell('codigoExterno'), { dataTransfer: dt });
    fireEvent.drop(screen.getByRole('list', { name: 'Preview do formulário' }), {
      dataTransfer: dt,
    });
    expect(cell('codigoExterno').dataset.linha).toBe('5');
  });

  it('a alça redimensiona com o mouse, encaixando no tamanho permitido mais próximo', async () => {
    await renderPreview();
    // Grade de 896px: 12 colunas de 60px + 11 espaços de 16px.
    vi.spyOn(
      screen.getByRole('list', { name: 'Preview do formulário' }),
      'getBoundingClientRect',
    ).mockReturnValue(rect(0, 896));
    const handle = screen.getByRole('separator', { name: 'Redimensionar Código Externo' });

    // 3 colunas (25%) + 76px (uma coluna e um espaço) = 4 colunas (33%).
    fireEvent.pointerDown(handle, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 276, pointerId: 1 });
    expect(cell('codigoExterno').dataset.colunas).toBe('4');
    fireEvent.pointerUp(handle, { clientX: 276, pointerId: 1 });
    expect(cell('codigoExterno').dataset.colunas).toBe('4');

    openCampos();
    expect(screen.getByLabelText('Tamanho de Código Externo')).toHaveTextContent('33% (1/3)');
    openPreview();
    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    expect(adminConfig.saveFormularioCamposFull.mock.calls[0][1][0]).toMatchObject({
      campo: 'codigoExterno',
      tamanho: '1/3',
      posicao: 1,
    });
  });

  it('só redimensionar também publica a posição de todos os campos', async () => {
    adminConfig.getFormularioCamposFull.mockResolvedValue({});
    await renderPreview();
    fireEvent.keyDown(cell('codigoExterno'), { key: 'ArrowRight', shiftKey: true });
    openCampos();
    expect(screen.getByLabelText('Posição de Descrição')).toHaveValue(5);
    openPreview();
    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    const campos = adminConfig.saveFormularioCamposFull.mock.calls[0][1] as Array<{
      posicao: number | null;
    }>;
    expect(campos.map((c) => c.posicao)).toEqual([1, 2, 3, 4, 5]);
  });

  it('pelo teclado: setas movem e Shift + seta redimensiona o campo em foco', async () => {
    await renderPreview();
    fireEvent.keyDown(cell('nome'), { key: 'ArrowLeft' });
    expect(cell('nome').dataset.coluna).toBe('1');
    await waitFor(() => expect(cell('nome')).toHaveFocus());

    fireEvent.keyDown(cell('codigoExterno'), { key: 'ArrowRight', shiftKey: true });
    expect(cell('codigoExterno').dataset.colunas).toBe('4');
  });

  it('sem edição: só visualiza (sem arrastar nem alça)', async () => {
    adminConfig.saveFormularioCamposFull.mockReturnValue(new Promise(() => {}));
    await renderPreview();
    fireEvent.keyDown(cell('nome'), { key: 'ArrowLeft' });
    fireEvent.click(publishButton());
    // Durante a publicação o preview fica somente leitura.
    await waitFor(() => expect(cell('nome')).toHaveAttribute('draggable', 'false'));
    expect(screen.queryByRole('separator', { name: /Redimensionar/ })).not.toBeInTheDocument();
  });
});

describe('mover / redimensionar (funções)', () => {
  const programa = formsRegistry.find((form) => form.id === 'programa')!;
  const rows = programa.campos.map(
    (field): FormularioCampoRow => ({
      campo: field.campo,
      label: field.label,
      tipoValidacao: null,
      tamanho: null,
      posicao: null,
      traducoes: null,
    }),
  );

  it('encaixa nos tamanhos permitidos (25, 33, 50, 67, 75, 100%)', () => {
    expect([1, 3, 5, 7, 10, 11, 20].map(snapSpan)).toEqual([3, 3, 6, 8, 9, 12, 12]);
    expect(stepSpan(3, 1)).toBe(4);
    expect(stepSpan(12, 1)).toBe(12);
    expect(stepSpan(3, -1)).toBe(3);
  });

  it('o tamanho igual ao padrão fica em branco ("Padrão")', () => {
    expect(resizeCampo(programa, rows, 'nome', 8)[1].tamanho).toBe('2/3');
    expect(resizeCampo(programa, rows, 'nome', 6)[1].tamanho).toBeNull();
  });

  it('mover grava a posição de todos os campos; voltar à ordem padrão não é alteração', () => {
    const moved = moveCampo(programa, rows, 'cor', 1);
    expect(moved.map((r) => r.posicao)).toEqual([1, 3, 2, 4, 5]);
    expect([...changedCampos(programa, moved, rows)]).toEqual(['nome', 'cor']);
    const back = moveCampo(programa, moved, 'cor', 2);
    expect(back.map((r) => r.posicao)).toEqual([1, 2, 3, 4, 5]);
    expect(changedCampos(programa, back, rows).size).toBe(0);
  });

  it('tamanho escolhido igual ao padrão não é alteração', () => {
    const same = rows.map((r) => (r.campo === 'nome' ? { ...r, tamanho: '2' } : r));
    expect(changedCampos(programa, same, rows).size).toBe(0);
  });
});

describe('FormularioForm para usuário comum', () => {
  beforeEach(() => {
    auth.user = { id: 'u2', role: 'USER', tenantId: 't1' };
    permissions.alterar = false;
    adminConfig.getFormularioCamposFull.mockReset().mockResolvedValue({});
    adminConfig.saveFormularioCamposFull.mockReset();
  });

  afterEach(() => {
    permissions.alterar = true;
  });

  it('sem "alterar" no perfil: só consulta a configuração', async () => {
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });

    expect(screen.getByText(/Seu perfil de acesso não permite alterar/)).toBeInTheDocument();
    expect(screen.getByLabelText('Posição de Nome')).toBeDisabled();
    openPreview();
    expect(screen.queryByRole('button', { name: /Publicar alterações/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('separator', { name: /Redimensionar/ })).not.toBeInTheDocument();
    expect(adminConfig.saveFormularioCamposFull).not.toHaveBeenCalled();
  });

  it('com "alterar" no perfil: edita e publica como um administrador', async () => {
    permissions.alterar = true;
    adminConfig.saveFormularioCamposFull.mockResolvedValue(undefined);
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });

    expect(screen.queryByText(/Seu perfil de acesso não permite/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Posição de Nome'), { target: { value: '3' } });
    fireEvent.blur(screen.getByLabelText('Posição de Nome'));
    openPreview();
    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
  });
});

describe('Tradução', () => {
  beforeEach(() => {
    sessionStorage.clear();
    auth.user = { id: 'u1', role: 'TENANT_ADMIN', tenantId: 't1' };
    adminConfig.getFormularioCamposFull.mockReset().mockResolvedValue({
      nome: {
        tipoValidacao: null,
        tamanho: null,
        posicao: null,
        traducoes: { en: 'Name' },
      },
    });
    adminConfig.saveFormularioCamposFull.mockReset().mockResolvedValue(undefined);
  });

  it('matriz campos x idiomas: padrão somente leitura, edita e publica as traduções', async () => {
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Tradução' }));

    // Colunas: Padrão + idiomas do sistema.
    for (const header of ['Padrão', 'Português', 'English', 'Español']) {
      expect(screen.getByRole('columnheader', { name: new RegExp(header) })).toBeInTheDocument();
    }
    // O padrão é texto (não editável); os idiomas são campos com o padrão como placeholder.
    expect(screen.queryByRole('textbox', { name: 'Nome em Padrão' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nome em English')).toHaveValue('Name');
    expect(screen.getByLabelText('Nome em Español')).toHaveAttribute('placeholder', 'Nome');
    expect(publishButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nome em Español'), { target: { value: ' Nombre ' } });
    fireEvent.change(screen.getByLabelText('Nome em English'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Cor em English'), { target: { value: 'Color' } });
    expect(screen.getByText(/2 campos alterados/)).toBeInTheDocument();

    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    const campos = adminConfig.saveFormularioCamposFull.mock.calls[0][1] as Array<{
      campo: string;
      traducoes: Record<string, string> | null;
    }>;
    expect(Object.fromEntries(campos.map((c) => [c.campo, c.traducoes]))).toEqual({
      codigoExterno: null,
      nome: { es: 'Nombre' },
      cor: { en: 'Color' },
      unidadeNegocio: null,
      descricao: null,
    });
    await waitFor(() => expect(publishButton()).toBeDisabled());
  });

  it('em branco e só espaços não contam como alteração', async () => {
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Tradução' }));
    fireEvent.change(screen.getByLabelText('Cor em English'), { target: { value: '   ' } });
    expect(publishButton()).toBeDisabled();
  });

  it('voltar ao padrão mantém as traduções', () => {
    const programa = formsRegistry.find((form) => form.id === 'programa')!;
    const rows = programa.campos.map(
      (field): FormularioCampoRow => ({
        campo: field.campo,
        label: field.label,
        tipoValidacao: 'obrigatorio',
        tamanho: '4',
        posicao: null,
        traducoes: { en: field.label + ' EN' },
      }),
    );
    expect(changedCampos(programa, defaultRows(rows), rows).size).toBe(programa.campos.length);
    expect(defaultRows(rows)[0].traducoes).toEqual({ en: programa.campos[0].label + ' EN' });
  });
});

describe('registro dos formulários', () => {
  it.each(formsRegistry.map((form) => [form.id, form] as const))(
    '%s: campos únicos; com layout configurável, tamanhos válidos e grupos depois da área principal',
    (_id, form) => {
      const campos = form.campos.map((field) => field.campo);
      expect(new Set(campos).size).toBe(campos.length);
      if (!form.layoutConfiguravel) return;
      for (const field of form.campos) {
        expect(tamanhoToSpan(field.tamanhoPadrao)).not.toBeNull();
      }
      const firstGroup = form.campos.findIndex((field) => field.grupo);
      if (firstGroup >= 0) {
        expect(form.campos.slice(firstGroup).every((field) => field.grupo)).toBe(true);
      }
    },
  );
});

describe('grupos (seções próprias do formulário)', () => {
  const conteudo = formsRegistry.find((form) => form.id === 'conteudo')!;
  const rows = conteudo.campos.map(
    (field): FormularioCampoRow => ({
      campo: field.campo,
      label: field.label,
      tipoValidacao: null,
      tamanho: null,
      posicao: null,
      traducoes: null,
    }),
  );

  it('o grupo começa numa linha nova, depois do título, e só se ordena entre si', () => {
    const layout = computeFormLayout(conteudo, rows);
    // Área principal: 3 linhas (1/3 x 6, depois 25% x 4, depois 50% x 2); título; frequência.
    expect(layout.headings).toEqual([{ row: 4, label: 'Frequência Semanal' }]);
    const cell = (campo: string) => layout.cells.find((item) => item.campo === campo)!;
    expect(cell('orcamento').row).toBe(3);
    expect(cell('frequenciaDataInicio')).toMatchObject({ row: 5, colStart: 0 });
    expect(layout.rowCount).toBe(6);

    // Posição 1 num campo do grupo: primeiro do grupo, não do formulário.
    const moved = rows.map((row) =>
      row.campo === 'frequenciaDiasSemana' ? { ...row, posicao: 1 } : row,
    );
    const next = computeFormLayout(conteudo, moved);
    expect(next.cells[0].campo).toBe('codigoExterno');
    expect(next.cells.find((item) => item.campo === 'frequenciaDiasSemana')).toMatchObject({
      row: 5,
      colStart: 0,
    });
  });

  it('no Preview mostra o título do grupo e não deixa levar um campo para outro grupo', async () => {
    sessionStorage.clear();
    auth.user = { id: 'u1', role: 'TENANT_ADMIN', tenantId: 't1' };
    adminConfig.getFormularioCamposFull.mockReset().mockResolvedValue({});
    render(<FormularioForm id="conteudo" />);
    await screen.findByRole('heading', { name: 'Conteúdo' });
    openPreview();
    expect(screen.getByText('Frequência Semanal')).toBeInTheDocument();

    const cell = (campo: string) =>
      document.querySelector(`[data-campo="${campo}"]`) as HTMLElement;
    // Teclado: o primeiro do grupo não sobe para a área principal.
    fireEvent.keyDown(cell('frequenciaDataInicio'), { key: 'ArrowLeft' });
    expect(cell('frequenciaDataInicio').dataset).toMatchObject({ linha: '6', coluna: '1' });
    expect(publishButton()).toBeDisabled();
    // Dentro do grupo, move.
    fireEvent.keyDown(cell('frequenciaDataFim'), { key: 'ArrowLeft' });
    expect(cell('frequenciaDataFim').dataset).toMatchObject({ linha: '6', coluna: '1' });
  });
});

describe('Lista (aparência da lista do módulo)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    auth.user = { id: 'u1', role: 'TENANT_ADMIN', tenantId: 't1' };
    adminConfig.getFormularioCamposFull.mockReset().mockResolvedValue({});
    adminConfig.saveFormularioCamposFull.mockReset().mockResolvedValue(undefined);
  });

  const openLista = () => fireEvent.mouseDown(screen.getByRole('tab', { name: 'Lista' }));
  const previewBody = () =>
    screen.getByRole('table', { name: 'Pré-visualização da lista' }).querySelector('tbody')!;

  it('sem zebra por padrão; zebrada mostra as cores pastel e publica a escolhida', async () => {
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });
    openLista();

    expect(screen.getByRole('radio', { name: /Sem zebra/ })).toBeChecked();
    expect(screen.queryByRole('radiogroup', { name: 'Cor das linhas intercaladas' })).toBeNull();
    expect(previewBody()).not.toHaveClass('list-zebra');
    expect(publishButton()).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: /Zebrada/ }));
    const cores = screen.getByRole('radiogroup', { name: 'Cor das linhas intercaladas' });
    expect(within(cores).getAllByRole('radio')).toHaveLength(10);
    // Sem escolha, a primeira cor (Azul) fica selecionada.
    expect(within(cores).getByRole('radio', { name: 'Azul' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(previewBody()).toHaveClass('list-zebra');

    fireEvent.click(within(cores).getByRole('radio', { name: 'Menta' }));
    expect(previewBody().style.getPropertyValue('--list-stripe')).toBe('#DFF5EC');
    expect(screen.getByText(/aparência da lista alterada/)).toBeInTheDocument();

    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    expect(adminConfig.saveFormularioCamposFull.mock.calls[0][3]).toEqual({
      zebrado: true,
      corZebra: 'menta',
    });
    await waitFor(() => expect(publishButton()).toBeDisabled());
  });

  it('carrega a lista publicada; voltar a sem zebra grava sem cor', async () => {
    adminConfig.getFormularioLista.mockResolvedValue({ zebrado: true, corZebra: 'rosa' });
    render(<FormularioForm id="programa" />);
    await screen.findByRole('heading', { name: 'Programa' });
    openLista();

    expect(screen.getByRole('radio', { name: 'Rosa' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: /Sem zebra/ }));
    fireEvent.click(publishButton());
    await waitFor(() => expect(adminConfig.saveFormularioCamposFull).toHaveBeenCalled());
    expect(adminConfig.saveFormularioCamposFull.mock.calls[0][3]).toEqual({
      zebrado: false,
      corZebra: null,
    });
  });
});
