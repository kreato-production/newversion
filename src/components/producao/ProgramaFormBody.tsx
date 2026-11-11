'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import {
  ConfigurableFieldGrid,
  FieldAsterisk,
  useFormFieldConfig,
} from '@/hooks/useFormFieldConfig';
import { useLanguage } from '@/contexts/LanguageContext';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';
import type { Programa, ProgramaInput } from '@/modules/programas/programas.types';
import { ColorPicker } from '@/components/shared/ColorPicker';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';

const emptyForm = {
  codigoExterno: '',
  nome: '',
  descricao: '',
  cor: '',
  unidadeNegocioId: '',
};

/** Fields of the Programa cadastro (layout configurable per tenant), inside a `RecordFormPage`. */
export const ProgramaFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<Programa, ProgramaInput>) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(() =>
    data
      ? {
          codigoExterno: data.codigoExterno,
          nome: data.nome,
          descricao: data.descricao,
          cor: data.cor || '',
          unidadeNegocioId: data.unidadeNegocioId,
        }
      : emptyForm,
  );
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fieldLayout, getAsterisk, validateRequired, showValidationError, fieldLabel } =
    useFormFieldConfig('programa');

  const fetchUnidades = useCallback(async () => {
    try {
      const result = await unidadesRepository.list('');
      setUnidades(result.map((u) => ({ id: u.id, nome: u.nome })));
    } catch {
      setUnidades([]);
    }
  }, []);

  useEffect(() => {
    void fetchUnidades();
  }, [fetchUnidades]);

  // Field labels matching the formsRegistry campo keys for this form
  const FIELD_LABELS: Record<string, string> = {
    codigoExterno: 'Código Externo',
    nome: 'Nome',
    cor: 'Cor',
    unidadeNegocio: 'Unidade de Negócio',
    descricao: 'Descrição',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || isSubmitting || !formData.nome.trim()) return;

    // Map form state to registry campo keys for validation
    const mappedData: Record<string, unknown> = {
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      unidadeNegocio: formData.unidadeNegocioId,
      descricao: formData.descricao,
    };
    const missing = validateRequired(mappedData, FIELD_LABELS);
    if (missing.length > 0) {
      showValidationError(missing);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: data?.id,
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        descricao: formData.descricao,
        cor: formData.cor || null,
        unidadeNegocioId: formData.unidadeNegocioId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      {/* Tamanho / Posição configured in Formulários (same grid as its preview) */}
      <ConfigurableFieldGrid className="py-2">
        {/* Código Externo */}
        <div className="space-y-2" {...fieldLayout('codigoExterno')}>
          <Label htmlFor="codigoExterno">
            {fieldLabel('codigoExterno', t('common.externalCode'))}
            <FieldAsterisk type={getAsterisk('codigoExterno')} />
          </Label>
          <Input
            id="codigoExterno"
            value={formData.codigoExterno}
            onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
            maxLength={10}
            placeholder="Máx. 10 caracteres"
            disabled={readOnly || isSubmitting}
          />
        </div>

        {/* Nome */}
        <div className="space-y-2" {...fieldLayout('nome')}>
          <Label htmlFor="nome">
            {fieldLabel('nome', t('common.name'))}{' '}
            <FieldAsterisk type={getAsterisk('nome', true)} />
          </Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            maxLength={200}
            required
            disabled={readOnly || isSubmitting}
          />
        </div>

        {/* Cor */}
        <div className="space-y-2" {...fieldLayout('cor')}>
          <div className="flex items-center justify-between">
            <Label>
              {fieldLabel('cor', 'Cor')}
              <FieldAsterisk type={getAsterisk('cor')} />
            </Label>
            {formData.cor && !readOnly && !isSubmitting && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, cor: '' })}
                className="text-xs leading-none text-muted-foreground hover:text-destructive"
              >
                Limpar
              </button>
            )}
          </div>
          <ColorPicker
            compact
            value={formData.cor || '#6366f1'}
            onChange={(cor) => setFormData({ ...formData, cor })}
            disabled={readOnly || isSubmitting}
            previewLabel={formData.nome}
          />
        </div>

        {/* Unidade de Negócio */}
        <div className="space-y-2" {...fieldLayout('unidadeNegocio')}>
          <Label>
            {fieldLabel('unidadeNegocio', 'Unidade de Negócio')}
            <FieldAsterisk type={getAsterisk('unidadeNegocio')} />
          </Label>
          <SearchableSelect
            options={unidades.map((u) => ({ value: u.id, label: u.nome }))}
            value={formData.unidadeNegocioId}
            onValueChange={(value) => setFormData({ ...formData, unidadeNegocioId: value })}
            placeholder={t('common.select')}
            searchPlaceholder="Pesquisar unidade..."
            emptyMessage="Nenhuma unidade encontrada."
            disabled={readOnly || isSubmitting}
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2" {...fieldLayout('descricao')}>
          <Label htmlFor="descricao">
            {fieldLabel('descricao', t('common.description'))}
            <FieldAsterisk type={getAsterisk('descricao')} />
          </Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            rows={3}
            disabled={readOnly || isSubmitting}
          />
        </div>
      </ConfigurableFieldGrid>
    </form>
  );
};
