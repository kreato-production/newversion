/**
 * Pure state helpers for the module tab bar (one tab per open module/cadastro).
 *
 * A tab is identified by the module's base path (e.g. `/recursos/pessoas`); sub-routes
 * such as `/recursos/pessoas/novo` or `/recursos/pessoas/<id>` stay inside the same tab
 * and only update its `href`, so returning to the tab reopens the exact screen the user left.
 */

export interface ModuleTab {
  /** Module base path — the tab identity. */
  key: string;
  /** Last URL (pathname + search) visited inside this module. */
  href: string;
}

export interface ModuleTabsState {
  tabs: ModuleTab[];
  activeKey: string | null;
}

export const EMPTY_TABS_STATE: ModuleTabsState = { tabs: [], activeKey: null };

/** Maximum number of simultaneously open tabs; the oldest inactive one is dropped beyond this. */
export const MAX_TABS = 20;

/** Paths that never become a tab. */
const IGNORED_PATHS = new Set(['/']);

/**
 * Resolves the tab key for a pathname: the longest known module path that is the pathname
 * itself or one of its prefixes. Unknown routes (e.g. `/sobre`, `/module/producao`) use the
 * pathname itself. Returns `null` for paths that should not open a tab.
 */
export function resolveTabKey(pathname: string, modulePaths: readonly string[]): string | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (!clean || IGNORED_PATHS.has(clean)) return null;

  let best: string | null = null;
  for (const path of modulePaths) {
    if ((clean === path || clean.startsWith(path + '/')) && (!best || path.length > best.length)) {
      best = path;
    }
  }
  return best ?? clean;
}

/** Opens (or activates) the tab for `key`, recording `href` as its current location. */
export function openTab(state: ModuleTabsState, key: string, href: string): ModuleTabsState {
  const existing = state.tabs.find((t) => t.key === key);
  if (existing) {
    if (existing.href === href && state.activeKey === key) return state;
    return {
      tabs: state.tabs.map((t) => (t.key === key ? { ...t, href } : t)),
      activeKey: key,
    };
  }

  let tabs = [...state.tabs, { key, href }];
  if (tabs.length > MAX_TABS) {
    const dropIndex = tabs.findIndex((t) => t.key !== state.activeKey && t.key !== key);
    if (dropIndex >= 0) tabs = tabs.filter((_, i) => i !== dropIndex);
  }
  return { tabs, activeKey: key };
}

/** Updates the stored location of a tab without changing which tab is active. */
export function updateTabHref(state: ModuleTabsState, key: string, href: string): ModuleTabsState {
  const existing = state.tabs.find((t) => t.key === key);
  if (!existing || existing.href === href) return state;
  return { ...state, tabs: state.tabs.map((t) => (t.key === key ? { ...t, href } : t)) };
}

/**
 * Closes the given tabs. When the active tab is closed, the neighbour to its right
 * (or else to its left) becomes active. `nextHref` is where the browser must navigate
 * to (`null` when the active tab is unchanged).
 */
export function closeTabs(
  state: ModuleTabsState,
  keys: readonly string[],
): { state: ModuleTabsState; nextHref: string | null; closedActive: boolean } {
  const toClose = new Set(keys);
  const tabs = state.tabs.filter((t) => !toClose.has(t.key));
  if (tabs.length === state.tabs.length) return { state, nextHref: null, closedActive: false };

  if (!state.activeKey || !toClose.has(state.activeKey)) {
    return { state: { ...state, tabs }, nextHref: null, closedActive: false };
  }

  const activeIndex = state.tabs.findIndex((t) => t.key === state.activeKey);
  const right = state.tabs.slice(activeIndex + 1).find((t) => !toClose.has(t.key));
  const left = [...state.tabs.slice(0, activeIndex)].reverse().find((t) => !toClose.has(t.key));
  const next = right ?? left ?? null;

  return {
    state: { tabs, activeKey: next?.key ?? null },
    nextHref: next?.href ?? null,
    closedActive: true,
  };
}

/** Moves a tab to a new index (drag-and-drop reordering). */
export function moveTab(state: ModuleTabsState, key: string, toIndex: number): ModuleTabsState {
  const from = state.tabs.findIndex((t) => t.key === key);
  if (from < 0) return state;
  const target = Math.max(0, Math.min(toIndex, state.tabs.length - 1));
  if (from === target) return state;
  const tabs = [...state.tabs];
  const [tab] = tabs.splice(from, 1);
  tabs.splice(target, 0, tab);
  return { ...state, tabs };
}

/** Parses persisted state defensively (sessionStorage content is untrusted). */
export function parseTabsState(raw: string | null): ModuleTabsState {
  if (!raw) return EMPTY_TABS_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<ModuleTabsState>;
    const tabs = Array.isArray(parsed.tabs)
      ? parsed.tabs.filter(
          (t): t is ModuleTab =>
            !!t &&
            typeof t.key === 'string' &&
            typeof t.href === 'string' &&
            t.key.startsWith('/') &&
            t.href.startsWith('/') &&
            !t.href.startsWith('//'),
        )
      : [];
    const activeKey =
      typeof parsed.activeKey === 'string' && tabs.some((t) => t.key === parsed.activeKey)
        ? parsed.activeKey
        : null;
    return { tabs: tabs.slice(0, MAX_TABS), activeKey };
  } catch {
    return EMPTY_TABS_STATE;
  }
}
