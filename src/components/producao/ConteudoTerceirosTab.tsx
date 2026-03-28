import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Building2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';
import { conteudosRelacionamentosApi } from '@/modules/conteudos/conteudos-relacionamentos.api';

interface Servico {
  id: string;
  nome: string;
}

interface ConteudoTerceiro {
  id: string;
  servicoId: string;
  servicoNome: string;
  valorPrevisto: number;
}

interface ConteudoTerceirosTabProps {
  conteudoId: string;
  moeda?: string;
  readOnly?: boolean;
}

export const ConteudoTerceirosTab = ({
  conteudoId,
  moeda = 'BRL',
  readOnly = false,
}: ConteudoTerceirosTabProps) => {
  const { toast } = useToast();
  const [terceiros, setTerceiros] = useState<ConteudoTerceiro[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedServicoId, setSelectedServicoId] = useState('');
  const [valorPrevisto, setValorPrevisto] = useState('');

  const formatCurrency = useCallback((value: number) => formatCurrencyUtil(value, moeda), [moeda]);

  const fetchData = useCallback(async () => {
    try {
      const response = await conteudosRelacionamentosApi.listTerceiros(conteudoId);

      setTerceiros(
        response.items.map((item) => ({
          id: item.id,
          servicoId: item.servicoId,
          servicoNome: item.servicoNome,
          valorPrevisto: Number(item.valorPrevisto) || 0,
        })),
      );
      setServicosDisponiveis(response.servicos);
    } catch (error) {
      console.error('Error fetching conteudo terceiros:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar serviÃ§os do conteÃºdo.',
        variant: 'destructive',
      });
    }
  }, [conteudoId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const servicosNaoSelecionados = servicosDisponiveis.filter(
    (servico) => !terceiros.some((item) => item.servicoId === servico.id),
  );

  const handleAdd = async () => {
    if (!selectedServicoId) return;

    const valor = parseFloat(valorPrevisto.replace(',', '.')) || 0;
    const servico = servicosDisponiveis.find((item) => item.id === selectedServicoId);
    if (!servico) return;

    try {
      const inserted = await conteudosRelacionamentosApi.addTerceiro(conteudoId, {
        servicoId: selectedServicoId,
        valorPrevisto: valor,
      });

      setTerceiros((prev) => [
        ...prev,
        {
          id: inserted.id,
          servicoId: inserted.servicoId,
          servicoNome: inserted.servicoNome,
          valorPrevisto: Number(inserted.valorPrevisto) || 0,
        },
      ]);

      setSelectedServicoId('');
      setValorPrevisto('');
      setIsAdding(false);
      toast({ title: 'ServiÃ§o adicionado', description: `${servico.nome} foi adicionado.` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao adicionar serviÃ§o.', variant: 'destructive' });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await conteudosRelacionamentosApi.removeTerceiro(conteudoId, id);
      setTerceiros((prev) => prev.filter((item) => item.id !== id));
      toast({ title: 'ServiÃ§o removido', description: 'O serviÃ§o foi removido.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao remover serviÃ§o.', variant: 'destructive' });
    }
  };

  const handleUpdateValor = async (id: string, novoValor: string) => {
    const valor = parseFloat(novoValor.replace(',', '.')) || 0;

    try {
      const updated = await conteudosRelacionamentosApi.updateTerceiro(conteudoId, id, {
        valorPrevisto: valor,
      });

      setTerceiros((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, valorPrevisto: Number(updated.valorPrevisto) || 0 } : item,
        ),
      );
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao atualizar valor.', variant: 'destructive' });
    }
  };

  const totalPrevisto = useMemo(
    () => terceiros.reduce((accumulator, item) => accumulator + item.valorPrevisto, 0),
    [terceiros],
  );

  return (
    <div className="space-y-6 py-4">
      {!readOnly && (
        <div className="flex justify-end">
          {!isAdding ? (
            <Button onClick={() => setIsAdding(true)} className="gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ServiÃ§o
            </Button>
          ) : (
            <div className="w-full p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>ServiÃ§o</Label>
                  <Select value={selectedServicoId} onValueChange={setSelectedServicoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviÃ§o..." />
                    </SelectTrigger>
                    <SelectContent>
                      {servicosNaoSelecionados.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id}>
                          {servico.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Previsto</Label>
                  <Input
                    type="text"
                    value={valorPrevisto}
                    onChange={(event) => setValorPrevisto(event.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => void handleAdd()}
                    disabled={!selectedServicoId}
                    className="gradient-primary hover:opacity-90"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setSelectedServicoId('');
                      setValorPrevisto('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {terceiros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Nenhum serviÃ§o de terceiro adicionado
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Adicione serviÃ§os de terceiros com valor previsto para este conteÃºdo.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              ServiÃ§os de Terceiros
              <Badge variant="secondary" className="ml-2">
                {terceiros.length} item(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ServiÃ§o</TableHead>
                  <TableHead className="text-right w-[200px]">Valor Previsto</TableHead>
                  {!readOnly && <TableHead className="w-[80px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {terceiros.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.servicoNome}</TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        formatCurrency(item.valorPrevisto)
                      ) : (
                        <Input
                          type="text"
                          className="text-right w-[150px] ml-auto"
                          defaultValue={item.valorPrevisto.toString()}
                          onBlur={(event) => void handleUpdateValor(item.id, event.target.value)}
                        />
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void handleRemove(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalPrevisto)}
                  </TableCell>
                  {!readOnly && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {terceiros.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Previsto com Terceiros</p>
                  <p className="text-sm text-muted-foreground">{terceiros.length} serviÃ§o(s)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalPrevisto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
