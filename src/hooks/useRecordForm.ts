import { useCallback, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useRecordPage } from '@/hooks/useRecordPage';

export interface UseRecordFormOptions<TRecord, TInput> {
  /** Id of the record being edited; undefined when creating. */
  id?: string;
  /** Initial form values for a new record. */
  empty: TInput;
  load: (id: string) => Promise<TRecord>;
  toInput: (record: TRecord) => TInput;
  save: (input: TInput) => Promise<unknown>;
  /** Called after a successful save (usually: go back to the list). */
  onSaved?: () => void;
  /** When true, submit is ignored. */
  readOnly?: boolean;
  messages?: { created?: string; updated?: string };
}

export interface UseRecordFormResult<TRecord, TInput> {
  isEditing: boolean;
  /** The record as loaded from the API (null when creating or not loaded yet). */
  record: TRecord | null;
  formData: TInput;
  setFormData: Dispatch<SetStateAction<TInput>>;
  /** Sets a single field. */
  update: <K extends keyof TInput>(key: K, value: TInput[K]) => void;
  isLoading: boolean;
  loadError: string | null;
  isSubmitting: boolean;
  handleSubmit: (event?: FormEvent) => Promise<void>;
}

/**
 * State and behaviour shared by every cadastro form page: load the record by id,
 * keep the form values, and save with success/error toasts.
 */
export function useRecordForm<TRecord, TInput>({
  id,
  empty,
  load,
  toInput,
  save,
  onSaved,
  readOnly = false,
  messages,
}: UseRecordFormOptions<TRecord, TInput>): UseRecordFormResult<TRecord, TInput> {
  const page = useRecordPage<TRecord, TInput>({ id, load, save, onSaved, readOnly, messages });
  const [formData, setFormData] = useState<TInput>(empty);

  // Reset the values when a (new) record arrives, during render rather than in an effect,
  // so the form never shows one frame of empty fields after loading.
  const [syncedRecord, setSyncedRecord] = useState<TRecord | null>(null);
  if (page.record !== syncedRecord) {
    setSyncedRecord(page.record);
    setFormData(page.record ? toInput(page.record) : empty);
  }

  const update = useCallback(<K extends keyof TInput>(key: K, value: TInput[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  }, []);

  const { submit, isSubmitting } = page;
  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isSubmitting) return;
    await submit(formData);
  };

  return {
    isEditing: page.isEditing,
    record: page.record,
    formData,
    setFormData,
    update,
    isLoading: page.isLoading,
    loadError: page.loadError,
    isSubmitting,
    handleSubmit,
  };
}
