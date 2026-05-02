import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiTenantsRepository } from '@/modules/tenants/tenants.api.repository';
import { useToast } from '@/hooks/use-toast';
import type { Tenant } from '@/views/admin/Tenants';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { PASSWORD_POLICY_MESSAGE, validatePasswordPolicy } from '@/lib/password-policy';
import { TenantLicencasTab } from './TenantLicencasTab';
import { TenantModulosTab } from './TenantModulosTab';
import { TenantUnidadesTab } from './TenantUnidadesTab';

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data: Tenant | null;
  navigation?: ModalNavigationProps;
}

const apiRepository = new ApiTenantsRepository();

export const TenantFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  navigation,
}: TenantFormModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dados');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    plano: 'Mensal',
    status: 'Ativo',
    notas: '',
    adminNome: '',
    adminUsuario: '',
    adminSenha: '',
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (data) {
      setFormData({
        nome: data.nome,
        plano: data.plano,
        status: data.status,
        notas: data.notas,
        adminNome: data.adminNome ?? '',
        adminUsuario: data.adminUsuario ?? '',
        adminSenha: '',
      });
    } else {
      setFormData({
        nome: '',
        plano: 'Mensal',
        status: 'Ativo',
        notas: '',
        adminNome: '',
        adminUsuario: '',
        adminSenha: '',
      });
    }
    setShowPassword(false);

    setActiveTab('dados');
  }, [isOpen, data]);

  const passwordErrors = formData.adminSenha ? validatePasswordPolicy(formData.adminSenha) : [];
  const showPasswordValidation = formData.adminSenha.length > 0 && passwordErrors.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!data) {
      // Creating: all admin fields are required
      if (!formData.adminNome || !formData.adminUsuario || !formData.adminSenha) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha os dados do usuário administrador.',
          variant: 'destructive',
        });
        return;
      }
      if (passwordErrors.length > 0) {
        toast({
          title: 'Senha inválida',
          description: PASSWORD_POLICY_MESSAGE,
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.adminSenha && passwordErrors.length > 0) {
      toast({
        title: 'Senha inválida',
        description: PASSWORD_POLICY_MESSAGE,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      await apiRepository.save({
        id: data?.id,
        nome: formData.nome,
        plano: formData.plano as 'Mensal' | 'Anual',
        status: formData.status as 'Ativo' | 'Inativo' | 'Bloqueado',
        notas: formData.notas,
        adminNome: formData.adminNome || undefined,
        adminUsuario: formData.adminUsuario || undefined,
        adminSenha: formData.adminSenha || undefined,
      });

      toast({
        title: 'Sucesso',
        description: data ? 'Tenant atualizado com sucesso!' : 'Tenant criado com sucesso!',
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar tenant. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="mx-0 mt-0 shrink-0">
          <DialogTitle>{data ? 'Editar Tenant' : 'Novo Tenant'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="px-6 pt-4 border-b shrink-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
                <TabsTrigger value="licencas" disabled={!data}>
                  Licencas
                </TabsTrigger>
                <TabsTrigger value="unidades" disabled={!data}>
                  Unidades de Negocio
                </TabsTrigger>
                <TabsTrigger value="modulos" disabled={!data}>
                  Modulos
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-muted/10">
              <TabsContent value="dados" className="p-6 mt-0">
                <form id="tenant-form" onSubmit={handleSubmit} className="space-y-4">
                  {data && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ID</Label>
                        <Input value={data.id} disabled className="bg-muted font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Criacao</Label>
                        <Input
                          value={new Date(data.createdAt).toLocaleString()}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nome">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                      required
                      maxLength={100}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plano">
                        Plano <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.plano}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, plano: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mensal">Mensal</SelectItem>
                          <SelectItem value="Anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">
                        Status <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <Separator />

                  <p className="text-sm font-medium text-muted-foreground">Usuário Administrador</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminNome">
                        Nome do Usuário Admin {!data && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id="adminNome"
                        value={formData.adminNome}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, adminNome: e.target.value }))
                        }
                        placeholder="Ex: João da Silva"
                        required={!data}
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminUsuario">
                        Usuário Admin {!data && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        id="adminUsuario"
                        value={formData.adminUsuario}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, adminUsuario: e.target.value }))
                        }
                        placeholder="Ex: joao.admin"
                        required={!data}
                        maxLength={50}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminSenha">
                      Password {!data && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="adminSenha"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.adminSenha}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, adminSenha: e.target.value }))
                        }
                        placeholder={data ? '••••••••  (deixe em branco para manter)' : ''}
                        required={!data}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p
                      className={`text-xs ${showPasswordValidation ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      {PASSWORD_POLICY_MESSAGE}
                    </p>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="licencas" className="p-6 mt-0 h-full">
                {data && <TenantLicencasTab tenantId={data.id} />}
              </TabsContent>

              <TabsContent value="unidades" className="p-6 mt-0 h-full">
                {data && <TenantUnidadesTab tenantId={data.id} />}
              </TabsContent>

              <TabsContent value="modulos" className="p-6 mt-0 h-full">
                {data && <TenantModulosTab tenantId={data.id} />}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-6 border-t bg-background shrink-0 flex justify-between">
          {navigation ? <ModalNavigation {...navigation} /> : <div />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {activeTab === 'dados' ? 'Cancelar' : 'Fechar'}
            </Button>
            {activeTab === 'dados' && (
              <Button type="submit" form="tenant-form" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
