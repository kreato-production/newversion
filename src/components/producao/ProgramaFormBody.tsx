'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { FieldAsterisk, useFormFieldConfig } from '@/hooks/useFormFieldConfig';
import { useLanguage } from '@/contexts/LanguageContext';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';
import type { Programa, ProgramaInput } from '@/modules/programas/programas.types';
import { ColorPicker } from '@/components/shared/ColorPicker';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import { cn } from '@/lib/utils';

const emptyForm = {
  codigoExterno: '',
  nome: '',
  descricao: '',
  cor: '',
  unidadeNegocioId: '',
};

// Default column spans when not configured (out of 4)
const DEFAULT_COLS: Record<string, number> = {
  codigoExterno: 1,
  nome: 2,
  cor: 4,
  unidadeNegocio: 4,
  descricao: 4,
};

// Default display order when not configured
const DEFAULT_ORDER: Record<string, number> = {
  codigoExterno: 1,
  nome: 2,
  cor: 3,
  unidadeNegocio: 4,
  descricao: 5,
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
  const { getColSpan, getPosicao, getAsterisk, validateRequired, showValidationError } =
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

  // Helper: resolve order value, falling back to default
  const order = (campo: string) => getPosicao(campo) ?? DEFAULT_ORDER[campo] ?? 99;
  // Helper: resolve col-span class, falling back to default
  const colSpanClass = (campo: string) => `col-span-${getColSpan(campo, DEFAULT_COLS[campo] ?? 4)}`;

  return (
    <form id={formId} onSubmit={handleSubmit}>
      {/* 4-column grid — order and col-span driven by config */}
      <div className="grid grid-cols-4 gap-4 py-2">
        {/* Código Externo */}
        <div
          className={cn('space-y-2', colSpanClass('codigoExterno'))}
          style={{ order: order('codigoExterno') }}
        >
          <Label htmlFor="codigoExterno">
            {t('common.externalCode')}
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
        <div className={cn('space-y-2', colSpanClass('nome'))} style={{ order: order('nome') }}>
          <Label htmlFor="nome">
            {t('common.name')} <span className="text-destructive">*</span>
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
        <div className={cn('space-y-2', colSpanClass('cor'))} style={{ order: order('cor') }}>
          <div className="flex items-center justify-between">
            <Label>
              Cor
              <FieldAsterisk type={getAsterisk('cor')} />
            </Label>
            {formData.cor && !readOnly && !isSubmitting && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, cor: '' })}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Limpar
              </button>
            )}
          </div>
          <ColorPicker
            value={formData.cor || '#6366f1'}
            onChange={(cor) => setFormData({ ...formData, cor })}
            disabled={readOnly || isSubmitting}
            previewLabel={formData.nome}
          />
        </div>

        {/* Unidade de Negócio */}
        <div
          className={cn('space-y-2', colSpanClass('unidadeNegocio'))}
          style={{ order: order('unidadeNegocio') }}
        >
          <Label>
            Unidade de Negócio
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
        <div
          className={cn('space-y-2', colSpanClass('descricao'))}
          style={{ order: order('descricao') }}
        >
          <Label htmlFor="descricao">
            {t('common.description')}
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
      </div>
    </form>
  );
};
