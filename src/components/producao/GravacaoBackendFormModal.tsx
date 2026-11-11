import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Gravacao, GravacaoInput } from '@/modules/gravacoes/gravacoes.types';
import { GravacaoFormBody } from './GravacaoFormBody';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Saves the gravação; the dialog closes when it resolves and stays open when it throws. */
  onSave: (data: GravacaoInput) => Promise<void>;
  data?: Gravacao | null;
  readOnly?: boolean;
  initialValues?: Partial<GravacaoInput>;
}

const FORM_ID = 'gravacao-modal-form';

/**
 * Dialog version of the Gravação form for the Grelha de programação (planning a gravação and
 * viewing one from the grid). The cadastro itself opens as a page; both use `GravacaoFormBody`.
 */
export const GravacaoBackendFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  initialValues,
}: Props) => {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (input: GravacaoInput) => {
    setIsSaving(true);
    try {
      await onSave(input);
      onClose();
    } catch {
      // keep the dialog open on error (the caller shows the message)
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[1400px] max-w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Gravação' : 'Nova Gravação'}</DialogTitle>
        </DialogHeader>

        {/* Remounted on open so the fields start from the given record / values. */}
        {isOpen && (
          <GravacaoFormBody
            key={data?.id ?? 'novo'}
            formId={FORM_ID}
            data={data ?? null}
            readOnly={readOnly}
            onSubmit={handleSubmit}
            initialValues={initialValues}
          />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {readOnly ? 'Fechar' : t('common.cancel')}
          </Button>
          {!readOnly && (
            <Button
              type="submit"
              form={FORM_ID}
              className="gradient-primary hover:opacity-90"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GravacaoBackendFormModal;
