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
import { useLanguage } from '@/contexts/LanguageContext';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';
import type { Programa, ProgramaInput } from '@/modules/programas/programas.types';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;
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

  const isEditing = !!data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Programa' : 'Novo Programa'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Editar' : 'Adicionar'} programa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                maxLength={10}
                placeholder="Máx. 10 caracteres"
                disabled={readOnly || isSubmitting}
              />
            </div>
            <div className="space-y-2">
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
          </div>

          <div className="space-y-2">
            <Label>Unidade de Negócio</Label>
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

          <div className="space-y-2">
            <Label htmlFor="descricao">{t('common.description')}</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              disabled={readOnly || isSubmitting}
            />
          </div>

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
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
