import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  parentPath,
  readRecordNavigation,
  recordPath,
  saveRecordNavigation,
  useRecordList,
  useRecordNavigation,
  type RecordRouteConfig,
} from './useRecordNavigation';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

const CONFIG: RecordRouteConfig = {
  basePath: '/recursos/pessoas',
  navStorageKey: 'test_nav_ids',
};

describe('useRecordNavigation helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
    push.mockClear();
    replace.mockClear();
  });

  it('monta os caminhos de inclusao e edicao', () => {
    expect(recordPath(CONFIG)).toBe('/recursos/pessoas/novo');
    expect(recordPath(CONFIG, 'abc')).toBe('/recursos/pessoas/abc');
  });

  it('calcula o caminho da lista a partir da rota do formulario', () => {
    expect(parentPath('/recursos/cargos/novo')).toBe('/recursos/cargos');
    expect(parentPath('/eventos/parametrizacoes/servicos/abc/')).toBe(
      '/eventos/parametrizacoes/servicos',
    );
  });

  it('grava e le a ordem da lista', () => {
    saveRecordNavigation(CONFIG, ['a', 'b']);
    expect(readRecordNavigation(CONFIG)).toEqual(['a', 'b']);
  });

  it('ignora conteudo invalido no storage', () => {
    sessionStorage.setItem(CONFIG.navStorageKey, '{nao-json');
    expect(readRecordNavigation(CONFIG)).toEqual([]);

    sessionStorage.setItem(CONFIG.navStorageKey, JSON.stringify(['a', 1, null, 'b']));
    expect(readRecordNavigation(CONFIG)).toEqual(['a', 'b']);
  });
});

describe('useRecordList', () => {
  beforeEach(() => {
    sessionStorage.clear();
    push.mockClear();
  });

  it('abre a inclusao', () => {
    const { result } = renderHook(() => useRecordList(CONFIG));
    result.current.openNew();
    expect(push).toHaveBeenCalledWith('/recursos/pessoas/novo');
  });

  it('abre o registro guardando a ordem da lista', () => {
    const { result } = renderHook(() => useRecordList(CONFIG));
    result.current.openRecord('b', ['a', 'b', 'c']);

    expect(push).toHaveBeenCalledWith('/recursos/pessoas/b');
    expect(readRecordNavigation(CONFIG)).toEqual(['a', 'b', 'c']);
  });
});

describe('useRecordNavigation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    push.mockClear();
    replace.mockClear();
  });

  it('volta para a lista', () => {
    const { result } = renderHook(() => useRecordNavigation(CONFIG, 'a'));
    result.current.goBack();
    expect(push).toHaveBeenCalledWith('/recursos/pessoas');
  });

  it('nao oferece navegacao na inclusao', () => {
    saveRecordNavigation(CONFIG, ['a', 'b']);
    const { result } = renderHook(() => useRecordNavigation(CONFIG));
    expect(result.current.navigation).toBeUndefined();
  });

  it('nao oferece navegacao quando o registro nao veio da lista', () => {
    saveRecordNavigation(CONFIG, ['a', 'b']);
    const { result } = renderHook(() => useRecordNavigation(CONFIG, 'z'));
    expect(result.current.navigation).toBeUndefined();
  });

  it('navega para o registro anterior e o proximo', () => {
    saveRecordNavigation(CONFIG, ['a', 'b', 'c']);
    const { result } = renderHook(() => useRecordNavigation(CONFIG, 'b'));

    expect(result.current.navigation).toMatchObject({ currentIndex: 1, total: 3 });

    act(() => result.current.navigation?.onPrevious());
    expect(replace).toHaveBeenLastCalledWith('/recursos/pessoas/a');

    act(() => result.current.navigation?.onNext());
    expect(replace).toHaveBeenLastCalledWith('/recursos/pessoas/c');
  });

  it('nao navega alem dos limites da lista', () => {
    saveRecordNavigation(CONFIG, ['a', 'b']);
    const { result } = renderHook(() => useRecordNavigation(CONFIG, 'a'));

    act(() => result.current.navigation?.onPrevious());
    expect(replace).not.toHaveBeenCalled();
  });
});
