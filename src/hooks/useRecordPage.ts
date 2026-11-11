import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

export interface UseRecordPageOptions<TRecord, TInput> {
  /** Id of the record being edited; undefined when creating. */
  id?: string;
  load: (id: string) => Promise<TRecord>;
  save: (input: TInput) => Promise<unknown>;
  /** Called after a successful save (usually: go back to the list). */
  onSaved?: () => void;
  /** When true, submit is ignored. */
  readOnly?: boolean;
  messages?: { created?: string; updated?: string };
}

export interface UseRecordPageResult<TRecord, TInput> {
  isEditing: boolean;
  /** The record as loaded from the API (null when creating or not loaded yet). */
  record: TRecord | null;
  isLoading: boolean;
  loadError: string | null;
  isSubmitting: boolean;
  /** Saves `input` with success/error toasts; resolves to whether it was saved. */
  submit: (input: TInput) => Promise<boolean>;
}

/**
 * Loading and saving of a record shown on a form page, without owning the form values.
 * Used directly by forms that keep their own field state (`RecordFormPage`) and by
 * `useRecordForm`, which adds the field state on top.
 */
export function useRecordPage<TRecord, TInput>({
  id,
  load,
  save,
  onSaved,
  readOnly = false,
  messages,
}: UseRecordPageOptions<TRecord, TInput>): UseRecordPageResult<TRecord, TInput> {
  const { toast } = useToast();
  const { t } = useLanguage();
  const isEditing = !!id;

  const [record, setRecord] = useState<TRecord | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep the latest loader without re-triggering the load effect on every render.
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!id) {
      setRecord(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    loadRef
      .current(id)
      .then((loaded) => {
        if (!cancelled) setRecord(loaded);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Handled (not-found state); warn keeps the Next.js dev overlay for real errors only.
        console.warn('Error loading record:', error);
        setLoadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const submit = useCallback(
    async (input: TInput) => {
      if (readOnly) return false;

      setIsSubmitting(true);
      try {
        await save(input);
        toast({
          title: t('common.success'),
          description: isEditing
            ? (messages?.updated ?? 'Registro atualizado!')
            : (messages?.created ?? 'Registro cadastrado!'),
        });
        onSaved?.();
        return true;
      } catch (error) {
        // Handled (error toast); warn keeps the Next.js dev overlay for real errors only.
        console.warn('Error saving record:', error);
        toast({
          title: t('common.error'),
          description: `Erro ao salvar: ${error instanceof Error ? error.message : String(error)}`,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEditing, messages?.created, messages?.updated, onSaved, readOnly, save, t, toast],
  );

  return { isEditing, record, isLoading, loadError, isSubmitting, submit };
}
