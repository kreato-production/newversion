/**
 * SPRINT-23 (Produção operacional): Incidência (page body + dialog kept for embedded
 * contexts), Tarefa (delete action, initial status), Template and Tabela de Preço bodies.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IncidenciaGravacaoFormBody } from './IncidenciaGravacaoFormBody';
import { IncidenciaGravacaoFormModal } from './IncidenciaGravacaoFormModal';
import { TarefaFormBody } from './TarefaFormBody';
import { TemplateFormBody } from './TemplateFormBody';
import { TabelaPrecoFormBody } from './TabelaPrecoFormBody';

const toast = vi.fn();
const incidenciasRepo = vi.hoisted(() => ({
  save: vi.fn(),
  listAnexos: vi.fn(),
  addAnexo: vi.fn(),
  removeAnexo: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', tenantId: 't1', nome: 'Ana' } }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'pt',
    formatDate: (v: string) => v,
  }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ isVisible: () => true, isReadOnly: () => false }),
}));
vi.mock('@/hooks/useFormFieldConfig', () => ({
  useFormFieldConfig: () => ({
    getAsterisk: (): null => null,
    validateRequired: (): string[] => [],
    showValidationError: vi.fn(),
    getColSpan: (_c: string, d: number) => d,
    getPosicao: (): null => null,
  }),
  FieldAsterisk: (): null => null,
}));
vi.mock('@/components/shared/SearchableSelect', () => ({
  SearchableSelect: () => <div>select</div>,
}));
vi.mock('@/modules/incidencias-gravacao/incidencias-gravacao.api', () => ({
  ApiIncidenciasGravacaoRepository: class {
    save = incidenciasRepo.save;
    listAnexos = incidenciasRepo.listAnexos;
    addAnexo = incidenciasRepo.addAnexo;
    removeAnexo = incidenciasRepo.removeAnexo;
  },
}));
vi.mock('@/modules/gravacoes/gravacoes.repository.provider', () => ({
  gravacoesRepository: { list: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/modules/recursos-fisicos/recursos-fisicos.api.repository', () => ({
  ApiRecursosFisicosRepository: class {
    list = vi.fn().mockResolvedValue([]);
  },
}));
vi.mock('@/modules/parametrizacoes/parametrizacoes.api.repository', () => ({
  ApiParametrizacoesRepository: class {
    listSeveridadesIncidencia = vi.fn().mockResolvedValue({ data: [] });
    listImpactosIncidencia = vi.fn().mockResolvedValue({ data: [] });
    listCategoriasIncidencia = vi.fn().mockResolvedValue({ data: [] });
    listClassificacoesIncidencia = vi.fn().mockResolvedValue({ data: [] });
  },
}));
vi.mock('@/modules/tarefas/tarefas.api', () => ({
  ApiTarefasRepository: class {
    listOptions = vi.fn().mockResolvedValue({
      statusList: [
        { id: 's-pend', codigo: 'PEND', nome: 'Pendente', is_inicial: false },
        { id: 's-ini', codigo: 'NOVA', nome: 'Nova', is_inicial: true },
      ],
      gravacoes: [],
      recursosHumanos: [],
    });
  },
}));
vi.mock('@/modules/tabelas-preco/tabelas-preco.api.repository', () => ({
  ApiTabelasPrecoRepository: class {
    listOptions = vi.fn().mockResolvedValue({ unidades: [] });
  },
}));
vi.mock('@/components/producao/TabelaPrecoRecursosTecnicosTab', () => ({
  TabelaPrecoRecursosTecnicosTab: () => <div>rt-tab</div>,
}));
vi.mock('@/components/producao/TabelaPrecoRecursosFisicosTab', () => ({
  TabelaPrecoRecursosFisicosTab: () => <div>rf-tab</div>,
}));
vi.mock('./PlanoProducaoModal', () => ({ PlanoProducaoModal: (): null => null }));
vi.mock('./EtapasTab', () => ({ EtapasTab: () => <div>etapas</div> }));

const submitButton = (formId: string) => (
  <button type="submit" form={formId}>
    salvar
  </button>
);

beforeEach(() => {
  vi.clearAllMocks();
  incidenciasRepo.listAnexos.mockResolvedValue([]);
  incidenciasRepo.save.mockResolvedValue({});
});

describe('IncidenciaGravacaoFormBody', () => {
  it('usa a gravacao padrao e envia o payload em snake_case', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <IncidenciaGravacaoFormBody
          formId="inc"
          data={null}
          readOnly={false}
          onSubmit={onSubmit}
          defaultGravacaoId="g1"
        />
        {submitButton('inc')}
      </>,
    );

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Falha de áudio' } });
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Falha de áudio', gravacao_id: 'g1', created_by: 'u1' }),
      ),
    );
  });

  it('nao envia em somente leitura', async () => {
    const onSubmit = vi.fn();
    render(
      <>
        <IncidenciaGravacaoFormBody
          formId="inc"
          data={{ id: 'i1', titulo: 'X' }}
          readOnly
          onSubmit={onSubmit}
        />
        {submitButton('inc')}
      </>,
    );
    fireEvent.click(screen.getByText('salvar'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('IncidenciaGravacaoFormModal (contextos embutidos)', () => {
  it('salva pelo repositorio, avisa e chama onSave/onClose', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <IncidenciaGravacaoFormModal isOpen onClose={onClose} onSave={onSave} defaultJanelaId="j1" />,
    );

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Perda de sinal' } });
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(incidenciasRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Perda de sinal', janela_id: 'j1', created_by: 'u1' }),
      ),
    );
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'common.success' }));
  });
});

describe('TarefaFormBody', () => {
  it('nova tarefa comeca com o status inicial configurado', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <TarefaFormBody formId="tar" data={null} readOnly={false} onSubmit={onSubmit} />
        {submitButton('tar')}
      </>,
    );

    fireEvent.change(document.getElementById('titulo')!, { target: { value: 'Revisar roteiro' } });
    // The initial status is filled in once the options arrive (shown as the selected value).
    expect((await screen.findAllByText('Nova')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Revisar roteiro',
          statusId: 's-ini',
          prioridade: 'media',
        }),
      ),
    );
  });

  it('mostra a exclusao apenas quando permitida', () => {
    const tarefa = { id: 't1', titulo: 'Existente' } as never;
    const { unmount } = render(
      <TarefaFormBody formId="tar" data={tarefa} readOnly={false} onSubmit={vi.fn()} />,
    );
    expect(document.querySelector('.lucide-trash2, .lucide-trash-2')).toBeNull();
    unmount();

    render(
      <TarefaFormBody
        formId="tar"
        data={tarefa}
        readOnly={false}
        onSubmit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(document.querySelector('.lucide-trash2, .lucide-trash-2')).not.toBeNull();
  });
});

describe('TemplateFormBody', () => {
  it('envia o nome sem espacos e o estado', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <TemplateFormBody formId="tpl" data={null} readOnly={false} onSubmit={onSubmit} />
        {submitButton('tpl')}
      </>,
    );
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: '  Jornal da Noite ' } });
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Jornal da Noite', estado: 'Ativo', etapas: [] }),
      ),
    );
  });
});

describe('TabelaPrecoFormBody', () => {
  it('envia no tenant do usuario e so mostra recursos na edicao', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(
      <>
        <TabelaPrecoFormBody formId="tp" data={null} readOnly={false} onSubmit={onSubmit} />
        {submitButton('tp')}
      </>,
    );
    expect(screen.queryByText('rt-tab')).not.toBeInTheDocument();
    fireEvent.change(document.getElementById('nome')!, { target: { value: 'Tabela 2027' } });
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Tabela 2027', tenantId: 't1', id: undefined }),
      ),
    );
    unmount();

    render(
      <TabelaPrecoFormBody
        formId="tp"
        data={{ id: 'tp1', nome: 'Tabela 2026' } as never}
        readOnly={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(await screen.findByText('rt-tab')).toBeInTheDocument();
  });
});
