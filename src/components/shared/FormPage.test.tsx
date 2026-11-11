import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormPage, type FormPageProps } from './FormPage';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ({ 'common.back': 'Voltar', 'common.cancel': 'Cancelar', 'common.save': 'Salvar' })[key] ??
      key,
  }),
}));

function renderPage(props: Partial<FormPageProps> = {}) {
  const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const onBack = vi.fn();
  render(
    <FormPage title="Nova Pessoa" formId="test-form" onBack={onBack} isEditing={false} {...props}>
      <form id="test-form" onSubmit={onSubmit}>
        <input aria-label="nome" />
      </form>
    </FormPage>,
  );
  return { onSubmit, onBack };
}

describe('FormPage', () => {
  it('mostra titulo, formulario e botao de cadastrar', () => {
    renderPage();

    expect(screen.getByText('Nova Pessoa')).toBeInTheDocument();
    expect(screen.getByLabelText('nome')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cadastrar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('usa Salvar na edicao', () => {
    renderPage({ isEditing: true });
    expect(screen.getByRole('button', { name: /Salvar/ })).toBeInTheDocument();
  });

  it('o botao salvar submete o formulario pelo id', () => {
    const { onSubmit } = renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/ }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('voltar e cancelar chamam onBack', () => {
    const { onBack } = renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Voltar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it('em somente leitura esconde salvar e mostra Fechar', () => {
    renderPage({ readOnly: true, isEditing: true });
    expect(screen.queryByRole('button', { name: /Salvar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('mostra carregamento no lugar do formulario', () => {
    renderPage({ isLoading: true, isEditing: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByLabelText('nome')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar/ })).toBeDisabled();
  });

  it('mostra registro nao encontrado quando o carregamento falha', () => {
    renderPage({
      isEditing: true,
      loadError: 'Pessoa não encontrada',
      notFoundTitle: 'Sem pessoa',
    });
    expect(screen.getByText('Sem pessoa')).toBeInTheDocument();
    expect(screen.getByText('Pessoa não encontrada')).toBeInTheDocument();
    expect(screen.queryByLabelText('nome')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar/ })).toBeDisabled();
  });

  it('desabilita salvar durante o envio', () => {
    renderPage({ isSubmitting: true });
    expect(screen.getByRole('button', { name: /Cadastrar/ })).toBeDisabled();
  });

  it('mostra a navegacao entre registros', () => {
    const onNext = vi.fn();
    renderPage({
      isEditing: true,
      navigation: { currentIndex: 0, total: 3, onPrevious: vi.fn(), onNext },
    });

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Próximo registro'));
    expect(onNext).toHaveBeenCalled();
  });
});
