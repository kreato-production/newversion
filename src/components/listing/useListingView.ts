import { useState } from 'react';

export type ViewMode = 'list' | 'cards' | 'detail' | 'kanban';

export interface ColumnConfig {
  key: string;
  label: string;
  /** If true, always visible — not shown in ColumnSelector */
  required?: boolean;
  /** Default: true */
  defaultVisible?: boolean;
}

interface UseListingViewOptions {
  storageKey: string;
  defaultMode?: ViewMode;
  columns: ColumnConfig[];
}

interface UseListingViewReturn {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  visibleColumnKeys: string[];
  toggleColumn: (key: string) => void;
  isColumnVisible: (key: string) => boolean;
  resetColumns: () => void;
  optionalColumns: ColumnConfig[];
}

function getDefaultVisible(columns: ColumnConfig[]): string[] {
  return columns.filter((c) => c.defaultVisible !== false).map((c) => c.key);
}

export function useListingView({
  storageKey,
  defaultMode = 'list',
  columns,
}: UseListingViewOptions): UseListingViewReturn {
  const modeKey = `${storageKey}_view_mode`;
  const colsKey = `${storageKey}_visible_cols`;

  const allKeys = columns.map((c) => c.key);
  const defaultVisible = getDefaultVisible(columns);

  const [mode, setModeState] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(modeKey);
      if (stored === 'list' || stored === 'cards' || stored === 'detail' || stored === 'kanban')
        return stored;
    } catch (_e) {
      /* localStorage unavailable */
    }
    return defaultMode;
  });

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(colsKey);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        const valid = parsed.filter((k) => allKeys.includes(k));
        if (valid.length > 0) return valid;
      }
    } catch (_e) {
      /* localStorage unavailable */
    }
    return defaultVisible;
  });

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(modeKey, newMode);
    } catch (_e) {
      /* localStorage unavailable */
    }
  };

  const toggleColumn = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (col?.required) return;

    setVisibleColumnKeys((prev) => {
      const optionalVisible = prev.filter((k) => {
        const c = columns.find((cc) => cc.key === k);
        return c && !c.required;
      });
      // Prevent hiding last optional column
      if (prev.includes(key) && optionalVisible.length <= 1) return prev;

      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];

      try {
        localStorage.setItem(colsKey, JSON.stringify(next));
      } catch (_e) {
        /* localStorage unavailable */
      }
      return next;
    });
  };

  const isColumnVisible = (key: string) => visibleColumnKeys.includes(key);

  const resetColumns = () => {
    setVisibleColumnKeys(defaultVisible);
    try {
      localStorage.removeItem(colsKey);
    } catch (_e) {
      /* localStorage unavailable */
    }
  };

  const optionalColumns = columns.filter((c) => !c.required);

  return {
    mode,
    setMode,
    visibleColumnKeys,
    toggleColumn,
    isColumnVisible,
    resetColumns,
    optionalColumns,
  };
}
