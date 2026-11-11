'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { X, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { getNavItems, flattenNavLinks } from './nav-config';
import { getRouteTitle } from './AppBreadcrumb';
import {
  EMPTY_TABS_STATE,
  closeTabs,
  moveTab,
  openTab,
  parseTabsState,
  resolveTabKey,
  updateTabHref,
  type ModuleTab,
  type ModuleTabsState,
} from '@/lib/module-tabs';

const STORAGE_PREFIX = 'kreato_module_tabs:';
const FALLBACK_HREF = '/dashboard';

function readStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, state: ModuleTabsState) {
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode / quota) — tabs simply aren't persisted
  }
}

function currentHref(): string {
  return window.location.pathname + window.location.search;
}

// ─── Context ────────────────────────────────────────────────────────────────

interface ModuleTabsContextValue {
  tabs: ModuleTab[];
  activeKey: string | null;
  getLabel: (key: string) => string;
  getIcon: (key: string) => ElementType;
  activate: (key: string) => void;
  close: (keys: string[]) => void;
  move: (key: string, toIndex: number) => void;
  /** Href for a sidebar link: reopens the module where the user left it, if its tab is open. */
  resolveHref: (path: string) => string;
  /** Saves the current URL into the active tab (call before navigating away). */
  captureActive: () => void;
}

const ModuleTabsContext = createContext<ModuleTabsContextValue | null>(null);

export function useModuleTabs(): ModuleTabsContextValue | null {
  return useContext(ModuleTabsContext);
}

export function ModuleTabsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  const [state, setState] = useState<ModuleTabsState>(EMPTY_TABS_STATE);
  const hydratedFor = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const storageKey = !isLoading && user?.id ? STORAGE_PREFIX + user.id : null;

  // getNavItems(true) is a superset (includes the global-admin entries).
  const navLinks = useMemo(() => flattenNavLinks(getNavItems(true, t)), [t]);
  const modulePaths = useMemo(() => navLinks.map((l) => l.path), [navLinks]);
  const linkByPath = useMemo(() => new Map(navLinks.map((l) => [l.path, l])), [navLinks]);

  // Hydrate from sessionStorage once per user, then open/activate the tab of each visited route.
  useEffect(() => {
    if (!storageKey) return;
    const key = resolveTabKey(pathname, modulePaths);
    const href = currentHref();

    if (hydratedFor.current !== storageKey) {
      hydratedFor.current = storageKey;
      const stored = parseTabsState(readStorage(storageKey));
      setState(key ? openTab(stored, key, href) : stored);
    } else if (key) {
      setState((prev) => openTab(prev, key, href));
    }
  }, [pathname, storageKey, modulePaths]);

  useEffect(() => {
    if (storageKey && hydratedFor.current === storageKey) writeStorage(storageKey, state);
  }, [state, storageKey]);

  const captureActive = useCallback(() => {
    const { activeKey } = stateRef.current;
    if (!activeKey) return;
    if (resolveTabKey(window.location.pathname, modulePaths) !== activeKey) return;
    setState((prev) => updateTabHref(prev, activeKey, currentHref()));
  }, [modulePaths]);

  const activate = useCallback(
    (key: string) => {
      const tab = stateRef.current.tabs.find((tb) => tb.key === key);
      if (!tab || key === stateRef.current.activeKey) return;
      captureActive();
      router.push(tab.href);
    },
    [captureActive, router],
  );

  const close = useCallback(
    (keys: string[]) => {
      captureActive();
      const result = closeTabs(stateRef.current, keys);
      if (!result.closedActive) {
        setState(result.state);
        return;
      }
      if (result.nextHref) {
        setState(result.state);
        router.push(result.nextHref);
        return;
      }
      // Every tab was closed: fall back to the dashboard (opened as a fresh tab).
      const dashKey = resolveTabKey(FALLBACK_HREF, modulePaths) ?? FALLBACK_HREF;
      setState(openTab(result.state, dashKey, FALLBACK_HREF));
      if (window.location.pathname !== FALLBACK_HREF) router.push(FALLBACK_HREF);
    },
    [captureActive, modulePaths, router],
  );

  const move = useCallback((key: string, toIndex: number) => {
    setState((prev) => moveTab(prev, key, toIndex));
  }, []);

  const resolveHref = useCallback(
    (path: string) => {
      const tab = state.tabs.find((tb) => tb.key === path);
      return tab && state.activeKey !== path ? tab.href : path;
    },
    [state],
  );

  const getLabel = useCallback(
    (key: string) => linkByPath.get(key)?.label ?? getRouteTitle(key),
    [linkByPath],
  );

  const getIcon = useCallback(
    (key: string) => linkByPath.get(key)?.icon ?? LayoutGrid,
    [linkByPath],
  );

  const value = useMemo<ModuleTabsContextValue>(
    () => ({
      tabs: state.tabs,
      activeKey: state.activeKey,
      getLabel,
      getIcon,
      activate,
      close,
      move,
      resolveHref,
      captureActive,
    }),
    [state, getLabel, getIcon, activate, close, move, resolveHref, captureActive],
  );

  return <ModuleTabsContext.Provider value={value}>{children}</ModuleTabsContext.Provider>;
}

