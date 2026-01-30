import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!enabled || !session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any).from(table).select(select);

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setData((result as T[]) || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [table, select, orderBy?.column, orderBy?.ascending, filter?.column, filter?.value, enabled, session, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (item: Record<string, unknown>): Promise<T | null> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: insertError } = await (supabase as any)
        .from(table)
        .insert(item)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newItem = result as T;
      setData((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error(`Error creating ${table}:`, err);
      toast({
        title: 'Erro',
        description: `Erro ao criar: ${(err as Error).message}`,
        variant: 'destructive',
      });
      return null;
    }
  }, [table, toast]);

  const update = useCallback(async (id: string, item: Record<string, unknown>): Promise<T | null> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: updateError } = await (supabase as any)
        .from(table)
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedItem = result as T;
      setData((prev) => prev.map((i) => (i.id === id ? updatedItem : i)));
      return updatedItem;
    } catch (err) {
      console.error(`Error updating ${table}:`, err);
      toast({
        title: 'Erro',
        description: `Erro ao atualizar: ${(err as Error).message}`,
        variant: 'destructive',
      });
      return null;
    }
  }, [table, toast]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setData((prev) => prev.filter((i) => i.id !== id));
      return true;
    } catch (err) {
      console.error(`Error deleting ${table}:`, err);
      toast({
        title: 'Erro',
        description: `Erro ao excluir: ${(err as Error).message}`,
        variant: 'destructive',
      });
      return false;
    }
  }, [table, toast]);

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
