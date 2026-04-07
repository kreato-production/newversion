import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';

interface SeveridadeIncidenciaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    titulo: string;
    descricao: string;
    codigo_externo: string;
    cor: string;
  }) => Promise<void>;
  data?: {
    titulo?: string | null;
    descricao?: string | null;
    codigo_externo?: string | null;
    cor?: string | null;
  } | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

export const SeveridadeIncidenciaFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly,
  navigation,
}: SeveridadeIncidenciaFormModalProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    codigo_externo: '',
    cor: '#888888',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        titulo: String(data.titulo || ''),
        descricao: String(data.descricao || ''),
        codigo_externo: String(data.codigo_externo || ''),
        cor: String(data.cor || '#888888'),
      });
    } else {
      setForm({ titulo: '', descricao: '', codigo_externo: '', cor: '#888888' });
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {data
              ? readOnly
                ? t('incidentSeverity.entity')
                : `${t('common.edit')} ${t('incidentSeverity.entity')}`
              : `${t('common.new')} ${t('incidentSeverity.entity')}`}
          </DialogTitle>
          <DialogDescription>{t('incidentSeverity.formDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('common.externalCode')}</Label>
              <Input
                maxLength={10}
                value={form.codigo_externo}
                onChange={(e) => setForm({ ...form, codigo_externo: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div>
              <Label>{t('incidentSeverity.title')} *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                disabled={readOnly}
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div>
              <Label>{t('common.description')}</Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div>
              <Label>{t('common.color')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.cor}
                  onChange={(e) => setForm({ ...form, cor: e.target.value })}
                  disabled={readOnly}
                  className="w-10 h-10 rounded border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Input
                  value={form.cor}
                  onChange={(e) => setForm({ ...form, cor: e.target.value })}
                  disabled={readOnly}
                  className="w-24 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>{t('incidentSeverity.user')}</Label>
            <Input value={user?.nome || ''} disabled />
          </div>
        </div>
        <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
          {navigation && <ModalNavigation {...navigation} />}
          <div className="flex gap-2">
            {readOnly ? (
              <Button variant="outline" onClick={onClose}>
                {t('common.close')}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit} disabled={saving || !form.titulo.trim()}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {t('common.save')}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
