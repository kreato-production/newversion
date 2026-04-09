import { useEffect, useRef, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Usuario } from '@/views/admin/Usuarios';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { UnidadesNegocioTab } from './UnidadesNegocioTab';
import { UsuarioProgramasTab } from './UsuarioProgramasTab';
import { UsuarioEquipesTab } from './UsuarioEquipesTab';
import { ApiTenantsRepository, type TenantApiItem } from '@/modules/tenants/tenants.api.repository';
import { ApiParametrosRepository } from '@/modules/parametros/parametros.api.repository';
import { PASSWORD_POLICY_MESSAGE, validatePasswordPolicy } from '@/lib/password-policy';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Usuario) => Promise<void>;
  data?: Usuario | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
  showTenantSelector?: boolean;
}

const emptyFormData = {
  codigoExterno: '',
  nome: '',
  email: '',
  usuario: '',
  senha: '',
  foto: '',
  perfil: '',
  descricao: '',
  status: 'Ativo' as 'Ativo' | 'Inativo' | 'Bloqueado',
  tipoAcesso: 'Operacional',
  tenantId: '' as string,
  role: 'USER' as 'TENANT_ADMIN' | 'USER',
};

const tenantsRepository = new ApiTenantsRepository();
const parametrosRepository = new ApiParametrosRepository();

