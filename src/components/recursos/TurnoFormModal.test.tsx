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

    await waitFor(() => screen.getByRole('textbox', { name: /common\.name/i }));

    fireEvent.change(screen.getByRole('textbox', { name: /common\.name/i }), {
      target: { value: '  Turno Manhã  ' },
    });
    fireEvent.change(screen.getByLabelText(/turns\.abbreviation/i), {
      target: { value: ' TM ' },
    });
    fireEvent.change(screen.getByLabelText(/common\.description/i), {
      target: { value: '  Operacao diurna  ' },
    });
    fireEvent.change(screen.getByLabelText(/common\.startTime/i), {
      target: { value: '08:30' },
    });
    fireEvent.change(screen.getByLabelText(/common\.endTime/i), {
      target: { value: '17:15' },
    });

    fireEvent.click(screen.getAllByRole('switch')[1]);
    const peopleInput = document.getElementById('turno-pessoas-seg');
    expect(peopleInput).not.toBeNull();
    fireEvent.change(peopleInput!, { target: { value: '4' } });

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
      expect(screen.getByRole('textbox', { name: /common\.name/i })).toBeDisabled();
    });
  });
});
