/**
 * Behaviour specific to the SPRINT-24 form bodies, beyond the shared RecordFormPage:
 * Recurso Humano (save from another tab, validation, read-only) and Escala (validation,
 * colaboradores saved together with an existing escala).
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecursoHumanoFormBody } from './RecursoHumanoFormBody';
import { EscalaFormBody } from './EscalaFormBody';
import type { RecursoHumano } from '@/modules/recursos-humanos/recursos-humanos.types';
import type { Escala, EscalaColaborador } from '@/modules/escalas/escalas.types';

const repos = vi.hoisted(() => ({
  getColaboradores: vi.fn(),
  saveColaboradores: vi.fn(),
  listColaboradoresByEquipe: vi.fn(),
}));
const toastError = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ isVisible: () => true }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));
vi.mock('@/components/shared/SearchableSelect', () => ({
  SearchableSelect: () => <div>select</div>,
}));
vi.mock('@/modules/recursos-humanos/recursos-humanos.repository.provider', () => ({
  recursosHumanosRepository: {
    listOptions: vi.fn().mockResolvedValue({
      departamentos: [],
      funcoes: [],
      departamentoFuncoes: [],
    }),
  },
}));
vi.mock('@/modules/recursos-humanos/recursos-humanos.api.repository', () => ({
  ApiRecursosHumanosRepository: class {
    list = vi.fn().mockResolvedValue([]);
    save = vi.fn();
  },
}));
vi.mock('@/modules/escalas/escalas.repository.provider', () => ({
  escalasRepository: {
    listEquipes: vi.fn().mockResolvedValue([]),
    getColaboradores: repos.getColaboradores,
    saveColaboradores: repos.saveColaboradores,
    listColaboradoresByEquipe: repos.listColaboradoresByEquipe,
  },
}));
vi.mock('@/modules/turnos/turnos.repository.provider', () => ({
  turnosRepository: { list: vi.fn().mockResolvedValue([]) },
}));

const submitButton = (formId: string) => (
  <button type="submit" form={formId}>
    salvar
  </button>
);

const RECURSO: RecursoHumano = {
  id: 'rh1',
  codigoExterno: '',
  nome: 'Ana',
  sobrenome: 'Silva',
  foto: '',
  dataNascimento: '',
  sexo: '',
  telefone: '',
  email: '',
  departamento: '',
  departamentoId: '',
  funcao: 'Câmara',
  funcaoId: '',
  custoHora: 10,
  dataContratacao: '',
  status: 'Ativo',
  anexos: [],
  ausencias: [],
  escalas: [],
} as RecursoHumano;

describe('RecursoHumanoFormBody', () => {
  beforeEach(() => toastError.mockClear());

  it('saves from the Escalas tab, keeping the record id', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <RecursoHumanoFormBody formId="rh" data={RECURSO} readOnly={false} onSubmit={onSubmit} />
        {submitButton('rh')}
      </>,
    );
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Escalas' }));
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ id: 'rh1', nome: 'Ana', funcao: 'Câmara' });
  });

  it('does not submit a new colaborador without nome and sobrenome', async () => {
    const onSubmit = vi.fn();
    render(
      <>
        <RecursoHumanoFormBody formId="rh" data={null} readOnly={false} onSubmit={onSubmit} />
        {submitButton('rh')}
      </>,
    );
    fireEvent.submit(document.getElementById('rh')!);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when read-only', async () => {
    const onSubmit = vi.fn();
    render(<RecursoHumanoFormBody formId="rh" data={RECURSO} readOnly onSubmit={onSubmit} />);
    fireEvent.submit(document.getElementById('rh')!);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

const ESCALA: Escala = {
  id: 'e1',
  numerador: 1,
  codigoExterno: 'E1',
  titulo: 'Escala Março',
  equipeId: 'eq1',
  equipeNome: 'Equipa A',
  dataInicio: '2026-03-01',
  dataCadastro: '2026-02-20',
  usuarioCadastro: 'admin',
};

const COLABORADOR: EscalaColaborador = {
  id: 'c1',
  colaboradorId: 'rh1',
  colaboradorNome: 'Ana Silva',
  colaboradorFuncao: 'Câmara',
  turnoId: 't1',
  turnoNome: 'Manhã',
  turnoSigla: 'M',
  turnoCor: '#fff',
  dias: { '1': 't1' },
};

describe('EscalaFormBody', () => {
  beforeEach(() => {
    toastError.mockClear();
    repos.getColaboradores.mockReset().mockResolvedValue([COLABORADOR]);
    repos.saveColaboradores.mockReset().mockResolvedValue([]);
    repos.listColaboradoresByEquipe.mockReset().mockResolvedValue([]);
  });

  it('starts from the record and saves its colaboradores before the escala', async () => {
    const order: string[] = [];
    repos.saveColaboradores.mockImplementation(async () => {
      order.push('colaboradores');
      return [];
    });
    const onSubmit = vi.fn().mockImplementation(async () => {
      order.push('escala');
    });
    render(<EscalaFormBody formId="es" data={ESCALA} readOnly={false} onSubmit={onSubmit} />);

    expect(screen.getByDisplayValue('Escala Março')).toBeInTheDocument();
    await waitFor(() => expect(repos.getColaboradores).toHaveBeenCalledWith('e1'));
    // The record's own team is not reloaded on mount (it would wipe the saved grid).
    expect(repos.listColaboradoresByEquipe).not.toHaveBeenCalled();

    fireEvent.submit(document.getElementById('es')!);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(repos.saveColaboradores).toHaveBeenCalledWith('e1', [
      { colaboradorId: 'rh1', turnoId: 't1', dias: { '1': 't1' } },
    ]);
    expect(order).toEqual(['colaboradores', 'escala']);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      id: 'e1',
      titulo: 'Escala Março',
      equipeId: 'eq1',
      dataInicio: '2026-03-01',
    });
  });

  it('does not save the escala when the colaboradores fail', async () => {
    repos.saveColaboradores.mockRejectedValue(new Error('boom'));
    const onSubmit = vi.fn();
    render(<EscalaFormBody formId="es" data={ESCALA} readOnly={false} onSubmit={onSubmit} />);
    await waitFor(() => expect(repos.getColaboradores).toHaveBeenCalled());
    // Let the loaded colaboradores reach the state (their grid lives in another tab).
    await new Promise((resolve) => setTimeout(resolve, 0));

    fireEvent.submit(document.getElementById('es')!);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a título for a new escala', async () => {
    const onSubmit = vi.fn();
    render(<EscalaFormBody formId="es" data={null} readOnly={false} onSubmit={onSubmit} />);

    fireEvent.submit(document.getElementById('es')!);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(repos.saveColaboradores).not.toHaveBeenCalled();
  });

  it('does not submit when read-only', async () => {
    const onSubmit = vi.fn();
    render(<EscalaFormBody formId="es" data={ESCALA} readOnly onSubmit={onSubmit} />);
    fireEvent.submit(document.getElementById('es')!);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(repos.saveColaboradores).not.toHaveBeenCalled();
  });
});
