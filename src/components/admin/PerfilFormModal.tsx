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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import PermissoesTab from './PermissoesTab';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';

interface PerfilFormData {
  id?: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro?: string;
  usuarioCadastro?: string;
}

interface PerfilFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PerfilFormData) => void | Promise<void>;
  data?: PerfilFormData | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const emptyFormData: PerfilFormData = {
  codigoExterno: '',
  nome: '',
  descricao: '',
};

const PerfilFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: PerfilFormModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<PerfilFormData>(emptyFormData);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(data ? { ...data } : { ...emptyFormData });
    setActiveTab('dados');
  }, [isOpen, data]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const perfilId = data?.id || crypto.randomUUID();
    const savedData = {
      ...formData,
      id: perfilId,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    };

    await onSave(savedData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {data ? `${t('common.edit')} Perfil` : `${t('common.new')} Perfil`}
          </DialogTitle>
          <DialogDescription>
            {data ? t('common.edit') : t('common.add')} perfil de acesso.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="permissoes" disabled={!data?.id}>
              Permissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="flex-1 overflow-auto">
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(event) =>
                      setFormData({ ...formData, codigoExterno: event.target.value })
                    }
                    maxLength={10}
                    placeholder={t('common.maxChars')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    {t('common.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
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
                  onChange={(event) => setFormData({ ...formData, descricao: event.target.value })}
                  rows={3}
                />
              </div>

              <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
                {navigation && <ModalNavigation {...navigation} />}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {readOnly ? 'Fechar' : t('common.cancel')}
                  </Button>
                  {!readOnly && (
                    <Button type="submit" className="gradient-primary hover:opacity-90">
                      {t('common.save')}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="permissoes" className="flex-1 overflow-auto">
            {data?.id ? <PermissoesTab perfilId={data.id} perfilNome={data.nome} /> : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PerfilFormModal;
