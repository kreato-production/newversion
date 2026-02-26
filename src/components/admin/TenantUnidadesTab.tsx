import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2, Building2, Link } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UnidadeNegocioFormModal } from './UnidadeNegocioFormModal';

interface Unidade {
  id: string;
  codigo_externo: string | null;
  nome: string;
  moeda: string;
  descricao: string | null;
  tenant_id: string;
}

export const TenantUnidadesTab = ({ tenantId }: { tenantId: string }) => {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [availableUnidades, setAvailableUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  const fetchAvailableUnidades = async () => {
    try {
      // Fetch units that have NO tenant_id (unassigned)
      const { data, error } = await supabase
        .from('unidades_negocio')
        .select('*')
        .is('tenant_id', null)
        .order('nome');

      if (error) throw error;
      setAvailableUnidades(data || []);
    } catch (error) {
      console.error('Error fetching available units:', error);
    }
  };

  useEffect(() => {
    fetchUnidades();
    fetchAvailableUnidades();
  }, [tenantId]);

  const handleLink = async () => {
    if (!selectedUnidadeId) return;

    try {
      const { error } = await supabase
        .from('unidades_negocio')
        .update({ tenant_id: tenantId })
        .eq('id', selectedUnidadeId);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Unidade associada ao tenant' });
      setSelectedUnidadeId('');
      setIsLinking(false);
      fetchUnidades();
      fetchAvailableUnidades();
    } catch (error: any) {
      console.error('Error linking unit:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao associar unidade', variant: 'destructive' });
    }
  };

  const handleCreateNew = async (data: any) => {
    try {
      const { error } = await supabase
        .from('unidades_negocio')
        .upsert({
          id: data.id,
          tenant_id: tenantId,
          codigo_externo: data.codigoExterno || null,
          nome: data.nome,
          moeda: data.moeda || 'BRL',
          descricao: data.descricao || null,
          imagem_url: data.imagem || null,
        });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Unidade criada e associada ao tenant' });
      fetchUnidades();
      fetchAvailableUnidades();
    } catch (error: any) {
      console.error('Error creating unit:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao criar unidade', variant: 'destructive' });
    }
  };

  const handleUnlink = async (id: string) => {
    if (!confirm('Deseja desassociar esta unidade deste tenant?')) return;

    try {
      const { error } = await supabase
        .from('unidades_negocio')
        .update({ tenant_id: null })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Unidade desassociada' });
      fetchUnidades();
      fetchAvailableUnidades();
    } catch (error) {
      console.error('Error unlinking unit:', error);
      toast({ title: 'Erro', description: 'Erro ao desassociar unidade', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Unidades de Negócio associadas a este tenant.
        </div>
        <div className="flex gap-2">
          {!isLinking && (
            <>
              <Button variant="outline" onClick={() => setIsLinking(true)} size="sm">
                <Link className="mr-2 h-4 w-4" />
                Associar Existente
              </Button>
              <Button onClick={() => setIsCreating(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Unidade
              </Button>
            </>
          )}
        </div>
      </div>

      {isLinking && (
        <div className="bg-card p-4 rounded-lg border space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-2">
            <span className="text-sm font-medium">Selecione uma Unidade de Negócio existente</span>
            <Select value={selectedUnidadeId} onValueChange={setSelectedUnidadeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar unidade..." />
              </SelectTrigger>
              <SelectContent>
                {availableUnidades.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Nenhuma unidade disponível
                  </SelectItem>
                ) : (
                  availableUnidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome} {u.codigo_externo ? `(${u.codigo_externo})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setIsLinking(false); setSelectedUnidadeId(''); }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleLink} disabled={!selectedUnidadeId}>
              Associar
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
                  <Button variant="ghost" size="icon" onClick={() => handleUnlink(unidade.id)} title="Desassociar">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {unidades.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma unidade associada a este tenant
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UnidadeNegocioFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSave={handleCreateNew}
      />
    </div>
  );
};
