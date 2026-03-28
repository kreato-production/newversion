import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { ApiTenantsRepository } from '@/modules/tenants/tenants.api.repository';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, Video, Users, Building2 } from 'lucide-react';

const MODULES = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Produção', label: 'Produção', icon: Video },
  { id: 'Recursos', label: 'Recursos', icon: Users },
  { id: 'Administração', label: 'Administração', icon: Building2 },
];

const apiRepository = new ApiTenantsRepository();

export const TenantModulosTab = ({ tenantId }: { tenantId: string }) => {
  const { toast } = useToast();
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      setIsLoading(true);
      try {
        const data = await apiRepository.listModulos(tenantId);
        setEnabledModules(new Set(data));
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModules();
  }, [tenantId]);

  const toggleModule = async (modulo: string, enabled: boolean) => {
    const newSet = new Set(enabledModules);
    if (enabled) newSet.add(modulo);
    else newSet.delete(modulo);
    setEnabledModules(newSet);

    try {
      await apiRepository.setModulo(tenantId, { modulo, enabled });
    } catch (error) {
      console.error('Error toggling module:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar modulo', variant: 'destructive' });
      setEnabledModules((current) => {
        const reverted = new Set(current);
        if (enabled) reverted.delete(modulo);
        else reverted.add(modulo);
        return reverted;
      });
    }
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Carregando modulos...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MODULES.map((module) => {
        const Icon = module.icon;
        const isEnabled = enabledModules.has(module.id);

        return (
          <div
            key={module.id}
            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
              isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
              >
                <Icon size={20} />
              </div>
              <div>
                <p className="font-medium">{module.label}</p>
                <p className="text-xs text-muted-foreground">
                  {isEnabled ? 'Habilitado' : 'Desabilitado'}
                </p>
              </div>
            </div>

            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => void toggleModule(module.id, checked)}
            />
          </div>
        );
      })}
    </div>
  );
};
