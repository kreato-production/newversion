import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DepartamentoFormBody } from './DepartamentoFormBody';
import type { DepartamentoFuncoesResponse } from '@/modules/departamentos/departamentos.api.repository';

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
    async listFuncoes(): Promise<DepartamentoFuncoesResponse> {
      return { associadas: [], cadastradas: [] };
    }
    async addFuncao() {
      return { id: 'assoc-1', funcaoId: 'funcao-1', dataAssociacao: new Date().toISOString() };
    }
    async removeFuncao(): Promise<void> {
      return undefined;
    }
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DepartamentoFormBody', () => {
  it('submete novo departamento sem gerar id local', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <>
        <DepartamentoFormBody formId="dep-form" data={null} readOnly={false} onSubmit={onSave} />
        {/* Stands in for the page's Save button, which submits the form by id. */}
        <button type="submit" form="dep-form">
          common.save
        </button>
      </>,
    );

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
  });

  it('mostra a aba de funcoes apenas na edicao', async () => {
    const { unmount } = render(
      <DepartamentoFormBody formId="dep-form" data={null} readOnly={false} onSubmit={vi.fn()} />,
    );
    expect(screen.queryByRole('tab', { name: /Funcoes/ })).not.toBeInTheDocument();
    unmount();

    render(
      <DepartamentoFormBody
        formId="dep-form"
        data={{
          id: 'd1',
          codigoExterno: 'D1',
          nome: 'Jornalismo',
          descricao: '',
          traducoes: null,
          dataCadastro: '2026-11-10T12:00:00.000Z',
          usuarioCadastro: 'Ana',
        }}
        readOnly={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(await screen.findByRole('tab', { name: /Funcoes/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jornalismo')).toBeInTheDocument();
  });
});
