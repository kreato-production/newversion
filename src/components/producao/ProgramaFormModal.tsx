'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { FieldAsterisk, useFormFieldConfig } from '@/hooks/useFormFieldConfig';
import { useLanguage } from '@/contexts/LanguageContext';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';
import type { Programa, ProgramaInput } from '@/modules/programas/programas.types';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { cn } from '@/lib/utils';

interface ProgramaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProgramaInput) => void | Promise<void>;
  data?: Programa | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const emptyForm = {
  codigoExterno: '',
  nome: '',
  descricao: '',
  unidadeNegocioId: '',
};

// Default column spans when not configured (out of 4)
const DEFAULT_COLS: Record<string, number> = {
  codigoExterno: 1,
  nome: 3,
  unidadeNegocio: 4,
  descricao: 4,
};

// Default display order when not configured
const DEFAULT_ORDER: Record<string, number> = {
  codigoExterno: 1,
  nome: 2,
  unidadeNegocio: 3,
  descricao: 4,
};

export const ProgramaFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: ProgramaFormModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(emptyForm);
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
    if (isOpen) {
      fetchUnidades();
      setIsSubmitting(false);
      setFormData(
        data
          ? {
              codigoExterno: data.codigoExterno,
              nome: data.nome,
              descricao: data.descricao,
              unidadeNegocioId: data.unidadeNegocioId,
            }
          : emptyForm,
      );
    }
  }, [isOpen, data, fetchUnidades]);

  // Field labels matching the formsRegistry campo keys for this form
  const FIELD_LABELS: Record<string, string> = {
    codigoExterno: 'Código Externo',
    nome: 'Nome',
    unidadeNegocio: 'Unidade de Negócio',
    descricao: 'Descrição',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

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
      await onSave({
        id: data?.id,
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        descricao: formData.descricao,
        unidadeNegocioId: formData.unidadeNegocioId,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: resolve order value, falling back to default
  const order = (campo: string) => getPosicao(campo) ?? DEFAULT_ORDER[campo] ?? 99;
  // Helper: resolve col-span class, falling back to default
  const colSpanClass = (campo: string) => `col-span-${getColSpan(campo, DEFAULT_COLS[campo] ?? 4)}`;

  const isEditing = !!data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Programa' : 'Novo Programa'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Editar' : 'Adicionar'} programa.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
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

          <DialogFooter className={cn('mt-4', navigation ? 'sm:justify-between' : undefined)}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {readOnly ? 'Fechar' : t('common.cancel')}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSubmitting || !formData.nome.trim()}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.save')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
