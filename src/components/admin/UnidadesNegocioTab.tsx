import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UnidadesNegocioTabProps {
  usuarioId: string;
}

export const UnidadesNegocioTab = ({ usuarioId }: UnidadesNegocioTabProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      // Fetch all available units
      const { data: allUnidades, error: allError } = await supabase
        .from('unidades_negocio')
        .select('id, nome')
        .order('nome');

      if (allError) throw allError;
      setUnidadesDisponiveis(allUnidades || []);

      // Fetch user's linked units
      const { data: linkedUnidades, error: linkedError } = await supabase
        .from('usuario_unidades')
        .select('unidade_id, unidades_negocio:unidade_id(id, nome)')
        .eq('usuario_id', usuarioId);

      if (linkedError) throw linkedError;

      const userUnidades = (linkedUnidades || [])
        .map((item: any) => item.unidades_negocio)
        .filter(Boolean);
      
      setUnidades(userUnidades);
    } catch (err) {
      console.error('Error fetching unidades:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar unidades de negócio',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, usuarioId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!selectedUnidade) return;

    const unidade = unidadesDisponiveis.find((u) => u.id === selectedUnidade);
    if (!unidade || unidades.find((u) => u.id === selectedUnidade)) return;

    try {
      const { error } = await supabase
        .from('usuario_unidades')
        .insert({
          usuario_id: usuarioId,
          unidade_id: selectedUnidade,
        });

      if (error) throw error;

      setUnidades([...unidades, unidade]);
      setSelectedUnidade('');
      toast({ title: 'Sucesso', description: 'Unidade vinculada com sucesso' });
    } catch (err) {
      console.error('Error adding unidade:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao vincular unidade',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('usuario_unidades')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('unidade_id', id);

      if (error) throw error;

      setUnidades(unidades.filter((u) => u.id !== id));
      toast({ title: 'Sucesso', description: 'Unidade desvinculada com sucesso' });
    } catch (err) {
      console.error('Error removing unidade:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao desvincular unidade',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm text-muted-foreground">Adicionar Unidade de Negócio</label>
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma unidade..." />
            </SelectTrigger>
            <SelectContent>
              {unidadesDisponiveis
                .filter((u) => !unidades.find((uu) => uu.id === u.id))
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} disabled={!selectedUnidade} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {unidades.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade de Negócio</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidades.map((unidade) => (
              <TableRow key={unidade.id}>
                <TableCell className="font-medium">{unidade.nome}</TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(unidade.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma unidade de negócio vinculada.</p>
          <p className="text-sm">Adicione unidades acima.</p>
        </div>
      )}
    </div>
  );
};