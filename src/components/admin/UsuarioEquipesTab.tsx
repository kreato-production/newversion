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
import { Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiUsuariosRepository } from '@/modules/usuarios/usuarios.api.repository';

const apiRepository = new ApiUsuariosRepository();

export const UsuarioEquipesTab = ({ usuarioId }: { usuarioId: string }) => {
  const { toast } = useToast();
  const [equipes, setEquipes] = useState<{ id: string; codigo: string; descricao: string }[]>([]);
  const [disponiveis, setDisponiveis] = useState<
    { id: string; codigo: string; descricao: string }[]
  >([]);
  const [selectedEquipeId, setSelectedEquipeId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const data = await apiRepository.listEquipes(usuarioId);
      setEquipes(data.vinculadas);
      setDisponiveis(data.disponiveis);
    } catch (error) {
      console.error('Error fetching equipes do usuario:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar equipes do usuario',
        variant: 'destructive',
      });
    }
  }, [usuarioId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!selectedEquipeId) return;

    try {
      await apiRepository.addEquipe(usuarioId, selectedEquipeId);
      setSelectedEquipeId('');
      toast({ title: 'Sucesso', description: 'Equipe adicionada!' });
      await fetchData();
    } catch (error) {
      console.error('Error adding equipe:', error);
      toast({ title: 'Erro', description: 'Erro ao adicionar equipe', variant: 'destructive' });
    }
  };

  const handleRemove = async (equipeId: string) => {
    try {
      await apiRepository.removeEquipe(usuarioId, equipeId);
      toast({ title: 'Sucesso', description: 'Equipe removida!' });
      await fetchData();
    } catch (error) {
      console.error('Error removing equipe:', error);
      toast({ title: 'Erro', description: 'Erro ao remover equipe', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <label className="text-sm text-muted-foreground">Selecionar Equipe</label>
          <Select value={selectedEquipeId} onValueChange={setSelectedEquipeId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma equipe..." />
            </SelectTrigger>
            <SelectContent>
              {disponiveis.map((equipe) => (
                <SelectItem key={equipe.id} value={equipe.id}>
                  {equipe.codigo} - {equipe.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          onClick={() => void handleAdd()}
          disabled={!selectedEquipeId}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {equipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhuma equipe vinculada a este usuario.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codigo</TableHead>
              <TableHead>Descricao</TableHead>
              <TableHead className="w-16">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipes.map((equipe) => (
              <TableRow key={equipe.id}>
                <TableCell className="font-mono">{equipe.codigo}</TableCell>
                <TableCell>{equipe.descricao}</TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void handleRemove(equipe.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
