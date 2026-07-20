import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TurnoFormModal } from './TurnoFormModal';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'pt-BR',
    setLanguage: vi.fn(),
  }),
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TurnoFormModal', () => {
  it('exibe titulo de novo turno quando nenhum dado e informado', async () => {
    render(<TurnoFormModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('turns.new')).toBeInTheDocument());
  });

  it('submete o payload normalizado para a API', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<TurnoFormModal {...defaultProps} onSave={onSave} onClose={onClose} />);

    await waitFor(() => screen.getByLabelText(/Nome do Turno/i));

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

    fireEvent.click(screen.getByText('common.save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
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
    expect(onClose).toHaveBeenCalled();
  });

  it('desabilita envio quando esta em modo somente leitura', async () => {
    render(<TurnoFormModal {...defaultProps} readOnly />);

    await waitFor(() => {
      expect(screen.queryByText('common.save')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Nome do Turno/i)).toBeDisabled();
    });
  });
});
