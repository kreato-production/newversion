import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currencies';
import { ApiTabelasPrecoRepository } from '@/modules/tabelas-preco/tabelas-preco.api.repository';
import type {
  RecursoOption,
  TabelaPrecoRecursoItem,
} from '@/modules/tabelas-preco/tabelas-preco.types';

interface Props {
  tabelaPrecoId: string;
  readOnly?: boolean;
  moeda?: string;
}

const repository = new ApiTabelasPrecoRepository();

export const TabelaPrecoRecursosTecnicosTab = ({
  tabelaPrecoId,
  readOnly,
  moeda = 'BRL',
}: Props) => {
  const { toast } = useToast();
  const [items, setItems] = useState<TabelaPrecoRecursoItem[]>([]);
  const [recursos, setRecursos] = useState<RecursoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecurso, setSelectedRecurso] = useState('');
  const [valorHora, setValorHora] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listRecursos(tabelaPrecoId, 'tecnico');
      setItems(response.items);
      setRecursos(response.recursos);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar recursos técnicos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tabelaPrecoId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!selectedRecurso || !valorHora) {
      return;
    }

    try {
      const response = await repository.addRecurso(
        tabelaPrecoId,
        'tecnico',
        selectedRecurso,
        parseFloat(valorHora),
      );
      setItems(response.items);
      setRecursos(response.recursos);
      toast({ title: 'Sucesso', description: 'Recurso técnico adicionado!' });
      setSelectedRecurso('');
      setValorHora('');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: `Erro ao adicionar recurso técnico: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await repository.removeRecurso(tabelaPrecoId, 'tecnico', id);
      await fetchData();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: `Erro ao remover recurso técnico: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const availableRecursos = recursos.filter(
    (recurso) => !items.some((item) => item.recursoId === recurso.id),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={selectedRecurso} onValueChange={setSelectedRecurso}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um recurso técnico" />
              </SelectTrigger>
              <SelectContent>
                {availableRecursos.map((recurso) => (
                  <SelectItem key={recurso.id} value={recurso.id}>
                    {recurso.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Input
              type="number"
              placeholder="Valor/Hora"
              value={valorHora}
              onChange={(e) => setValorHora(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!selectedRecurso || !valorHora}
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
      )}

      {!readOnly && recursos.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum recurso técnico cadastrado localmente para vincular.
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum recurso técnico adicionado.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recurso Técnico</TableHead>
              <TableHead className="w-32">Valor/Hora</TableHead>
              {!readOnly && <TableHead className="w-16" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.recursoNome}</TableCell>
                <TableCell>{formatCurrency(Number(item.valorHora), moeda)}</TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
