import { describe, expect, it } from 'vitest';
import {
  EMPTY_TABS_STATE,
  MAX_TABS,
  closeTabs,
  moveTab,
  openTab,
  parseTabsState,
  resolveTabKey,
  updateTabHref,
  type ModuleTabsState,
} from './module-tabs';

const PATHS = ['/dashboard', '/recursos/pessoas', '/eventos', '/eventos/parametrizacoes/servicos'];

const state = (...keys: string[]): ModuleTabsState => ({
  tabs: keys.map((key) => ({ key, href: key })),
  activeKey: keys[keys.length - 1] ?? null,
});

describe('resolveTabKey', () => {
  it('groups list, create and edit routes of a module under one key', () => {
    expect(resolveTabKey('/recursos/pessoas', PATHS)).toBe('/recursos/pessoas');
    expect(resolveTabKey('/recursos/pessoas/novo', PATHS)).toBe('/recursos/pessoas');
    expect(resolveTabKey('/recursos/pessoas/abc-123/', PATHS)).toBe('/recursos/pessoas');
  });

  it('prefers the longest matching module path', () => {
    expect(resolveTabKey('/eventos/parametrizacoes/servicos/1', PATHS)).toBe(
      '/eventos/parametrizacoes/servicos',
    );
    expect(resolveTabKey('/eventos/123', PATHS)).toBe('/eventos');
  });

  it('does not match partial segments', () => {
    expect(resolveTabKey('/recursos/pessoas-x', PATHS)).toBe('/recursos/pessoas-x');
  });

  it('uses the pathname for unknown routes and ignores the root', () => {
    expect(resolveTabKey('/sobre', PATHS)).toBe('/sobre');
    expect(resolveTabKey('/', PATHS)).toBeNull();
  });
});

describe('openTab', () => {
  it('appends a new tab and activates it', () => {
    const next = openTab(state('/dashboard'), '/eventos', '/eventos');
    expect(next.tabs.map((t) => t.key)).toEqual(['/dashboard', '/eventos']);
    expect(next.activeKey).toBe('/eventos');
  });

  it('reuses an existing tab, updating its href without reordering', () => {
    const next = openTab(state('/dashboard', '/eventos'), '/dashboard', '/dashboard?x=1');
    expect(next.tabs).toEqual([
      { key: '/dashboard', href: '/dashboard?x=1' },
      { key: '/eventos', href: '/eventos' },
    ]);
    expect(next.activeKey).toBe('/dashboard');
  });

  it('returns the same object when nothing changes', () => {
    const s = state('/dashboard');
    expect(openTab(s, '/dashboard', '/dashboard')).toBe(s);
  });

  it('drops the oldest inactive tab beyond MAX_TABS', () => {
    let s = EMPTY_TABS_STATE;
    for (let i = 0; i < MAX_TABS + 1; i++) s = openTab(s, `/m${i}`, `/m${i}`);
    expect(s.tabs).toHaveLength(MAX_TABS);
    expect(s.tabs[0].key).toBe('/m1');
    expect(s.activeKey).toBe(`/m${MAX_TABS}`);
  });
});

describe('updateTabHref', () => {
  it('changes only the href of the given tab', () => {
    const next = updateTabHref(state('/a', '/b'), '/a', '/a/1');
    expect(next.tabs[0].href).toBe('/a/1');
    expect(next.activeKey).toBe('/b');
  });
});

describe('closeTabs', () => {
  it('closing an inactive tab keeps the active one and needs no navigation', () => {
    const r = closeTabs(state('/a', '/b', '/c'), ['/a']);
    expect(r.state.tabs.map((t) => t.key)).toEqual(['/b', '/c']);
    expect(r.state.activeKey).toBe('/c');
    expect(r.nextHref).toBeNull();
    expect(r.closedActive).toBe(false);
  });

  it('activates the right neighbour when the active tab is closed', () => {
    const s = { ...state('/a', '/b', '/c'), activeKey: '/b' };
    const r = closeTabs(s, ['/b']);
    expect(r.state.activeKey).toBe('/c');
    expect(r.nextHref).toBe('/c');
  });

  it('falls back to the left neighbour', () => {
    const r = closeTabs(state('/a', '/b', '/c'), ['/c']);
    expect(r.state.activeKey).toBe('/b');
    expect(r.nextHref).toBe('/b');
  });

  it('closing all tabs leaves nothing active', () => {
    const r = closeTabs(state('/a', '/b'), ['/a', '/b']);
    expect(r.state).toEqual({ tabs: [], activeKey: null });
    expect(r.closedActive).toBe(true);
    expect(r.nextHref).toBeNull();
  });
});

describe('moveTab', () => {
  it('reorders tabs', () => {
    expect(moveTab(state('/a', '/b', '/c'), '/c', 0).tabs.map((t) => t.key)).toEqual([
      '/c',
      '/a',
      '/b',
    ]);
  });
});

describe('parseTabsState', () => {
  it('returns empty state for invalid input', () => {
    expect(parseTabsState(null)).toEqual(EMPTY_TABS_STATE);
    expect(parseTabsState('not json')).toEqual(EMPTY_TABS_STATE);
  });

  it('drops malformed tabs and external hrefs', () => {
    const raw = JSON.stringify({
      tabs: [
        { key: '/a', href: '/a/1' },
        { key: '/b', href: '//evil.com' },
        { key: '/c', href: 'https://evil.com' },
        { key: 1, href: '/x' },
      ],
      activeKey: '/b',
    });
    expect(parseTabsState(raw)).toEqual({ tabs: [{ key: '/a', href: '/a/1' }], activeKey: null });
  });
});
