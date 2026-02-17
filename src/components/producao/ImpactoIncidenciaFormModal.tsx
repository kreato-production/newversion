import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface ImpactoIncidenciaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  data?: any;
  readOnly?: boolean;
}

export const ImpactoIncidenciaFormModal = ({ isOpen, onClose, onSave, data, readOnly }: ImpactoIncidenciaFormModalProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState({ titulo: '', descricao: '', codigo_externo: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({ titulo: data.titulo || '', descricao: data.descricao || '', codigo_externo: data.codigo_externo || '' });
    } else {
      setForm({ titulo: '', descricao: '', codigo_externo: '' });
    }
  }, [data, isOpen]);

  const handleSubmit = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data ? (readOnly ? t('incidentImpact.entity') : `${t('common.edit')} ${t('incidentImpact.entity')}`) : `${t('common.new')} ${t('incidentImpact.entity')}`}</DialogTitle>
          <DialogDescription>{t('incidentImpact.formDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('common.externalCode')}</Label>
              <Input maxLength={10} value={form.codigo_externo} onChange={(e) => setForm({ ...form, codigo_externo: e.target.value })} disabled={readOnly} />
            </div>
            <div>
              <Label>{t('incidentImpact.title')} *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} disabled={readOnly} />
            </div>
          </div>
          <div>
            <Label>{t('common.description')}</Label>
            <Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} disabled={readOnly} />
          </div>
          <div>
            <Label>{t('incidentImpact.user')}</Label>
            <Input value={user?.nome || ''} disabled />
          </div>
        </div>
        <DialogFooter>
          {readOnly ? (
            <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
              <Button onClick={handleSubmit} disabled={saving || !form.titulo.trim()}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {t('common.save')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
