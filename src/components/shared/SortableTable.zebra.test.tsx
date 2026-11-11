import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SortableTable, type Column } from './SortableTable';
import { stripeColorOf } from '@/data/listStripeColors';

type Row = { id: string; nome: string };
const rows: Row[] = [
  { id: '1', nome: 'A' },
  { id: '2', nome: 'B' },
  { id: '3', nome: 'C' },
];
const columns: Column<Row>[] = [{ key: 'nome', label: 'Nome' }];

const body = () => screen.getByText('A').closest('tbody') as HTMLElement;

describe('SortableTable — lista zebrada', () => {
  it('sem cor: linhas sem zebra', () => {
    render(<SortableTable data={rows} columns={columns} getRowKey={(row) => row.id} />);
    expect(body()).not.toHaveClass('list-zebra');
  });

  it('com cor: o corpo da tabela intercala as linhas com a cor pastel escolhida', () => {
    render(
      <SortableTable
        data={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        stripeColor={stripeColorOf({ zebrado: true, corZebra: 'lilas' })}
      />,
    );
    expect(body()).toHaveClass('list-zebra');
    expect(body().style.getPropertyValue('--list-stripe')).toBe('#F1E8F8');
  });

  it('stripeColorOf: sem zebra não há cor; cor desconhecida usa a padrão', () => {
    expect(stripeColorOf({ zebrado: false, corZebra: 'rosa' })).toBeNull();
    expect(stripeColorOf({ zebrado: true, corZebra: 'inexistente' })).toBe('#E3EEFB');
  });
});
