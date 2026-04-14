import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ApiAdminConfigRepository, type FullFieldConfig } from '@/modules/admin/admin-config.api';

export type FieldValidationType = 'obrigatorio' | 'sugerido' | null;

export interface FieldConfig {
  campo: string;
  tipo_validacao: FieldValidationType;
}

const apiRepository = new ApiAdminConfigRepository();

// Hook to fetch form field configurations for a specific form
export const useFormFieldConfig = (formularioId: string) => {
  const [fullConfigs, setFullConfigs] = useState<Record<string, FullFieldConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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

  // Get the asterisk type for a field
  const getAsterisk = (campo: string): 'required' | 'suggested' | null => {
    if (fullConfigs[campo]?.tipoValidacao === 'obrigatorio') return 'required';
    if (fullConfigs[campo]?.tipoValidacao === 'sugerido') return 'suggested';
    return null;
  };

  /**
   * Returns the configured column span (1–4) for a field in a 4-column grid.
   * Returns `defaultCols` when not configured.
   */
  const getColSpan = (campo: string, defaultCols = 4): number => {
    const t = fullConfigs[campo]?.tamanho;
    if (!t) return defaultCols;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n >= 1 && n <= 4 ? n : defaultCols;
  };

  /**
   * Returns the configured display order for a field, or `null` when not set.
   * Use as CSS `order` value or for sorting.
   */
  const getPosicao = (campo: string): number | null => {
    return fullConfigs[campo]?.posicao ?? null;
  };

  /**
   * Returns a CSS col-span class (e.g. "col-span-2") for use in a grid-cols-4 layout.
   */
  const getColSpanClass = (campo: string, defaultCols = 4): string => {
    const n = getColSpan(campo, defaultCols);
    return `col-span-${n}`;
  };

  // Validate all required fields, returns array of missing field names
  const validateRequired = (
    formData: Record<string, unknown>,
    fieldLabels: Record<string, string>,
  ): string[] => {
    const missing: string[] = [];
    Object.entries(fullConfigs).forEach(([campo, cfg]) => {
      if (cfg.tipoValidacao === 'obrigatorio') {
        const value = formData[campo];
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          missing.push(fieldLabels[campo] || campo);
        }
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

  return {
    fieldConfigs,
    isLoading,
    isRequired,
    isSuggested,
    getAsterisk,
    getColSpan,
    getColSpanClass,
    getPosicao,
    validateRequired,
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
