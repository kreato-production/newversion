import { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';

const COLOR_PALETTE = [
  '#3B82F6',
  '#EF4444',
  '#22C55E',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#84CC16',
  '#DC2626',
  '#0EA5E9',
  '#A855F7',
  '#10B981',
  '#F43F5E',
];

interface ParametroFormData {
  id?: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor?: string | null;
  dataCadastro?: string;
  usuarioCadastro?: string;
}

interface ParametroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ParametroFormData) => void | Promise<void>;
  title: string;
  data?: ParametroFormData | null;
  readOnly?: boolean;
  showCor?: boolean;
  navigation?: ModalNavigationProps;
}

const emptyFormData: ParametroFormData = {
  codigoExterno: '',
  nome: '',
  descricao: '',
  cor: null,
};

export const ParametroFormModal = ({
  isOpen,
  onClose,
  onSave,
  title,
  data,
  readOnly = false,
  showCor = false,
  navigation,
}: ParametroFormModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ParametroFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(data ? { ...data } : { ...emptyFormData });
      setIsSubmitting(false);
    }
  }, [isOpen, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        id: data?.id || crypto.randomUUID(),
        dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
        usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
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
          <DialogTitle>
            {isEditing ? `${t('common.edit')} ${title}` : `${t('common.new')} ${title}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('common.edit') : t('common.add')} {title.toLowerCase()}.
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
                placeholder={t('common.maxChars')}
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
                maxLength={100}
                required
                disabled={readOnly || isSubmitting}
              />
            </div>
          </div>

          {showCor && (
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 items-center">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    disabled={readOnly || isSubmitting}
                    onClick={() =>
                      setFormData({ ...formData, cor: formData.cor === color ? null : color })
                    }
                    className="w-8 h-8 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: color,
                      boxShadow:
                        formData.cor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : undefined,
                      transform: formData.cor === color ? 'scale(1.15)' : undefined,
                    }}
                    title={color}
                  />
                ))}
                {formData.cor && !COLOR_PALETTE.includes(formData.cor) && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground"
                    style={{ backgroundColor: formData.cor }}
                    title={formData.cor}
                  />
                )}
              </div>
            </div>
          )}

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

export default ParametroFormModal;
