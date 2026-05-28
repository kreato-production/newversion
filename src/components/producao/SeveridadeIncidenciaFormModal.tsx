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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';

interface SeveridadeIncidenciaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    titulo: string;
    descricao: string;
    codigo_externo: string;
    cor: string;
    traducoes: Traducoes;
  }) => Promise<void>;
  data?: {
    titulo?: string | null;
    descricao?: string | null;
    codigo_externo?: string | null;
    cor?: string | null;
    traducoes?: Record<string, string> | null;
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
  const [traducoes, setTraducoes] = useState<Traducoes>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        titulo: String(data.titulo || ''),
        descricao: String(data.descricao || ''),
        codigo_externo: String(data.codigo_externo || ''),
        cor: String(data.cor || '#888888'),
      });
      setTraducoes((data.traducoes as Traducoes) ?? {});
    } else {
      setForm({ titulo: '', descricao: '', codigo_externo: '', cor: '#888888' });
      setTraducoes({});
    }
  }, [data, isOpen]);

  const handleSubmit = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, traducoes });
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

        <Tabs defaultValue="dados">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1">
              Dados Gerais
            </TabsTrigger>
            <TabsTrigger value="traducao" className="flex-1">
              Tradução
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
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
            <div>
              <Label>{t('common.description')}</Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.color')}</Label>
              <ColorPicker
                value={form.cor}
                onChange={(cor) => setForm({ ...form, cor })}
                disabled={readOnly}
                previewLabel={form.titulo}
              />
            </div>
            <div>
              <Label>{t('incidentSeverity.user')}</Label>
              <Input value={user?.nome || ''} disabled />
            </div>
          </TabsContent>

          <TabsContent value="traducao">
            <TraducaoTab
              traducoes={traducoes}
              onChange={(lang, value) => setTraducoes({ ...traducoes, [lang]: value })}
              readOnly={readOnly}
            />
          </TabsContent>
        </Tabs>

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
