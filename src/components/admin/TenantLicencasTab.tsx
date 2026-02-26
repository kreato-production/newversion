import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Licenca {
  id: string;
  data_inicio: string;
  data_fim: string;
}

export const TenantLicencasTab = ({ tenantId }: { tenantId: string }) => {
  const { toast } = useToast();
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLicenca, setNewLicenca] = useState({
    data_inicio: '',
    data_fim: '',
  });

  const fetchLicencas = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_licencas')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setLicencas(data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicencas();
  }, [tenantId]);

  const handleAdd = async () => {
    if (!newLicenca.data_inicio || !newLicenca.data_fim) {
      toast({ title: 'Erro', description: 'Preencha as datas', variant: 'destructive' });
      return;
    }

    if (newLicenca.data_fim < newLicenca.data_inicio) {
      toast({ title: 'Erro', description: 'Data fim deve ser maior que início', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('tenant_licencas')
        .insert({
          tenant_id: tenantId,
          data_inicio: newLicenca.data_inicio,
          data_fim: newLicenca.data_fim,
        });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Licença adicionada' });
      setNewLicenca({ data_inicio: '', data_fim: '' });
      fetchLicencas();
    } catch (error: any) {
      console.error('Error adding license:', error);
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao adicionar licença', 
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tenant_licencas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Licença removida' });
      fetchLicencas();
    } catch (error) {
      console.error('Error deleting license:', error);
      toast({ title: 'Erro', description: 'Erro ao remover licença', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end bg-card p-4 rounded-lg border">
        <div className="flex-1 space-y-2">
          <span className="text-sm font-medium">Data Início</span>
          <Input
            type="date"
            value={newLicenca.data_inicio}
            onChange={(e) => setNewLicenca(prev => ({ ...prev, data_inicio: e.target.value }))}
          />
        </div>
        <div className="flex-1 space-y-2">
          <span className="text-sm font-medium">Data Fim</span>
          <Input
            type="date"
            value={newLicenca.data_fim}
            onChange={(e) => setNewLicenca(prev => ({ ...prev, data_fim: e.target.value }))}
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Período
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licencas.map((licenca) => {
              const inicio = parseISO(licenca.data_inicio);
              const fim = parseISO(licenca.data_fim);
              const now = new Date();
              const isActive = now >= inicio && now <= fim;
              const isExpired = now > fim;
              
              // Calculate duration in days approx
              const diffTime = Math.abs(fim.getTime() - inicio.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

              return (
                <TableRow key={licenca.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(inicio, 'dd/MM/yyyy')} a {format(fim, 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>{diffDays} dias</TableCell>
                  <TableCell>
                    {isActive ? (
                      <span className="text-green-600 font-medium bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs">Vigente</span>
                    ) : isExpired ? (
                      <span className="text-red-600 font-medium bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-xs">Expirada</span>
                    ) : (
                      <span className="text-blue-600 font-medium bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs">Futura</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(licenca.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {licencas.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma licença cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
