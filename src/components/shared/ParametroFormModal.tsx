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
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParametroFormData {
  id?: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro?: string;
  usuarioCadastro?: string;
}

interface ParametroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ParametroFormData) => void;
  title: string;
  data?: ParametroFormData | null;
  readOnly?: boolean;
}

const emptyFormData: ParametroFormData = {
  codigoExterno: '',
  nome: '',
  descricao: '',
};

export const ParametroFormModal = ({
  isOpen,
  onClose,
  onSave,
  title,
  data,
  readOnly = false,
}: ParametroFormModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<ParametroFormData>(emptyFormData);

  // Reset form data when modal opens or data changes
  useEffect(() => {
    if (isOpen) {
      setFormData(data ? { ...data } : { ...emptyFormData });
    }
  }, [isOpen, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: data?.id || crypto.randomUUID(),
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? `${t('common.edit')} ${title}` : `${t('common.new')} ${title}`}</DialogTitle>
          <DialogDescription>
            {data ? t('common.edit') : t('common.add')} {title.toLowerCase()}.
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">{t('common.name')} <span className="text-destructive">*</span></Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                maxLength={100}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">{t('common.description')}</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly ? 'Fechar' : t('common.cancel')}
            </Button>
            {!readOnly && (
              <Button type="submit" className="gradient-primary hover:opacity-90">
                {t('common.save')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParametroFormModal;
