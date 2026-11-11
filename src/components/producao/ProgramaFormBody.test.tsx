import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgramaFormBody } from './ProgramaFormBody';

vi.mock('@/modules/unidades/unidades.repository.provider', () => ({
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

const PROGRAMA = {
  id: 'p-1',
  codigoExterno: '',
  nome: 'Programa Existente',
  descricao: '',
  unidadeNegocioId: '',
  unidadeNegocio: '',
  dataCadastro: '2026-01-01T00:00:00.000Z',
};

function renderBody(
  props: { data?: typeof PROGRAMA | null; readOnly?: boolean; onSubmit?: () => Promise<void> } = {},
) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  render(
    <>
      <ProgramaFormBody
        formId="programa-form"
        data={props.data ?? null}
        readOnly={props.readOnly ?? false}
        onSubmit={onSubmit}
      />
      {/* Stands in for the page's Save button, which submits the form by id. */}
      <button type="submit" form="programa-form">
        common.save
      </button>
    </>,
  );
  return { onSubmit };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProgramaFormBody', () => {
  it('preenche campo nome com dado existente', async () => {
    renderBody({ data: PROGRAMA });
    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: /common.name/i });
      expect((input as HTMLInputElement).value).toBe('Programa Existente');
    });
  });

  it('nao submete quando nome esta vazio', async () => {
    const { onSubmit } = renderBody();
    await waitFor(() => screen.getByText('common.save'));
    fireEvent.click(screen.getByText('common.save'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('chama onSubmit com nome quando formulario submetido', async () => {
    const { onSubmit } = renderBody();

    await waitFor(() => screen.getByRole('textbox', { name: /common.name/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /common.name/i }), {
      target: { value: 'Novo Programa Teste' },
    });
    fireEvent.click(screen.getByText('common.save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Novo Programa Teste' }),
      ),
    );
  });

  it('envia o id do registro na edicao', async () => {
    const { onSubmit } = renderBody({ data: PROGRAMA });
    await waitFor(() => screen.getByDisplayValue('Programa Existente'));
    fireEvent.click(screen.getByText('common.save'));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-1' })),
    );
  });

  it('exibe campos desabilitados no modo readOnly', async () => {
    renderBody({ readOnly: true });
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => expect(input).toBeDisabled());
    });
  });
});
