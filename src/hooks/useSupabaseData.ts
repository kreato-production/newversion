import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseSupabaseDataOptions {
  table: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: { column: string; value: string };
  enabled?: boolean;
}

interface UseSupabaseDataReturn<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (item: Record<string, unknown>) => Promise<T | null>;
  update: (id: string, item: Record<string, unknown>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
}

export function useSupabaseData<T extends { id: string }>({
  table,
  select = '*',
  orderBy,
  filter,
  enabled = true,
}: UseSupabaseDataOptions): UseSupabaseDataReturn<T> {
  const [data] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const error = useMemo(
    () =>
      new Error(
        'useSupabaseData foi descontinuado. Migre este fluxo para os repositórios da API local.',
      ),
    [],
  );

  const fetchData = useCallback(async () => {
    if (enabled) {
      console.warn('useSupabaseData foi chamado para a tabela legado', {
        table,
        select,
        orderBy,
        filter,
      });
    }
    setIsLoading(false);
  }, [enabled, filter, orderBy, select, table]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (_item: Record<string, unknown>): Promise<T | null> => {
      throw error;
    },
    [error],
  );

  const update = useCallback(
    async (_id: string, _item: Record<string, unknown>): Promise<T | null> => {
      throw error;
    },
    [error],
  );

  const remove = useCallback(
    async (_id: string): Promise<boolean> => {
      throw error;
    },
    [error],
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    create,
    update,
    remove,
  };
}

// Helper to clear all kreato localStorage data (for security on logout)
export function clearKreatoLocalStorage(): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('kreato_')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log(`Cleared ${keysToRemove.length} localStorage items for security`);
}
