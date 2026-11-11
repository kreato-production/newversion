/**
 * Behaviour specific to the SPRINT-25 form bodies, beyond the shared RecordFormPage:
 * Conteúdo (payload, validation, read-only, actions moved out of the old footer) and
 * Gravação (initial status, Grelha values, read-only) plus the Grelha dialog wrapper.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConteudoFormBody } from './ConteudoFormBody';
import { GravacaoFormBody } from './GravacaoFormBody';
import { GravacaoBackendFormModal } from './GravacaoBackendFormModal';
import type { Conteudo } from '@/modules/conteudos/conteudos.types';
import type { Gravacao } from '@/modules/gravacoes/gravacoes.types';

const toast = vi.hoisted(() => vi.fn());
const toastApi = vi.hoisted(() => ({ toast }));
// Stable like the real hook: a new `t` per render would re-run effects that depend on it.
const translate = vi.hoisted(() => (key: string) => key);

vi.mock('@/hooks/use-toast', () => ({ useToast: () => toastApi }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ isVisible: () => true }),
}));
const auth = vi.hoisted(() => ({ user: { id: 'u1', tenantId: 't1', unidadeIds: [] as string[] } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: translate }),
}));
vi.mock('@/components/shared/SearchableSelect', () => ({
  SearchableSelect: () => <div>select</div>,
}));
vi.mock('@/modules/conteudos/conteudos.repository.provider', () => ({
  conteudosRepository: {
    listOptions: vi.fn().mockResolvedValue({
      centrosLucro: [],
      unidades: [],
      tipos: [],
      classificacoes: [],
      statusList: [],
      centroLucroUnidades: [],
      tabelasPreco: [],
      programas: [],
    }),
    list: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('@/modules/conteudos/conteudos-relacionamentos.api', () => ({
  conteudosRelacionamentosApi: { generateGravacoes: vi.fn(), listEspacos: vi.fn() },
}));
vi.mock('@/modules/gravacoes/gravacoes.repository.provider', () => ({
  gravacoesRepository: { list: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/modules/gravacoes/gravacoes-relacionamentos.api', () => ({
  gravacoesRelacionamentosApi: { getCustos: vi.fn() },
}));
vi.mock('@/modules/parametrizacoes/parametrizacoes.api.repository', () => ({
  ApiParametrizacoesRepository: class {
    listStatusGravacao = vi.fn().mockResolvedValue({
      data: [
        { id: 's1', nome: 'Em curso' },
        { id: 's2', nome: 'Planejada' },
      ],
    });
  },
}));
// Related tabs and reports: covered by their own tests.
vi.mock('./ElencoTab', () => ({ ElencoTab: (): null => null }));
vi.mock('./ConteudoTerceirosTab', () => ({ ConteudoTerceirosTab: (): null => null }));
vi.mock('./ConteudoCustosBackendTab', () => ({ ConteudoCustosBackendTab: (): null => null }));
vi.mock('./ConteudoEspacosTab', () => ({ ConteudoEspacosTab: (): null => null }));
vi.mock('./EtapasTab', () => ({ EtapasTab: (): null => null }));
vi.mock('./PlanoProducaoModal', () => ({ PlanoProducaoModal: (): null => null }));
vi.mock('./GravacaoReportGenerator', () => ({
  GravacaoReportGenerator: () => <button type="button">relatorio</button>,
}));
vi.mock('./RecursosTab', () => ({ RecursosTab: (): null => null }));
vi.mock('./GravacaoTarefasTab', () => ({ GravacaoTarefasTab: (): null => null }));
vi.mock('./GravacaoIncidenciasTab', () => ({ GravacaoIncidenciasTab: (): null => null }));
vi.mock('./TerceirosTab', () => ({ TerceirosTab: (): null => null }));
vi.mock('./ConvidadosTab', () => ({ ConvidadosTab: (): null => null }));
vi.mock('./FigurinosTab', () => ({ default: (): null => null }));
vi.mock('./RoteiroTab', () => ({ RoteiroTab: (): null => null }));
vi.mock('./CustosTab', () => ({ CustosTab: (): null => null }));
vi.mock('./GravacaoEspacosTab', () => ({ GravacaoEspacosTab: (): null => null }));
vi.mock('./GravacaoDespesasTab', () => ({ GravacaoDespesasTab: (): null => null }));
vi.mock('./GravacaoEtapasTab', () => ({ GravacaoEtapasTab: (): null => null }));

const CONTEUDO = {
  id: 'c1',
  codigoExterno: 'CT1',
  descricao: 'Novela das 9',
  quantidadeEpisodios: 120,
  centroLucroId: 'cl1',
  centroLucro: 'Dramaturgia',
  unidadeNegocioId: 'un1',
  unidadeNegocio: 'Estúdios',
  programaId: '',
  tipoConteudo: 'Novela',
  tipoConteudoId: 'tc1',
  classificacao: '',
  classificacaoId: '',
  anoProducao: '2026',
  sinopse: '',
  orcamento: 5000,
  tabelaPrecoId: '',
  frequenciaDataInicio: '',
  frequenciaDataFim: '',
  frequenciaDiasSemana: [],
} as unknown as Conteudo;

const submit = (formId: string) => fireEvent.submit(document.getElementById(formId)!);

describe('ConteudoFormBody', () => {
  beforeEach(() => toast.mockClear());

  it('submits the record fields with its id', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ConteudoFormBody formId="ct" data={CONTEUDO} readOnly={false} onSubmit={onSubmit} />);

    expect(screen.getByDisplayValue('Novela das 9')).toBeInTheDocument();
    submit('ct');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      id: 'c1',
      descricao: 'Novela das 9',
      quantidadeEpisodios: 120,
      centroLucro: 'Dramaturgia',
      unidadeNegocioId: 'un1',
      orcamento: 5000,
    });
  });

  it('starts a new conteúdo with a generated code and requires the descrição', async () => {
    const onSubmit = vi.fn();
    render(<ConteudoFormBody formId="ct" data={null} readOnly={false} onSubmit={onSubmit} />);

    submit('ct');

    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(toast.mock.calls[0][0]).toMatchObject({ variant: 'destructive' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when read-only', async () => {
    const onSubmit = vi.fn();
    render(<ConteudoFormBody formId="ct" data={CONTEUDO} readOnly onSubmit={onSubmit} />);
    submit('ct');

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the "Plano de Produção" action (was in the dialog footer), off without etapas', () => {
    render(<ConteudoFormBody formId="ct" data={CONTEUDO} readOnly={false} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Plano de Produção/ })).toBeDisabled();
  });
});

const GRAVACAO = {
  id: 'g1',
  codigo: '202612345',
  codigoExterno: '',
  nome: 'Episódio 1',
  unidadeNegocioId: 'un1',
  unidadeNegocio: 'Estúdios',
  centroLucro: '',
  classificacao: '',
  tipoConteudo: '',
  descricao: '',
  status: 'Em curso',
  dataPrevista: '2026-12-01',
  conteudoId: 'c1',
  orcamento: 0,
  programaId: '',
} as unknown as Gravacao;

describe('GravacaoFormBody', () => {
  it('starts a new gravação as "Planejada", with the values given by the Grelha', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <GravacaoFormBody
        formId="gv"
        data={null}
        readOnly={false}
        onSubmit={onSubmit}
        initialValues={{ nome: 'Planeada na grelha', dataPrevista: '2026-12-24', programaId: 'p1' }}
      />,
    );
    expect(screen.getByDisplayValue('Planeada na grelha')).toBeInTheDocument();
    // The status options load after mount; the initial status follows them.
    await new Promise((resolve) => setTimeout(resolve, 0));

    submit('gv');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      nome: 'Planeada na grelha',
      dataPrevista: '2026-12-24',
      programaId: 'p1',
      status: 'Planejada',
    });
    expect(onSubmit.mock.calls[0][0].id).toBeUndefined();
    expect(onSubmit.mock.calls[0][0].codigo).toMatch(/^\d{9}$/);
  });

  it('keeps the status of an existing gravação and shows its report action', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GravacaoFormBody formId="gv" data={GRAVACAO} readOnly={false} onSubmit={onSubmit} />);
    expect(screen.getByText('relatorio')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 0));

    submit('gv');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ id: 'g1', status: 'Em curso' });
  });

  it('does not submit when read-only', async () => {
    const onSubmit = vi.fn();
    render(<GravacaoFormBody formId="gv" data={GRAVACAO} readOnly onSubmit={onSubmit} />);
    submit('gv');

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('GravacaoBackendFormModal (Grelha de programação)', () => {
  it('saves through the caller and closes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<GravacaoBackendFormModal isOpen onClose={onClose} onSave={onSave} data={GRAVACAO} />);

    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ id: 'g1', nome: 'Episódio 1' });
  });

  it('stays open when the save fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('boom'));
    const onClose = vi.fn();
    render(<GravacaoBackendFormModal isOpen onClose={onClose} onSave={onSave} data={GRAVACAO} />);

    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onClose).not.toHaveBeenCalled();
  });
});
