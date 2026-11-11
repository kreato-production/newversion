import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ModalNavigationProps } from '@/components/shared/ModalNavigation';

/**
 * Route configuration of a cadastro rendered as form pages:
 *   `${basePath}`          → list
 *   `${basePath}/novo`     → create
 *   `${basePath}/${id}`    → edit / view
 */
export interface RecordRouteConfig {
  basePath: string;
  /** sessionStorage key holding the ordered ids of the list the user opened a record from. */
  navStorageKey: string;
}

export const NEW_RECORD_SEGMENT = 'novo';

export function recordPath(config: RecordRouteConfig, id?: string): string {
  return `${config.basePath}/${id ?? NEW_RECORD_SEGMENT}`;
}

/** Parent of a path: `/recursos/cargos/novo` → `/recursos/cargos`. */
export function parentPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.slice(0, trimmed.lastIndexOf('/')) || '/';
}

export function saveRecordNavigation(config: RecordRouteConfig, ids: string[]): void {
  try {
    sessionStorage.setItem(config.navStorageKey, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode, blocked): the form just hides prev/next.
  }
}

export function readRecordNavigation(config: RecordRouteConfig): string[] {
  try {
    const raw = sessionStorage.getItem(config.navStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * List side: opens the form pages. `openRecord` remembers the order of the list
 * currently shown (filtered/sorted) so the form can offer previous/next.
 */
export function useRecordList(config: RecordRouteConfig) {
  const router = useRouter();

  const openNew = useCallback(() => {
    router.push(recordPath(config));
  }, [router, config]);

  const openRecord = useCallback(
    (id: string, orderedIds: string[]) => {
      saveRecordNavigation(config, orderedIds);
      router.push(recordPath(config, id));
    },
    [router, config],
  );

  return { openNew, openRecord };
}

/**
 * Form side: back-to-list and previous/next navigation for the record `currentId`.
 * `navigation` is undefined when creating, or when the record was opened directly by URL.
 */
export function useRecordNavigation(config: RecordRouteConfig, currentId?: string) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);

  // sessionStorage only exists in the browser: read it after mount.
  useEffect(() => {
    setIds(readRecordNavigation(config));
  }, [config]);

  const goBack = useCallback(() => {
    router.push(config.basePath);
  }, [router, config]);

  const navigation = useMemo<ModalNavigationProps | undefined>(() => {
    const index = currentId ? ids.indexOf(currentId) : -1;
    if (index < 0) return undefined;

    const goTo = (id: string | undefined) => {
      if (id) router.replace(recordPath(config, id));
    };

    return {
      currentIndex: index,
      total: ids.length,
      onPrevious: () => goTo(ids[index - 1]),
      onNext: () => goTo(ids[index + 1]),
    };
  }, [config, currentId, ids, router]);

  return { goBack, navigation };
}
