import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { supabase } from '@/integrations/supabase/client';
import { getBackendAccessToken, isBackendDataProviderEnabled } from '@/lib/api/http';
import { ApiTenantsRepository } from '@/modules/tenants/tenants.api.repository';
import { useToast } from '@/hooks/use-toast';
import type { Tenant } from '@/pages/admin/Tenants';
import { Loader2 } from 'lucide-react';
import { TenantLicencasTab } from './TenantLicencasTab';
import { TenantModulosTab } from './TenantModulosTab';
import { TenantUnidadesTab } from './TenantUnidadesTab';

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data: Tenant | null;
}

const apiRepository = new ApiTenantsRepository();

export const TenantFormModal = ({ isOpen, onClose, onSave, data }: TenantFormModalProps) => {
  const { toast } = useToast();
  const shouldUseBackend = useMemo(
    () => isBackendDataProviderEnabled() || Boolean(getBackendAccessToken()),
    [],
  );
  const [activeTab, setActiveTab] = useState('dados');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    plano: 'Mensal',
    status: 'Ativo',
    notas: '',
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
      });
    } else {
      setFormData({
        nome: '',
        plano: 'Mensal',
        status: 'Ativo',
        notas: '',
      });
    }

    setActiveTab('dados');
  }, [isOpen, data]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      if (shouldUseBackend) {
        await apiRepository.save({
          id: data?.id,
          nome: formData.nome,
          plano: formData.plano as 'Mensal' | 'Anual',
          status: formData.status as 'Ativo' | 'Inativo' | 'Bloqueado',
          notas: formData.notas,
        });
      } else if (data) {
        const { error } = await supabase
          .from('tenants')
          .update({
            nome: formData.nome,
            plano: formData.plano,
            status: formData.status,
            notas: formData.notas,
          })
          .eq('id', data.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('tenants')
          .insert({
            nome: formData.nome,
            plano: formData.plano,
            status: formData.status,
            notas: formData.notas,
          });

        if (error) {
          throw error;
        }
      }

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
        <DialogHeader className="p-6 pb-2 border-b shrink-0">
          <DialogTitle>{data ? 'Editar Tenant' : 'Novo Tenant'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
                <TabsTrigger value="licencas" disabled={!data}>Licencas</TabsTrigger>
                <TabsTrigger value="unidades" disabled={!data}>Unidades de Negocio</TabsTrigger>
                <TabsTrigger value="modulos" disabled={!data}>Modulos</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/10">
              <TabsContent value="dados" className="p-6 mt-0 h-full">
                <form id="tenant-form" onSubmit={handleSubmit} className="space-y-4">
                  {data && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ID</Label>
                        <Input value={data.id} disabled className="bg-muted font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Criacao</Label>
                        <Input value={new Date(data.createdAt).toLocaleString()} disabled className="bg-muted" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
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
                      <Label htmlFor="plano">Plano <span className="text-destructive">*</span></Label>
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
                      <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
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

        <div className="p-6 border-t bg-background shrink-0 flex justify-end gap-2">
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
      </DialogContent>
    </Dialog>
  );
};
