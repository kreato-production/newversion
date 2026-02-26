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
import { Plus, Trash2, Building2, Save, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Unidade {
  id: string;
  codigo_externo: string | null;
  nome: string;
  moeda: string;
  descricao: string | null;
  tenant_id: string; // Explicitly showing tenant relationship
}

export const TenantUnidadesTab = ({ tenantId }: { tenantId: string }) => {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUnidade, setNewUnidade] = useState({
    codigo_externo: '',
    nome: '',
    moeda: 'BRL',
    descricao: '',
  });

  const fetchUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from('unidades_negocio')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nome');

      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error('Error fetching business units:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, [tenantId]);

  const handleAdd = async () => {
    if (!newUnidade.nome) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('unidades_negocio')
        .insert({
          tenant_id: tenantId,
          codigo_externo: newUnidade.codigo_externo || null,
          nome: newUnidade.nome,
          moeda: newUnidade.moeda,
          descricao: newUnidade.descricao || null,
        });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Unidade adicionada' });
      setNewUnidade({ codigo_externo: '', nome: '', moeda: 'BRL', descricao: '' });
      setIsAdding(false);
      fetchUnidades();
    } catch (error: any) {
      console.error('Error adding unit:', error);
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao adicionar unidade', 
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta unidade? Dados relacionados podem ser afetados.')) return;

    try {
      const { error } = await supabase
        .from('unidades_negocio')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Unidade removida' });
      fetchUnidades();
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast({ title: 'Erro', description: 'Erro ao remover unidade', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Unidades de Negócio associadas a este tenant.
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Unidade
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-card p-4 rounded-lg border space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Código Externo</span>
              <Input
                value={newUnidade.codigo_externo}
                onChange={(e) => setNewUnidade(prev => ({ ...prev, codigo_externo: e.target.value }))}
                maxLength={10}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Nome <span className="text-destructive">*</span></span>
              <Input
                value={newUnidade.nome}
                onChange={(e) => setNewUnidade(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Moeda</span>
              <Select 
                value={newUnidade.moeda}
                onValueChange={(val) => setNewUnidade(prev => ({ ...prev, moeda: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Descrição</span>
            <Input
              value={newUnidade.descricao}
              onChange={(e) => setNewUnidade(prev => ({ ...prev, descricao: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Moeda</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidades.map((unidade) => (
              <TableRow key={unidade.id}>
                <TableCell className="font-mono text-xs">{unidade.codigo_externo || '-'}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {unidade.nome}
                  </div>
                </TableCell>
                <TableCell>{unidade.moeda}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(unidade.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {unidades.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma unidade cadastrada neste tenant
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
