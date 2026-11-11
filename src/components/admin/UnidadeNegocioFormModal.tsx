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
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';
import { UnidadeNegocioFormBody } from './UnidadeNegocioFormBody';

interface UnidadeNegocioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UnidadeNegocio) => Promise<void>;
  data?: UnidadeNegocio | null;
  readOnly?: boolean;
}

const FORM_ID = 'unidade-negocio-modal-form';

/**
 * Dialog version of the Unidade de Negócio form, kept for the Tenant > Unidades tab
 * (the cadastro itself opens as a page). Same fields as the page: `UnidadeNegocioFormBody`.
 */
export const UnidadeNegocioFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}: UnidadeNegocioFormModalProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (input: UnidadeNegocio) => {
    setIsSaving(true);
    try {
      await onSave(input);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? 'Editar Unidade de Negocio' : 'Nova Unidade de Negocio'}
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} a unidade de negocio.
          </DialogDescription>
        </DialogHeader>

        {/* Remounted on open so the fields start from the selected record. */}
        {isOpen && (
          <UnidadeNegocioFormBody
            key={data?.id ?? 'novo'}
            formId={FORM_ID}
            data={data ?? null}
            readOnly={readOnly}
            onSubmit={handleSubmit}
          />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {readOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          {!readOnly && (
            <Button
              type="submit"
              form={FORM_ID}
              className="gradient-primary hover:opacity-90"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
