import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DepartamentoFormModal } from './DepartamentoFormModal';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { nome: 'Administrador Teste' },
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'pt-BR',
    setLanguage: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/modules/departamentos/departamentos.api.repository', () => ({
  ApiDepartamentosRepository: class {
    async listFuncoes() {
      return { associadas: [], cadastradas: [] };
    }
    async addFuncao() {
      return { id: 'assoc-1', funcaoId: 'funcao-1', dataAssociacao: new Date().toISOString() };
    }
    async removeFuncao() {
      return undefined;
    }
  },
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DepartamentoFormModal', () => {
  it('submete novo departamento sem gerar id local', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<DepartamentoFormModal {...defaultProps} onSave={onSave} onClose={onClose} />);

    await waitFor(() => screen.getByRole('textbox', { name: /common\.name/i }));

    fireEvent.change(screen.getByRole('textbox', { name: /common\.externalCode/i }), {
      target: { value: 'DEP-001' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /common\.name/i }), {
      target: { value: 'Departamento Teste' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /common\.description/i }), {
      target: { value: 'Descricao teste' },
    });

    fireEvent.click(screen.getByText('common.save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          codigoExterno: 'DEP-001',
          nome: 'Departamento Teste',
          descricao: 'Descricao teste',
          usuarioCadastro: 'Administrador Teste',
        }),
      ),
    );

    expect(onSave.mock.calls[0]?.[0]).not.toHaveProperty('id');
    expect(onClose).toHaveBeenCalled();
  });
});
