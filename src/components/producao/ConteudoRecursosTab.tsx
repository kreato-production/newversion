import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currencies';
import { conteudosRelacionamentosApi } from '@/modules/conteudos/conteudos-relacionamentos.api';

interface ConteudoRecursosTabProps {
  conteudoId: string;
  tabelaPrecoId: string;
  moeda?: string;
  readOnly?: boolean;
  tipo: 'tecnico' | 'fisico';
}

interface RecursoItem {
  id: string;
  recursoId: string;
  recursoNome: string;
  valorHora: number;
  quantidade: number;
  quantidadeHoras: number;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
}

interface AvailableResource {
  recursoId: string;
  recursoNome: string;
  valorHora: number;
}

export const ConteudoRecursosTab = ({
  conteudoId,
  tabelaPrecoId,
  moeda = 'BRL',
  readOnly = false,
  tipo,
}: ConteudoRecursosTabProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<RecursoItem[]>([]);
  const [availableResources, setAvailableResources] = useState<AvailableResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResourceId, setSelectedResourceId] = useState('');

  const label = tipo === 'tecnico' ? 'Recurso TÃ©cnico' : 'Recurso FÃ­sico';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await conteudosRelacionamentosApi.listResources(
        conteudoId,
        tipo,
        tabelaPrecoId || undefined,
      );

      setItems(
        response.items.map((item) => ({
          id: item.id,
          recursoId: item.recursoId,
          recursoNome: item.recursoNome,
          valorHora: Number(item.valorHora) || 0,
          quantidade: Number(item.quantidade) || 1,
          quantidadeHoras: Number(item.quantidadeHoras) || 0,
          valorTotal: Number(item.valorTotal) || 0,
          descontoPercentual: Number(item.descontoPercentual) || 0,
          valorComDesconto: Number(item.valorComDesconto) || 0,
        })),
      );
      setAvailableResources(
        response.availableResources.map((item) => ({
          recursoId: item.recursoId,
          recursoNome: item.recursoNome,
          valorHora: Number(item.valorHora) || 0,
        })),
      );
    } catch (error) {
      console.error('Error fetching conteudo resources:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar recursos do conteÃºdo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (conteudoId) {
      void fetchData();
      return;
    }

    setItems([]);
    setAvailableResources([]);
    setIsLoading(false);
  }, [conteudoId, tabelaPrecoId, tipo]);

  const calcValues = (valorHora: number, quantidade: number, horas: number, desconto: number) => {
    const totalHoras = quantidade * horas;
    const total = valorHora * totalHoras;
    const comDesconto = total - (total * desconto) / 100;
    return { valorTotal: total, valorComDesconto: comDesconto };
  };

  const handleAddResource = async () => {
    if (!selectedResourceId || readOnly) return;
    const resource = availableResources.find((item) => item.recursoId === selectedResourceId);
    if (!resource) return;

    try {
      const inserted = await conteudosRelacionamentosApi.addResource(conteudoId, tipo, {
        tabelaPrecoId: tabelaPrecoId || null,
        recursoId: resource.recursoId,
        valorHora: resource.valorHora,
        quantidade: 1,
        quantidadeHoras: 0,
        valorTotal: 0,
        descontoPercentual: 0,
        valorComDesconto: 0,
      });

      setItems((prev) => [
        ...prev,
        {
          id: inserted.id,
          recursoId: inserted.recursoId,
          recursoNome: inserted.recursoNome,
          valorHora: Number(inserted.valorHora) || 0,
          quantidade: Number(inserted.quantidade) || 1,
          quantidadeHoras: Number(inserted.quantidadeHoras) || 0,
          valorTotal: Number(inserted.valorTotal) || 0,
          descontoPercentual: Number(inserted.descontoPercentual) || 0,
          valorComDesconto: Number(inserted.valorComDesconto) || 0,
        },
      ]);
      setAvailableResources((prev) => prev.filter((item) => item.recursoId !== selectedResourceId));
      setSelectedResourceId('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao adicionar recurso', variant: 'destructive' });
    }
  };

  const handleRemove = async (index: number) => {
    const item = items[index];
    if (readOnly || !item?.id) return;

    try {
      await conteudosRelacionamentosApi.removeResource(conteudoId, item.id, tipo);
      setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
      setAvailableResources((prev) => [
        ...prev,
        {
          recursoId: item.recursoId,
          recursoNome: item.recursoNome,
          valorHora: item.valorHora,
        },
      ]);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao remover recurso', variant: 'destructive' });
    }
  };

  const handleFieldChange = async (
    index: number,
    field: 'quantidade' | 'quantidadeHoras' | 'descontoPercentual',
    value: number,
  ) => {
    const item = items[index];
    if (!item?.id) return;

    const quantidade = field === 'quantidade' ? value : item.quantidade;
    const horas = field === 'quantidadeHoras' ? value : item.quantidadeHoras;
    const desconto = field === 'descontoPercentual' ? value : item.descontoPercentual;
    const { valorTotal, valorComDesconto } = calcValues(
      item.valorHora,
      quantidade,
      horas,
      desconto,
    );

    setItems((prev) =>
      prev.map((current, itemIndex) =>
        itemIndex === index
          ? {
              ...current,
              quantidade,
              quantidadeHoras: horas,
              descontoPercentual: desconto,
              valorTotal,
              valorComDesconto,
            }
          : current,
      ),
    );

    try {
      await conteudosRelacionamentosApi.updateResource(conteudoId, item.id, tipo, {
        quantidade,
        quantidadeHoras: horas,
        descontoPercentual: desconto,
        valorTotal,
        valorComDesconto,
      });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao atualizar recurso', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tabelaPrecoId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Selecione uma Tabela de PreÃ§o para visualizar os recursos.
      </p>
    );
  }

  const totalGeral = items.reduce((sum, item) => sum + item.valorTotal, 0);
  const totalComDesconto = items.reduce((sum, item) => sum + item.valorComDesconto, 0);

  return (
    <div className="space-y-4">
      {!readOnly && availableResources.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={`Selecione um ${label.toLowerCase()} para adicionar...`} />
            </SelectTrigger>
            <SelectContent>
              {availableResources.map((resource) => (
                <SelectItem key={resource.recursoId} value={resource.recursoId}>
                  {resource.recursoNome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            onClick={handleAddResource}
            disabled={!selectedResourceId}
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p>Nenhum {label.toLowerCase()} adicionado.</p>
          <p className="text-sm mt-1">Selecione um recurso acima para adicionar à lista.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{label}</TableHead>
                <TableHead className="w-28 text-right">Valor/Hora</TableHead>
                <TableHead className="w-20 text-right">Qtd.</TableHead>
                <TableHead className="w-24 text-right">Horas</TableHead>
                <TableHead className="w-32 text-right">Valor Total</TableHead>
                <TableHead className="w-24 text-right">Desconto %</TableHead>
                <TableHead className="w-32 text-right">Valor c/ Desc.</TableHead>
                {!readOnly && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.recursoNome}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.valorHora, moeda)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!readOnly ? (
                      <Input
                        type="number"
                        value={item.quantidade || ''}
                        onChange={(event) =>
                          void handleFieldChange(
                            index,
                            'quantidade',
                            parseInt(event.target.value, 10) || 0,
                          )
                        }
                        className="w-16 text-right h-8 ml-auto"
                        min="1"
                        step="1"
                      />
                    ) : (
                      item.quantidade || 1
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!readOnly ? (
                      <Input
                        type="number"
                        value={item.quantidadeHoras || ''}
                        onChange={(event) =>
                          void handleFieldChange(
                            index,
                            'quantidadeHoras',
                            parseFloat(event.target.value) || 0,
                          )
                        }
                        className="w-20 text-right h-8 ml-auto"
                        step="0.5"
                        min="0"
                      />
                    ) : (
                      item.quantidadeHoras || '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.valorTotal, moeda)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!readOnly ? (
                      <Input
                        type="number"
                        value={item.descontoPercentual || ''}
                        onChange={(event) =>
                          void handleFieldChange(
                            index,
                            'descontoPercentual',
                            parseFloat(event.target.value) || 0,
                          )
                        }
                        className="w-20 text-right h-8 ml-auto"
                        step="0.5"
                        min="0"
                        max="100"
                      />
                    ) : (
                      `${item.descontoPercentual}%`
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.valorComDesconto, moeda)}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => void handleRemove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={4} className="text-right">
                  Totais:
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totalGeral, moeda)}
                </TableCell>
                <TableCell />
                <TableCell className="text-right font-mono">
                  {formatCurrency(totalComDesconto, moeda)}
                </TableCell>
                {!readOnly && <TableCell />}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
