import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiAdminConfigRepository, type FullFieldConfig } from '@/modules/admin/admin-config.api';
import {
  FORM_GRID_COLUMNS,
  formsRegistry,
  getFormLayoutDefaults,
  tamanhoToSpan,
} from '@/data/formsRegistry';
import { cn } from '@/lib/utils';

export type FieldValidationType = 'obrigatorio' | 'sugerido' | null;

export interface FieldConfig {
  campo: string;
  tipo_validacao: FieldValidationType;
}

const apiRepository = new ApiAdminConfigRepository();

/** Empty for the purpose of a required field: blank text, empty list, null/undefined, NaN. */
export function isEmptyFieldValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'number') return Number.isNaN(value);
  return false;
}

/** Current system language, or undefined outside a LanguageProvider (e.g. isolated tests). */
function useCurrentLanguage(): string | undefined {
  try {
    return useLanguage().language;
  } catch {
    return undefined;
  }
}

// Hook to fetch form field configurations for a specific form
export const useFormFieldConfig = (formularioId: string) => {
  const [fullConfigs, setFullConfigs] = useState<Record<string, FullFieldConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const language = useCurrentLanguage();

  // Labels of this form's campos in the formsRegistry (used in the validation message).
  const registryLabels = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        (formsRegistry.find((form) => form.id === formularioId)?.campos ?? []).map((item) => [
          item.campo,
          item.label,
        ]),
      ),
    [formularioId],
  );

  // Tamanho e posição padrão de cada campo (formsRegistry), quando não configurados.
  const layoutDefaults = useMemo(() => getFormLayoutDefaults(formularioId), [formularioId]);

  const fetchConfigs = useCallback(async () => {
    try {
      const configs = await apiRepository.getFormularioCamposFull(formularioId);
      setFullConfigs(configs);
    } catch (err) {
      console.error('Error fetching field configs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [formularioId]);

  useEffect(() => {
    if (formularioId) {
      fetchConfigs();
    }
  }, [formularioId, fetchConfigs]);

  // Backwards-compatible: validation type per campo
  const fieldConfigs: Record<string, FieldValidationType> = Object.fromEntries(
    Object.entries(fullConfigs).map(([campo, cfg]) => [campo, cfg.tipoValidacao]),
  );

  // Check if a field is required
  const isRequired = (campo: string): boolean => {
    return fullConfigs[campo]?.tipoValidacao === 'obrigatorio';
  };

  // Check if a field is suggested
  const isSuggested = (campo: string): boolean => {
    return fullConfigs[campo]?.tipoValidacao === 'sugerido';
  };

  /**
   * Asterisk type for a field. `alwaysRequired` marks fields the form itself requires
   * (whatever the configuration says), so they show the required asterisk too.
   */
  const getAsterisk = (campo: string, alwaysRequired = false): 'required' | 'suggested' | null => {
    if (alwaysRequired || fullConfigs[campo]?.tipoValidacao === 'obrigatorio') return 'required';
    if (fullConfigs[campo]?.tipoValidacao === 'sugerido') return 'suggested';
    return null;
  };

  /**
   * Columns (of 12) a field takes: the published Tamanho, else `defaultCols` (the
   * formsRegistry default, or the full row).
   */
  const getColSpan = (
    campo: string,
    defaultCols = layoutDefaults.cols[campo] ?? FORM_GRID_COLUMNS,
  ): number => tamanhoToSpan(fullConfigs[campo]?.tamanho) ?? defaultCols;

  /**
   * Returns the configured display order for a field, or `null` when not set.
   * Use as CSS `order` value or for sorting.
   */
  const getPosicao = (campo: string): number | null => {
    return fullConfigs[campo]?.posicao ?? null;
  };

  /**
   * Layout of a field inside a `ConfigurableFieldGrid`: column span (Tamanho) and CSS order
   * (Posição) as published in Formulários, else the formsRegistry defaults. Spread it on the
   * field wrapper: `<div className="space-y-2" {...fieldLayout('nome')}>`.
   */
  const fieldLayout = (campo: string): { style: CSSProperties; 'data-campo': string } => {
    const cols = getColSpan(campo);
    return {
      'data-campo': campo,
      // The grid applies the span from md up (one column on small screens).
      style: {
        '--field-span': cols,
        order: getPosicao(campo) ?? layoutDefaults.order[campo] ?? 999,
      } as CSSProperties,
    };
  };

  /** Translation of a field's label for the current language (tabulador Tradução), if any. */
  const translatedLabel = (campo: string): string | undefined =>
    (language && fullConfigs[campo]?.traducoes?.[language]) || undefined;

  /**
   * Label of a field: the translation published in Formulários > Tradução for the current
   * language, else `fallback` (the label the form already shows), else the formsRegistry label.
   */
  const fieldLabel = (campo: string, fallback?: string): string =>
    translatedLabel(campo) || fallback || registryLabels[campo] || campo;

  /**
   * Returns the labels of the required fields that are empty in `values`.
   * Only the campos present as keys in `values` are checked, so map the form state to this
   * form's `formsRegistry` campo keys. Labels default to the registry labels.
   */
  const validateRequired = (
    values: Record<string, unknown>,
    fieldLabels: Record<string, string> = {},
  ): string[] => {
    const missing: string[] = [];
    Object.entries(fullConfigs).forEach(([campo, cfg]) => {
      if (cfg.tipoValidacao !== 'obrigatorio' || !(campo in values)) return;
      if (isEmptyFieldValue(values[campo])) {
        missing.push(fieldLabel(campo, fieldLabels[campo]));
      }
    });
    return missing;
  };

  // Show validation error toast
  const showValidationError = (missingFields: string[]) => {
    toast({
      title: 'Campos obrigatórios',
      description: `Preencha os campos obrigatórios: ${missingFields.join(', ')}`,
      variant: 'destructive',
    });
  };

  /**
   * Checks the configured required fields and shows the error toast when any is empty.
   * Returns true when the form can be saved.
   */
  const validate = (
    values: Record<string, unknown>,
    fieldLabels?: Record<string, string>,
  ): boolean => {
    const missing = validateRequired(values, fieldLabels);
    if (missing.length === 0) return true;
    showValidationError(missing);
    return false;
  };

  return {
    fieldConfigs,
    isLoading,
    isRequired,
    isSuggested,
    getAsterisk,
    getColSpan,
    getPosicao,
    fieldLayout,
    fieldLabel,
    validateRequired,
    validate,
    showValidationError,
    refetch: fetchConfigs,
  };
};

// Component helper: renders the asterisk next to a label
export const FieldAsterisk = ({ type }: { type: 'required' | 'suggested' | null }) => {
  if (type === 'required') return <span className="text-destructive ml-0.5">*</span>;
  if (type === 'suggested') return <span className="text-blue-500 ml-0.5">*</span>;
  return null;
};

/**
 * 12-column grid (one column on small screens) whose children are positioned with
 * `fieldLayout(campo)` (Tamanho / Posição configured in Formulários). The Formulários preview
 * draws the same grid. Styles: `.configurable-field-grid` in src/app/globals.css.
 */
export const ConfigurableFieldGrid = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => <div className={cn('configurable-field-grid', className)}>{children}</div>;
