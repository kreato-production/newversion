import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isEmptyFieldValue, useFormFieldConfig } from './useFormFieldConfig';

const toast = vi.hoisted(() => vi.fn());
const campos = vi.hoisted(() => ({
  value: {} as Record<string, { tipoValidacao: string | null; tamanho: null; posicao: null }>,
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/modules/admin/admin-config.api', () => ({
  ApiAdminConfigRepository: class {
    getFormularioCamposFull = () => Promise.resolve(campos.value);
  },
}));

const cfg = (tipoValidacao: string | null) => ({
  tipoValidacao,
  tamanho: null as null,
  posicao: null as null,
});

async function renderConfig(formularioId = 'pessoa') {
  const hook = renderHook(() => useFormFieldConfig(formularioId));
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe('useFormFieldConfig', () => {
  beforeEach(() => {
    toast.mockClear();
    campos.value = {};
  });

  it('considera vazios texto em branco, lista vazia, null e NaN', () => {
    expect(isEmptyFieldValue('  ')).toBe(true);
    expect(isEmptyFieldValue([])).toBe(true);
    expect(isEmptyFieldValue(null)).toBe(true);
    expect(isEmptyFieldValue(undefined)).toBe(true);
    expect(isEmptyFieldValue(Number.NaN)).toBe(true);
    expect(isEmptyFieldValue('a')).toBe(false);
    expect(isEmptyFieldValue(0)).toBe(false);
    expect(isEmptyFieldValue([1])).toBe(false);
  });

  it('valida so os campos informados, com os rotulos do formsRegistry', async () => {
    campos.value = {
      nome: cfg('obrigatorio'),
      documento: cfg('obrigatorio'),
      email: cfg('sugerido'),
      cidade: cfg('obrigatorio'),
    };
    const { result } = await renderConfig();

    // "cidade" is required but not part of the values: the form does not have it, so it is skipped.
    expect(result.current.validateRequired({ nome: 'Ana', documento: '', email: '' })).toEqual([
      'CPF/Documento',
    ]);
    expect(result.current.validateRequired({ documento: '' }, { documento: 'CPF' })).toEqual([
      'CPF',
    ]);
  });

  it('validate mostra o toast e devolve false quando falta campo', async () => {
    campos.value = { nome: cfg('obrigatorio') };
    const { result } = await renderConfig();

    let ok = true;
    act(() => {
      ok = result.current.validate({ nome: ' ' });
    });
    expect(ok).toBe(false);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Preencha os campos obrigatórios: Nome' }),
    );

    toast.mockClear();
    expect(result.current.validate({ nome: 'Ana' })).toBe(true);
    expect(toast).not.toHaveBeenCalled();
  });

  it('getAsterisk combina a configuracao com os campos sempre obrigatorios', async () => {
    campos.value = { nome: cfg('obrigatorio'), email: cfg('sugerido') };
    const { result } = await renderConfig();

    expect(result.current.getAsterisk('nome')).toBe('required');
    expect(result.current.getAsterisk('email')).toBe('suggested');
    expect(result.current.getAsterisk('sobrenome')).toBeNull();
    expect(result.current.getAsterisk('sobrenome', true)).toBe('required');
  });
});
