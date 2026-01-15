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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import PermissoesTab from './PermissoesTab';
import { createDefaultPermissions, savePerfilPermissions } from '@/data/permissionsMatrix';

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
  onSave: (data: PerfilFormData) => void;
  data?: PerfilFormData | null;
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
}: PerfilFormModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<PerfilFormData>(emptyFormData);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    if (isOpen) {
      if (data) {
        setFormData({ ...data });
      } else {
        setFormData({ ...emptyFormData });
      }
      setActiveTab('dados');
    }
  }, [isOpen, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const perfilId = data?.id || crypto.randomUUID();
    
    const savedData = {
      ...formData,
      id: perfilId,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    };
    
    // Se for um novo perfil, cria as permissões padrão (REGRA 1)
    if (!data?.id) {
      const defaultPermissions = createDefaultPermissions(perfilId);
      savePerfilPermissions(defaultPermissions);
    }
    
    onSave(savedData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {data ? `${t('common.edit')} Perfil` : `${t('common.new')} Perfil`}
          </DialogTitle>
          <DialogDescription>
            {data ? t('common.edit') : t('common.add')} perfil de acesso.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="permissoes" disabled={!data?.id}>
              Permissões
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados" className="flex-1 overflow-auto">
            <form onSubmit={handleSubmit} className="space-y-4 p-1">
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
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="gradient-primary hover:opacity-90">
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="permissoes" className="flex-1 overflow-auto">
            {data?.id && (
              <PermissoesTab perfilId={data.id} perfilNome={data.nome} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PerfilFormModal;
