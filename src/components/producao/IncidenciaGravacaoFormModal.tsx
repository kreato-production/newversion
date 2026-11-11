import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  ApiIncidenciasGravacaoRepository,
  type SaveIncidenciaGravacaoInput,
} from '@/modules/incidencias-gravacao/incidencias-gravacao.api';
import { IncidenciaGravacaoFormBody, type IncidenciaFormData } from './IncidenciaGravacaoFormBody';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful save (e.g. to refresh the embedding list). */
  onSave: () => Promise<void> | void;
  data?: IncidenciaFormData;
  readOnly?: boolean;
  defaultGravacaoId?: string;
  defaultJanelaId?: string;
}

const FORM_ID = 'incidencia-modal-form';
const incidenciasRepository = new ApiIncidenciasGravacaoRepository();

/**
 * Dialog version of the Incidência form for embedded contexts (Gravação > Incidências,
 * SatOps Janela, Dashboard Operacional). The cadastro itself opens as a page; both use
 * `IncidenciaGravacaoFormBody`.
 */
export const IncidenciaGravacaoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  defaultGravacaoId,
  defaultJanelaId,
}: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (input: SaveIncidenciaGravacaoInput) => {
    setIsSaving(true);
    try {
      await incidenciasRepository.save({ ...input, created_by: user?.id || null });
      toast({
        title: t('common.success'),
        description: data?.id
          ? `${t('incident.entity')} ${t('common.update').toLowerCase()}!`
          : `${t('incident.entity')} ${t('common.save').toLowerCase()}!`,
      });
      await onSave();
      onClose();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {data ? (readOnly ? t('common.view') : t('common.edit')) : t('common.new')}{' '}
            {t('incident.entity')}
          </DialogTitle>
          <DialogDescription>{t('incident.formDescription')}</DialogDescription>
        </DialogHeader>

        {/* Remounted on open so the fields start from the selected record. */}
        {isOpen && (
          <IncidenciaGravacaoFormBody
            key={data?.id ?? 'novo'}
            formId={FORM_ID}
            data={data ?? null}
            readOnly={readOnly}
            onSubmit={handleSubmit}
            defaultGravacaoId={defaultGravacaoId}
            defaultJanelaId={defaultJanelaId}
          />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {readOnly ? t('common.close') : t('common.cancel')}
          </Button>
          {!readOnly && (
            <Button type="submit" form={FORM_ID} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {t('common.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