export const UsuarioFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
  showTenantSelector = false,
}: UsuarioFormModalProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [tenants, setTenants] = useState<TenantApiItem[]>([]);
  const [perfis, setPerfis] = useState<Array<{ id: string; nome: string }>>([]);
  const passwordErrors = formData.senha ? validatePasswordPolicy(formData.senha) : [];
  const showPasswordValidation = formData.senha.length > 0 && passwordErrors.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    setFormData(
      data
        ? {
            codigoExterno: data.codigoExterno,
            nome: data.nome,
            email: data.email,
            usuario: data.usuario,
            senha: '',
            foto: data.foto || '',
            perfil: data.perfil || '',
            descricao: data.descricao,
            status: data.status,
            tipoAcesso: data.tipoAcesso || 'Operacional',
            tenantId: data.tenantId || '',
            role: (data.role === 'GLOBAL_ADMIN' ? 'TENANT_ADMIN' : data.role) || 'USER',
          }
        : emptyFormData,
    );
    setFotoPreview(data?.foto || null);
  }, [data, isOpen, user?.role]);

  useEffect(() => {
    if (!isOpen || user?.role !== 'GLOBAL_ADMIN') {
      return;
    }

    tenantsRepository
      .list()
      .then(setTenants)
      .catch((error) => {
        console.error('Error fetching tenants:', error);
      });
  }, [isOpen, user?.role]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    parametrosRepository
      .list('kreato_perfis_acesso')
      .then((items) =>
        setPerfis(
          items.map((item) => ({
            id: item.id,
            nome: item.nome,
          })),
        ),
      )
      .catch((error) => {
        console.error('Error fetching perfis:', error);
        setPerfis([]);
      });
  }, [isOpen]);

  const handleFotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no maximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFotoPreview(base64);
      setFormData((current) => ({ ...current, foto: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFoto = () => {
    setFotoPreview(null);
    setFormData((current) => ({ ...current, foto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!data && (!formData.email || !formData.senha || !formData.nome || !formData.usuario)) {
      alert('Preencha todos os campos obrigatorios');
      return;
    }

    if (formData.senha && passwordErrors.length > 0) {
      alert(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (shouldShowTenantSelect && !formData.tenantId) {
      alert('Selecione o tenant do usuário.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: data?.id || crypto.randomUUID(),
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        email: formData.email,
        usuario: formData.usuario,
        senha: formData.senha || '',
        foto: formData.foto || '',
        perfil: formData.perfil || '',
        perfilId: undefined,
        descricao: formData.descricao,
        status: formData.status,
        tipoAcesso: formData.tipoAcesso,
        recursoHumanoId: undefined,
        dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
        usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
        tenantId:
          formData.role === 'USER' || formData.role === 'TENANT_ADMIN'
            ? formData.tenantId || null
            : null,
        role: formData.role,
      });

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Regra 2: no módulo Usuários nunca aparece GLOBAL_ADMIN (esse role é exclusivo do módulo Usuários Globais).
  // Regra 4: apenas GLOBAL_ADMIN pode atribuir TENANT_ADMIN.
  const availableRoles: Array<'TENANT_ADMIN' | 'USER'> =
    user?.role === 'GLOBAL_ADMIN' ? ['TENANT_ADMIN', 'USER'] : ['USER'];

  const showTabs = !!data;
  const isCoordenacao = formData.tipoAcesso === 'Coordenação';
  const tabCount = showTabs ? (isCoordenacao ? 4 : 3) : 1;
  const gridColsClass =
    tabCount === 4 ? 'grid-cols-4' : tabCount === 3 ? 'grid-cols-3' : 'grid-cols-1';
  const shouldShowTenantSelect = showTenantSelector && user?.role === 'GLOBAL_ADMIN';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Usuario' : 'Novo Usuario'}</DialogTitle>
          <DialogDescription>Preencha os dados do usuario.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className={`grid w-full ${gridColsClass}`}>
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            {showTabs && <TabsTrigger value="unidades">Unidades</TabsTrigger>}
            {showTabs && <TabsTrigger value="programas">Programas</TabsTrigger>}
            {showTabs && isCoordenacao && <TabsTrigger value="equipes">Equipes</TabsTrigger>}
          </TabsList>

          <TabsContent value="dados" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                O cadastro principal do usuario e os vinculos desta tela usam a API local.
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    <AvatarImage src={fotoPreview || undefined} alt={formData.nome} />
                    <AvatarFallback className="text-lg bg-muted">
                      {formData.nome ? (
                        getInitials(formData.nome)
                      ) : (
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {fotoPreview && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                      onClick={handleRemoveFoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Foto do Usuario</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {fotoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Maximo 2MB.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Codigo Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, codigoExterno: event.target.value }))
                    }
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, nome: event.target.value }))
                    }
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuario</Label>
                  <Input
                    id="usuario"
                    value={formData.usuario}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, usuario: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, senha: event.target.value }))
                  }
                  required={!data}
                  placeholder={data ? '••••••••' : ''}
                />
                <p
                  className={`text-xs ${showPasswordValidation ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {PASSWORD_POLICY_MESSAGE}
                </p>
                {data && (
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para manter a senha atual.
                  </p>
                )}
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select
                    value={formData.perfil}
                    onValueChange={(value) =>
                      setFormData((current) => ({ ...current, perfil: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil..." />
                    </SelectTrigger>
                    <SelectContent>
                      {perfis.map((perfil) => (
                        <SelectItem key={perfil.id} value={perfil.nome}>
                          {perfil.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Acesso</Label>
                  <Select
                    value={formData.tipoAcesso}
                    onValueChange={(value) =>
                      setFormData((current) => ({ ...current, tipoAcesso: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operacional">Operacional</SelectItem>
                      <SelectItem value="Coordenação">Coordenação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData((current) => ({
                        ...current,
                        role: value as 'TENANT_ADMIN' | 'USER',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {shouldShowTenantSelect && (
                  <div className="space-y-2">
                    <Label>Tenant</Label>
                    <Select
                      value={formData.tenantId}
                      onValueChange={(value) =>
                        setFormData((current) => ({ ...current, tenantId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tenant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      status: value as 'Ativo' | 'Inativo' | 'Bloqueado',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descricao</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, descricao: event.target.value }))
                  }
                  rows={3}
                />
              </div>

              <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
                {navigation && <ModalNavigation {...navigation} />}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    {readOnly ? 'Fechar' : 'Cancelar'}
                  </Button>
                  {!readOnly && (
                    <Button
                      type="submit"
                      className="gradient-primary hover:opacity-90"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          {showTabs && (
            <TabsContent value="unidades" className="mt-4">
              <UnidadesNegocioTab usuarioId={data.id} />
            </TabsContent>
          )}

          {showTabs && (
            <TabsContent value="programas" className="mt-4">
              <UsuarioProgramasTab usuarioId={data.id} />
            </TabsContent>
          )}

          {showTabs && isCoordenacao && (
            <TabsContent value="equipes" className="mt-4">
              <UsuarioEquipesTab usuarioId={data.id} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
