import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TurnoFormBody } from './TurnoFormBody';
import type { Turno } from '@/modules/turnos/turnos.types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'pt-BR',
    setLanguage: vi.fn(),
  }),
}));

function renderBody(
  props: { data?: Turno | null; readOnly?: boolean; onSubmit?: () => Promise<void> } = {},
) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  render(
    <>
      <TurnoFormBody
        formId="turno-form"
        data={props.data ?? null}
        readOnly={props.readOnly ?? false}
        onSubmit={onSubmit}
      />
      {/* Stands in for the page's Save button, which submits the form by id. */}
      <button type="submit" form="turno-form">
        salvar
      </button>
    </>,
  );
  return { onSubmit };
}

const TURNO: Turno = {
  id: 't1',
  nome: 'Turno Noite',
  horaInicio: '22:00:00',
  horaFim: '06:00:00',
  diasSemana: { dom: false, seg: true, ter: true, qua: false, qui: false, sex: false, sab: false },
  pessoasPorDia: { dom: 0, seg: 2, ter: 2, qua: 0, qui: 0, sex: 0, sab: 0 },
  cor: '#000000',
  sigla: 'TN',
  folgasPorSemana: 1,
  folgaEspecial: '',
  descricao: '',
  diasTrabalhados: null,
  traducoes: { en: 'Night shift' },
  dataCadastro: '2026-11-10T12:00:00.000Z',
  usuarioCadastro: 'Ana Silva',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TurnoFormBody', () => {
  it('submete o payload normalizado para a API', async () => {
    const { onSubmit } = renderBody();

    fireEvent.change(screen.getByLabelText(/Nome do Turno/i), {
      target: { value: '  Turno Manhã  ' },
    });
    fireEvent.change(screen.getByLabelText(/^Sigla$/i), {
      target: { value: ' TM ' },
    });
    fireEvent.change(screen.getByLabelText(/common\.description/i), {
      target: { value: '  Operacao diurna  ' },
    });
    fireEvent.change(screen.getByLabelText(/Início do Turno/i), {
      target: { value: '08:30' },
    });
    fireEvent.change(screen.getByLabelText(/Fim do Turno/i), {
      target: { value: '17:15' },
    });

    // 'seg' é o primeiro dia em displayOrder — mesmo índice usado no checkbox e no spinbutton de pessoas.
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    const peopleInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(peopleInput, { target: { value: '4' } });

    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Turno Manhã',
          sigla: 'TM',
          descricao: 'Operacao diurna',
          horaInicio: '08:30:00',
          horaFim: '17:15:00',
          pessoasPorDia: expect.objectContaining({ seg: 4 }),
        }),
      ),
    );
  });

  it('inicializa os campos a partir do registro carregado', () => {
    renderBody({ data: TURNO });

    expect(screen.getByLabelText(/Nome do Turno/i)).toHaveValue('Turno Noite');
    expect(screen.getByLabelText(/Início do Turno/i)).toHaveValue('22:00');
    expect(screen.getByDisplayValue('Ana Silva')).toBeInTheDocument();
  });

  it('mantem horarios e traducoes do registro ao salvar sem alterar', async () => {
    const { onSubmit } = renderBody({ data: TURNO });

    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 't1',
          horaInicio: '22:00:00',
          horaFim: '06:00:00',
          traducoes: { en: 'Night shift' },
        }),
      ),
    );
  });

  it('desabilita os campos e nao submete em modo somente leitura', async () => {
    const { onSubmit } = renderBody({ data: TURNO, readOnly: true });

    expect(screen.getByLabelText(/Nome do Turno/i)).toBeDisabled();
    fireEvent.click(screen.getByText('salvar'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
