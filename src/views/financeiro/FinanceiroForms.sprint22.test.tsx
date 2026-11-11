/** SPRINT-22 (Financeiro): Orçamento header + items on one page, Contas a Pagar body. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrcamentoFormBody } from '@/components/financeiro/OrcamentoFormBody';
import { ContaPagarFormBody } from '@/components/financeiro/ContaPagarFormBody';
import type { Orcamento } from '@/modules/financeiro/orcamento.api';

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/components/financeiro/OrcamentoItensPanel', () => ({
  OrcamentoItensPanel: ({ orcamento }: { orcamento: Orcamento }) => (
    <div>itens de {orcamento.id}</div>
  ),
}));
vi.mock('@/components/shared/SearchableSelect', () => ({
  SearchableSelect: ({
    options,
    onValueChange,
  }: {
    options: Array<{ value: string; label: string }>;
    onValueChange: (v: string) => void;
  }) => (
    <select aria-label="centro" onChange={(e) => onValueChange(e.target.value)}>
      <option value="">-</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock('@/modules/parametrizacoes/parametrizacoes.api.repository', () => ({
  ApiParametrizacoesRepository: class {
    listCentrosLucro = vi.fn().mockResolvedValue({ data: [{ id: 'c1', nome: 'Centro Norte' }] });
    listStatusContasPagar = vi.fn().mockResolvedValue({ data: [] });
    listCategoriasDespesa = vi.fn().mockResolvedValue({ data: [] });
    listFormasPagamento = vi.fn().mockResolvedValue({ data: [] });
    listTiposDocumentosFinanceiro = vi.fn().mockResolvedValue({ data: [] });
  },
}));
vi.mock('@/modules/fornecedores/fornecedores.api.repository', () => ({
  ApiFornecedoresRepository: class {
    list = vi.fn().mockResolvedValue([]);
  },
}));

const ORCAMENTO = {
  id: 'o1',
  ano: 2026,
  centroLucroId: 'c1',
  centroLucroNome: 'Centro Norte',
  descricao: 'Plano anual',
} as Orcamento;

const submit = (formId: string) => (
  <button type="submit" form={formId}>
    salvar
  </button>
);

describe('OrcamentoFormBody', () => {
  it('na inclusao mostra so o cabecalho e envia ano + centro de lucro', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <OrcamentoFormBody formId="orc" data={null} readOnly={false} onSubmit={onSubmit} />
        {submit('orc')}
      </>,
    );

    expect(screen.queryByText(/itens de/)).not.toBeInTheDocument();
    await screen.findByRole('option', { name: 'Centro Norte' });
    fireEvent.change(screen.getByLabelText('centro'), { target: { value: 'c1' } });
    fireEvent.change(screen.getByPlaceholderText('Descrição opcional...'), {
      target: { value: 'Novo' },
    });
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          centroLucroId: 'c1',
          descricao: 'Novo',
          ano: new Date().getFullYear(),
        }),
      ),
    );
  });

  it('nao envia sem centro de lucro', async () => {
    const onSubmit = vi.fn();
    render(
      <>
        <OrcamentoFormBody formId="orc" data={null} readOnly={false} onSubmit={onSubmit} />
        {submit('orc')}
      </>,
    );
    fireEvent.click(screen.getByText('salvar'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('na edicao mostra os itens do orcamento abaixo do cabecalho', () => {
    render(<OrcamentoFormBody formId="orc" data={ORCAMENTO} readOnly={false} onSubmit={vi.fn()} />);
    expect(screen.getByText('itens de o1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Plano anual')).toBeInTheDocument();
  });
});

describe('ContaPagarFormBody', () => {
  beforeEach(() => vi.clearAllMocks());

  it('em somente leitura nao envia', async () => {
    const onSubmit = vi.fn();
    render(
      <>
        <ContaPagarFormBody formId="cp" data={null} readOnly onSubmit={onSubmit} />
        {submit('cp')}
      </>,
    );
    fireEvent.click(screen.getByText('salvar'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
