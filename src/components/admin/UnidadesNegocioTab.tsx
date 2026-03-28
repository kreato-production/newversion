import { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ApiUsuariosRepository } from '@/modules/usuarios/usuarios.api.repository';

interface UnidadesNegocioTabProps {
  usuarioId: string;
}

const apiRepository = new ApiUsuariosRepository();

export const UnidadesNegocioTab = ({ usuarioId }: UnidadesNegocioTabProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState<{ id: string; nome: string }[]>(
    [],
  );
  const [selectedUnidade, setSelectedUnidade] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const data = await apiRepository.listUnidades(usuarioId);
      setUnidades(data.vinculadas);
      setUnidadesDisponiveis(data.disponiveis);
    } catch (error) {
      console.error('Error fetching unidades:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar unidades de negocio',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, usuarioId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!selectedUnidade) return;

    const unidade = unidadesDisponiveis.find((item) => item.id === selectedUnidade);
    if (!unidade || unidades.find((item) => item.id === selectedUnidade)) return;

    try {
      await apiRepository.addUnidade(usuarioId, selectedUnidade);

      setUnidades((current) => [...current, unidade]);
      setSelectedUnidade('');
      toast({ title: 'Sucesso', description: 'Unidade vinculada com sucesso' });
    } catch (error) {
      console.error('Error adding unidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao vincular unidade',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await apiRepository.removeUnidade(usuarioId, id);

      setUnidades((current) => current.filter((item) => item.id !== id));
      toast({ title: 'Sucesso', description: 'Unidade desvinculada com sucesso' });
    } catch (error) {
      console.error('Error removing unidade:', error);
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
          <label className="text-sm text-muted-foreground">Adicionar Unidade de Negocio</label>
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma unidade..." />
            </SelectTrigger>
            <SelectContent>
              {unidadesDisponiveis
                .filter((item) => !unidades.find((selected) => selected.id === item.id))
                .map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nome}
                  </SelectItem>
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
              <TableHead>Unidade de Negocio</TableHead>
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
                    onClick={() => void handleRemove(unidade.id)}
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
          <p>Nenhuma unidade de negocio vinculada.</p>
          <p className="text-sm">Adicione unidades acima.</p>
        </div>
      )}
    </div>
  );
};
