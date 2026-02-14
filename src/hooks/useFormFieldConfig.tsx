import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type FieldValidationType = 'obrigatorio' | 'sugerido' | null;

export interface FieldConfig {
  campo: string;
  tipo_validacao: FieldValidationType;
}

// Hook to fetch form field configurations for a specific form
export const useFormFieldConfig = (formularioId: string) => {
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldValidationType>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfigs = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('formulario_campos')
        .select('campo, tipo_validacao')
        .eq('formulario', formularioId);

      if (error) throw error;

      const configs: Record<string, FieldValidationType> = {};
      (data || []).forEach((item: FieldConfig) => {
        configs[item.campo] = item.tipo_validacao;
      });
      setFieldConfigs(configs);
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

  // Check if a field is required
  const isRequired = (campo: string): boolean => {
    return fieldConfigs[campo] === 'obrigatorio';
  };

  // Check if a field is suggested
  const isSuggested = (campo: string): boolean => {
    return fieldConfigs[campo] === 'sugerido';
  };

  // Get the asterisk type for a field
  const getAsterisk = (campo: string): 'required' | 'suggested' | null => {
    if (fieldConfigs[campo] === 'obrigatorio') return 'required';
    if (fieldConfigs[campo] === 'sugerido') return 'suggested';
    return null;
  };

  // Validate all required fields, returns array of missing field names
  const validateRequired = (formData: Record<string, any>, fieldLabels: Record<string, string>): string[] => {
    const missing: string[] = [];
    Object.entries(fieldConfigs).forEach(([campo, tipo]) => {
      if (tipo === 'obrigatorio') {
        const value = formData[campo];
        if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
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
