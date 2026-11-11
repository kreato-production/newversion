import { useState } from 'react';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
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
import type { TenantApiInput } from '@/modules/tenants/tenants.api.repository';
import { useToast } from '@/hooks/use-toast';
import type { Tenant } from '@/views/admin/Tenants';
import { Eye, EyeOff } from 'lucide-react';
import { PASSWORD_POLICY_MESSAGE, validatePasswordPolicy } from '@/lib/password-policy';
import { TenantLicencasTab } from './TenantLicencasTab';
import { TenantModulosTab } from './TenantModulosTab';
import { TenantUnidadesTab } from './TenantUnidadesTab';

/**
 * Fields of the Tenant cadastro (with Licenças, Unidades and Módulos tabs), inside a
 * `RecordFormPage`. The administrator user is required when creating.
 */
export const TenantFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<Tenant, TenantApiInput>) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dados');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(() => ({
    nome: data?.nome ?? '',
    // Plain strings, as written by the selects (validated on submit).
    plano: (data?.plano ?? 'Mensal') as string,
    status: (data?.status ?? 'Ativo') as string,
    notas: data?.notas ?? '',
    adminNome: data?.adminNome ?? '',
    adminUsuario: data?.adminUsuario ?? '',
    adminSenha: '',
  }));

  const passwordErrors = formData.adminSenha ? validatePasswordPolicy(formData.adminSenha) : [];
  const showPasswordValidation = formData.adminSenha.length > 0 && passwordErrors.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly || isSaving) return;

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
      // The page saves and shows the success/error toasts.
      await onSubmit({
        id: data?.id,
        nome: formData.nome,
        plano: formData.plano as 'Mensal' | 'Anual',
        status: formData.status as 'Ativo' | 'Inativo' | 'Bloqueado',
        notas: formData.notas,
        adminNome: formData.adminNome || undefined,
        adminUsuario: formData.adminUsuario || undefined,
        adminSenha: formData.adminSenha || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div>
        <TabsList>
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

      <div>
        {/* Kept mounted so the page Save button finds the form from any tab. */}
        <TabsContent value="dados" forceMount className="mt-4 data-[state=inactive]:hidden">
          <form id={formId} onSubmit={handleSubmit} className="space-y-4">
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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, plano: value }))}
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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
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

            <p className="text-xs font-medium text-muted-foreground">Usuário Administrador</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminNome">
                  Nome do Usuário Admin {!data && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="adminNome"
                  value={formData.adminNome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminNome: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, adminSenha: e.target.value }))}
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

        <TabsContent value="licencas" className="mt-4">
          {data && <TenantLicencasTab tenantId={data.id} />}
        </TabsContent>

        <TabsContent value="unidades" className="mt-4">
          {data && <TenantUnidadesTab tenantId={data.id} />}
        </TabsContent>

        <TabsContent value="modulos" className="mt-4">
          {data && <TenantModulosTab tenantId={data.id} />}
        </TabsContent>
      </div>
    </Tabs>
  );
};
