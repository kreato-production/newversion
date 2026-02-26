import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, Video, Users, Building2 } from 'lucide-react';

const MODULES = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Produção', label: 'Produção', icon: Video },
  { id: 'Recursos', label: 'Recursos', icon: Users },
  { id: 'Administração', label: 'Administração', icon: Building2 },
];

export const TenantModulosTab = ({ tenantId }: { tenantId: string }) => {
  const { toast } = useToast();
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data, error } = await supabase
          .from('tenant_modulos')
          .select('modulo')
          .eq('tenant_id', tenantId);

        if (error) throw error;
        
        setEnabledModules(new Set((data || []).map((m: any) => m.modulo)));
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [tenantId]);

  const toggleModule = async (modulo: string, enabled: boolean) => {
    // Optimistic update
    const newSet = new Set(enabledModules);
    if (enabled) newSet.add(modulo);
    else newSet.delete(modulo);
    setEnabledModules(newSet);

    try {
      if (enabled) {
        const { error } = await supabase
          .from('tenant_modulos')
          .insert({ tenant_id: tenantId, modulo });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_modulos')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('modulo', modulo);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling module:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar módulo', variant: 'destructive' });
      // Revert optimistic update
      setEnabledModules(prev => {
        const reverted = new Set(prev);
        if (enabled) reverted.delete(modulo);
        else reverted.add(modulo);
        return reverted;
      });
    }
  };

  if (isLoading) return <div className="p-4 text-muted-foreground">Carregando módulos...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MODULES.map((mod) => {
        const Icon = mod.icon;
        const isEnabled = enabledModules.has(mod.id);
        
        return (
          <div 
            key={mod.id} 
            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
              isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-medium">{mod.label}</p>
                <p className="text-xs text-muted-foreground">
                  {isEnabled ? 'Habilitado' : 'Desabilitado'}
                </p>
              </div>
            </div>
            
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => toggleModule(mod.id, checked)}
            />
          </div>
        );
      })}
    </div>
  );
};