// ─── Tab bar ────────────────────────────────────────────────────────────────

export function ModuleTabsBar() {
  const ctx = useModuleTabs();
  const { t } = useLanguage();
  const activeRef = useRef<HTMLDivElement | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);

  const activeKey = ctx?.activeKey;
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [activeKey]);

  if (!ctx || ctx.tabs.length === 0) return null;
  const { tabs, getLabel, getIcon, close, move, captureActive } = ctx;

  return (
    <div className="flex h-8 shrink-0 items-end border-b bg-muted/40 px-1">
      <div
        role="tablist"
        aria-label={t('tabs.openModules')}
        className="flex h-full min-w-0 flex-1 items-end gap-px overflow-x-auto overflow-y-hidden [scrollbar-width:thin]"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeKey;
          const label = getLabel(tab.key);
          const Icon = getIcon(tab.key);
          const others = tabs.filter((o) => o.key !== tab.key).map((o) => o.key);
          const toRight = tabs.slice(index + 1).map((o) => o.key);

          return (
            <ContextMenu key={tab.key}>
              <ContextMenuTrigger asChild>
                <div
                  ref={isActive ? activeRef : undefined}
                  role="presentation"
                  draggable
                  onDragStart={(e) => {
                    setDragKey(tab.key);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    if (dragKey && dragKey !== tab.key) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragKey) move(dragKey, index);
                    setDragKey(null);
                  }}
                  onDragEnd={() => setDragKey(null)}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      close([tab.key]);
                    }
                  }}
                  className={cn(
                    'group relative flex h-7 max-w-[220px] shrink-0 items-center gap-1 rounded-t-md border border-b-0 pl-2.5 pr-1 text-xs transition-colors',
                    isActive
                      ? 'border-border bg-background text-foreground shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-md before:bg-primary'
                      : 'border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground',
                    dragKey === tab.key && 'opacity-50',
                  )}
                >
                  <Link
                    href={tab.href}
                    role="tab"
                    aria-selected={isActive}
                    title={label}
                    draggable={false}
                    onClick={(e) => {
                      if (isActive || e.metaKey || e.ctrlKey || e.shiftKey) return;
                      captureActive();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Delete') {
                        e.preventDefault();
                        close([tab.key]);
                      }
                    }}
                    className="flex min-w-0 items-center gap-1.5 py-1 outline-none focus-visible:underline"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`${t('tabs.close')} ${label}`}
                    title={t('tabs.close')}
                    onClick={() => close([tab.key])}
                    className={cn(
                      'ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm hover:bg-muted-foreground/20',
                      isActive
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onSelect={() => close([tab.key])}>
                  {t('tabs.close')}
                </ContextMenuItem>
                <ContextMenuItem disabled={others.length === 0} onSelect={() => close(others)}>
                  {t('tabs.closeOthers')}
                </ContextMenuItem>
                <ContextMenuItem disabled={toRight.length === 0} onSelect={() => close(toRight)}>
                  {t('tabs.closeRight')}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => close(tabs.map((o) => o.key))}>
                  {t('tabs.closeAll')}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>
    </div>
  );
}
