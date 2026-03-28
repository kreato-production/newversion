import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tv, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiUsuariosRepository } from '@/modules/usuarios/usuarios.api.repository';

const apiRepository = new ApiUsuariosRepository();

export const UsuarioProgramasTab = ({ usuarioId }: { usuarioId: string }) => {
  const { toast } = useToast();
  const [programas, setProgramas] = useState<{ id: string; nome: string }[]>([]);
  const [disponiveis, setDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [selectedProgramaId, setSelectedProgramaId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const data = await apiRepository.listProgramas(usuarioId);
      setProgramas(data.vinculados);
      setDisponiveis(data.disponiveis);
    } catch (error) {
      console.error('Error fetching programas do usuario:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar programas do usuario',
        variant: 'destructive',
      });
    }
  }, [usuarioId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!selectedProgramaId) return;

    try {
      await apiRepository.addPrograma(usuarioId, selectedProgramaId);
      setSelectedProgramaId('');
      toast({ title: 'Sucesso', description: 'Programa adicionado!' });
      await fetchData();
    } catch (error) {
      console.error('Error adding programa:', error);
      toast({ title: 'Erro', description: 'Erro ao adicionar programa', variant: 'destructive' });
    }
  };

  const handleRemove = async (programaId: string) => {
    try {
      await apiRepository.removePrograma(usuarioId, programaId);
      toast({ title: 'Sucesso', description: 'Programa removido!' });
      await fetchData();
    } catch (error) {
      console.error('Error removing programa:', error);
      toast({ title: 'Erro', description: 'Erro ao remover programa', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <label className="text-sm text-muted-foreground">Selecionar Programa</label>
          <SearchableSelect
            options={disponiveis.map((item) => ({ value: item.id, label: item.nome }))}
            value={selectedProgramaId}
            onValueChange={setSelectedProgramaId}
            placeholder="Selecione um programa..."
            searchPlaceholder="Pesquisar programa..."
            emptyMessage="Nenhum programa encontrado."
          />
        </div>
        <Button
          type="button"
          onClick={() => void handleAdd()}
          disabled={!selectedProgramaId}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {programas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Tv className="w-12 h-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhum programa vinculado a este usuario.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Programa</TableHead>
              <TableHead className="w-16">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programas.map((programa) => (
              <TableRow key={programa.id}>
                <TableCell>{programa.nome}</TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void handleRemove(programa.id)}
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
