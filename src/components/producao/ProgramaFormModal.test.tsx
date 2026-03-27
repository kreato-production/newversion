import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgramaFormModal } from './ProgramaFormModal';

vi.mock('@/modules/unidades/unidades.repository', () => ({
  unidadesRepository: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

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

describe('ProgramaFormModal', () => {
  it('exibe titulo "Novo Programa" quando nenhum dado passado', async () => {
    render(<ProgramaFormModal {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Novo Programa')).toBeInTheDocument());
  });

  it('exibe titulo "Editar Programa" quando dados passados', async () => {
    const programa = { id: 'p-1', codigoExterno: 'PA', nome: 'Programa A', descricao: '', unidadeNegocioId: '' };
    render(<ProgramaFormModal {...defaultProps} data={programa} />);
    await waitFor(() => expect(screen.getByText('Editar Programa')).toBeInTheDocument());
  });

  it('preenche campo nome com dado existente', async () => {
    const programa = { id: 'p-1', codigoExterno: '', nome: 'Programa Existente', descricao: '', unidadeNegocioId: '' };
    render(<ProgramaFormModal {...defaultProps} data={programa} />);
    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: /common\.name/i });
      expect((input as HTMLInputElement).value).toBe('Programa Existente');
    });
  });

  it('chama onClose ao clicar em cancelar', async () => {
    const onClose = vi.fn();
    render(<ProgramaFormModal {...defaultProps} onClose={onClose} />);
    await waitFor(() => screen.getByText('common.cancel'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('nao submete quando nome esta vazio', async () => {
    const onSave = vi.fn();
    render(<ProgramaFormModal {...defaultProps} onSave={onSave} />);
    await waitFor(() => screen.getByText('common.save'));
    fireEvent.click(screen.getByText('common.save'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('chama onSave com nome quando formulario submetido', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ProgramaFormModal {...defaultProps} onSave={onSave} onClose={onClose} />);

    await waitFor(() => screen.getByRole('textbox', { name: /common\.name/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /common\.name/i }), {
      target: { value: 'Novo Programa Teste' },
    });
    fireEvent.click(screen.getByText('common.save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Novo Programa Teste' }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('exibe campos desabilitados no modo readOnly', async () => {
    render(<ProgramaFormModal {...defaultProps} readOnly />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => expect(input).toBeDisabled());
    });
  });
});
