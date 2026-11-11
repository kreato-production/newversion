/**
 * Behaviour specific to the SPRINT-21 form bodies, beyond the shared RecordFormPage:
 * Fornecedor (save from another tab, list path per menu), Equipe (read-only) and
 * Espaço (validation before submit).
 */
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FornecedorFormBody } from './FornecedorFormBody';
import { EquipeFormBody } from './EquipeFormBody';
import { EspacoFormBody } from './EspacoFormBody';
import FornecedorForm from '@/views/recursos/FornecedorForm';
import type { Fornecedor } from '@/modules/fornecedores/fornecedores.types';

const push = vi.fn();
const navigation = vi.hoisted(() => ({ pathname: '/recursos/fornecedores/novo' }));
const toast = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => navigation.pathname,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canIncluir: () => true, canAlterar: () => true, isVisible: () => true }),
}));
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
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { tenantId: 't1' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => ({ 'common.save': 'Salvar' })[key] ?? key }),
}));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/shared/SearchableSelect', () => ({
  SearchableSelect: () => <div>select</div>,
}));
vi.mock('./ServicosTab', () => ({ ServicosTab: () => <div>servicos-tab</div> }));
vi.mock('./FornecedorArquivosTab', () => ({
  FornecedorArquivosTab: () => <div>arquivos-tab</div>,
}));
vi.mock('@/modules/fornecedores/fornecedores.repository.provider', () => ({
  fornecedoresRepository: {
    listOptions: vi.fn().mockResolvedValue({ categorias: [] }),
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('@/modules/equipes/equipes.repository.provider', () => ({
  equipesRepository: {
    listMembros: vi.fn().mockResolvedValue({ membros: [], disponiveis: [] }),
    addMembro: vi.fn(),
    removeMembro: vi.fn(),
  },
}));
vi.mock('@/modules/parametros/parametros.api.repository', () => ({
  ApiParametrosRepository: class {
    list = vi.fn().mockResolvedValue([]);
  },
}));

const FORNECEDOR: Fornecedor = {
  id: 'f1',
  codigoExterno: 'F1',
  nome: 'Catering Lda',
  categoria: '',
  categoriaId: '',
  email: '',
  pais: 'Portugal',
  identificacaoFiscal: '',
  descricao: '',
} as Fornecedor;

const submitButton = (formId: string) => (
  <button type="submit" form={formId}>
    salvar
  </button>
);

describe('FornecedorFormBody', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('salva mesmo com outra aba aberta (aba de dados fica montada)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <FornecedorFormBody formId="forn" data={FORNECEDOR} readOnly={false} onSubmit={onSubmit} />
        {submitButton('forn')}
      </>,
    );

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'field.files' }));
    expect(await screen.findByText('arquivos-tab')).toBeInTheDocument();

    fireEvent.click(screen.getByText('salvar'));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'f1', nome: 'Catering Lda' }),
      ),
    );
  });

  it('volta para a lista do menu de onde veio (Gestão de Eventos)', async () => {
    navigation.pathname = '/eventos/fornecedores/novo';
    render(<FornecedorForm />);

    fireEvent.click(await screen.findByRole('button', { name: /common\.back/ }));
    expect(push).toHaveBeenCalledWith('/eventos/fornecedores');
  });
});

describe('EquipeFormBody', () => {
  it('em somente leitura bloqueia campos e a gestao de membros', async () => {
    render(
      <EquipeFormBody
        formId="eq"
        data={{ id: 'e1', codigo: 'EQ1', descricao: 'Câmeras', membrosCount: 0, dataCadastro: '' }}
        readOnly
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('EQ1')).toBeDisabled();
    expect(screen.getByDisplayValue('Câmeras')).toBeDisabled();
    expect(await screen.findByRole('button', { name: /teams\.addMember/ })).toBeDisabled();
  });
});

describe('EspacoFormBody', () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it('nao submete faixa de disponibilidade sem datas', async () => {
    const onSubmit = vi.fn();
    render(
      <>
        <EspacoFormBody
          formId="esp"
          data={{
            id: 's1',
            codigoExterno: '',
            titulo: 'Estúdio 1',
            descricao: '',
            faixasDisponibilidade: [
              {
                id: 'fx',
                dataInicio: '',
                dataFim: '',
                horaInicio: '09:00',
                horaFim: '18:00',
                diasSemana: [1],
              },
            ],
            dataCadastro: '',
            usuarioCadastro: '',
          }}
          readOnly={false}
          onSubmit={onSubmit}
        />
        {submitButton('esp')}
      </>,
    );

    fireEvent.click(screen.getByText('salvar'));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Erro de validação' })),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submete o espaco valido', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <EspacoFormBody formId="esp" data={null} readOnly={false} onSubmit={onSubmit} />
        {submitButton('esp')}
      </>,
    );

    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Estúdio 2' } });
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Estúdio 2', faixasDisponibilidade: [] }),
      ),
    );
  });
});
