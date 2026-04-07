import { useEffect, useState } from 'react';
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
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import type { FeriadoInput } from '@/modules/feriados/feriados.types';

interface FeriadoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FeriadoInput) => void | Promise<void>;
  data?: FeriadoInput | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const emptyFormData: FeriadoInput = {
  data: '',
  feriado: '',
  observacoes: '',
};

export const FeriadoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: FeriadoFormModalProps) => {
  const [formData, setFormData] = useState<FeriadoInput>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(data ? { ...data } : { ...emptyFormData });
      setIsSubmitting(false);
    }
  }, [isOpen, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: data?.id,
        data: formData.data,
        feriado: formData.feriado.trim(),
        observacoes: formData.observacoes?.trim() || '',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!data?.id;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Feriado' : 'Novo Feriado'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados do feriado.' : 'Preencha os dados do novo feriado.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data">
                Data <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData((prev) => ({ ...prev, data: e.target.value }))}
                required
                disabled={readOnly || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feriado">
                Feriado <span className="text-destructive">*</span>
              </Label>
              <Input
                id="feriado"
                value={formData.feriado}
                onChange={(e) => setFormData((prev) => ({ ...prev, feriado: e.target.value }))}
                maxLength={120}
                required
                disabled={readOnly || isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observacoes</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
              rows={4}
              disabled={readOnly || isSubmitting}
            />
          </div>

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {readOnly ? 'Fechar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.data || !formData.feriado.trim()}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
