import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecordForm } from './useRecordForm';

const toast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

type Item = { id: string; nome: string };
type Input = { id?: string; nome: string };

const EMPTY: Input = { nome: '' };
const toInput = (item: Item): Input => ({ id: item.id, nome: item.nome });

describe('useRecordForm', () => {
  beforeEach(() => {
    toast.mockClear();
  });

  it('inicia vazio e sem carregar na inclusao', () => {
    const load = vi.fn();
    const { result } = renderHook(() =>
      useRecordForm<Item, Input>({ empty: EMPTY, load, toInput, save: vi.fn() }),
    );

    expect(result.current.isEditing).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.formData).toEqual(EMPTY);
    expect(load).not.toHaveBeenCalled();
  });

  it('carrega o registro na edicao', async () => {
    const load = vi.fn().mockResolvedValue({ id: '1', nome: 'Maria' });
    const { result } = renderHook(() =>
      useRecordForm<Item, Input>({ id: '1', empty: EMPTY, load, toInput, save: vi.fn() }),
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(load).toHaveBeenCalledWith('1');
    expect(result.current.record).toEqual({ id: '1', nome: 'Maria' });
    expect(result.current.formData).toEqual({ id: '1', nome: 'Maria' });
    expect(result.current.loadError).toBeNull();
  });

  it('expoe o erro quando o registro nao carrega', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi.fn().mockRejectedValue(new Error('Pessoa não encontrada'));
    const { result } = renderHook(() =>
      useRecordForm<Item, Input>({ id: 'x', empty: EMPTY, load, toInput, save: vi.fn() }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe('Pessoa não encontrada');
  });

  it('atualiza um campo', () => {
    const { result } = renderHook(() =>
      useRecordForm<Item, Input>({ empty: EMPTY, load: vi.fn(), toInput, save: vi.fn() }),
    );

    act(() => result.current.update('nome', 'Joao'));
    expect(result.current.formData.nome).toBe('Joao');
  });

  it('salva, avisa e chama onSaved', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useRecordForm<Item, Input>({
        empty: EMPTY,
        load: vi.fn(),
        toInput,
        save,
        onSaved,
        messages: { created: 'Criado!' },
      }),
    );

    act(() => result.current.update('nome', 'Joao'));
    await act(() => result.current.handleSubmit());

    expect(save).toHaveBeenCalledWith({ nome: 'Joao' });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Criado!' }));
    expect(onSaved).toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('nao salva em somente leitura', async () => {
    const save = vi.fn();
    const { result } = renderHook(() =>
      useRecordForm<Item, Input>({ empty: EMPTY, load: vi.fn(), toInput, save, readOnly: true }),
    );

    await act(() => result.current.handleSubmit());
    expect(save).not.toHaveBeenCalled();
  });

  it('mostra erro e permanece na pagina quando o salvamento falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const save = vi.fn().mockRejectedValue(new Error('falhou'));
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useRecordForm<Item, Input>({ empty: EMPTY, load: vi.fn(), toInput, save, onSaved }),
    );

    await act(() => result.current.handleSubmit());

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive', description: 'Erro ao salvar: falhou' }),
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });
});
