import { useState, useEffect } from 'react';
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
import { Plus, Trash2 } from 'lucide-react';

interface UnidadesNegocioTabProps {
  usuarioId: string;
}

export const UnidadesNegocioTab = ({ usuarioId }: UnidadesNegocioTabProps) => {
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('kreato_unidades_negocio');
    setUnidadesDisponiveis(stored ? JSON.parse(stored) : []);

    const storedUsuarioUnidades = localStorage.getItem(`kreato_usuario_unidades_${usuarioId}`);
    setUnidades(storedUsuarioUnidades ? JSON.parse(storedUsuarioUnidades) : []);
  }, [usuarioId]);

  const saveToStorage = (data: { id: string; nome: string }[]) => {
    localStorage.setItem(`kreato_usuario_unidades_${usuarioId}`, JSON.stringify(data));
    setUnidades(data);
  };

  const handleAdd = () => {
    if (!selectedUnidade) return;
    const unidade = unidadesDisponiveis.find((u) => u.id === selectedUnidade);
    if (!unidade || unidades.find((u) => u.id === selectedUnidade)) return;

    saveToStorage([...unidades, unidade]);
    setSelectedUnidade('');
  };

  const handleRemove = (id: string) => {
    saveToStorage(unidades.filter((u) => u.id !== id));
  };

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
