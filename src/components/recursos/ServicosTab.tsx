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

interface ServicosTabProps {
  fornecedorId: string;
}

export const ServicosTab = ({ fornecedorId }: ServicosTabProps) => {
  const [servicos, setServicos] = useState<{ id: string; nome: string }[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [selectedServico, setSelectedServico] = useState('');

  useEffect(() => {
    const storedServicos = localStorage.getItem('kreato_servicos');
    setServicosDisponiveis(storedServicos ? JSON.parse(storedServicos) : []);

    const storedFornecedorServicos = localStorage.getItem(`kreato_fornecedor_servicos_${fornecedorId}`);
    setServicos(storedFornecedorServicos ? JSON.parse(storedFornecedorServicos) : []);
  }, [fornecedorId]);

  const saveToStorage = (data: { id: string; nome: string }[]) => {
    localStorage.setItem(`kreato_fornecedor_servicos_${fornecedorId}`, JSON.stringify(data));
    setServicos(data);
  };

  const handleAdd = () => {
    if (!selectedServico) return;
    const servico = servicosDisponiveis.find((s) => s.id === selectedServico);
    if (!servico || servicos.find((s) => s.id === selectedServico)) return;

    saveToStorage([...servicos, servico]);
    setSelectedServico('');
  };

  const handleRemove = (id: string) => {
    saveToStorage(servicos.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm text-muted-foreground">Adicionar Serviço</label>
          <Select value={selectedServico} onValueChange={setSelectedServico}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um serviço..." />
            </SelectTrigger>
            <SelectContent>
              {servicosDisponiveis
                .filter((s) => !servicos.find((ss) => ss.id === s.id))
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} disabled={!selectedServico} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {servicos.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.map((servico) => (
              <TableRow key={servico.id}>
                <TableCell className="font-medium">{servico.nome}</TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(servico.id)}
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
          <p>Nenhum serviço vinculado.</p>
          <p className="text-sm">Adicione serviços acima.</p>
        </div>
      )}
    </div>
  );
};
