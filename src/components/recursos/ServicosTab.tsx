import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fornecedoresRepository } from '@/modules/fornecedores/fornecedores.repository.provider';
import type { FornecedorServico, ServicoOption } from '@/modules/fornecedores/fornecedores.types';

interface ServicosTabProps {
  fornecedorId: string;
  readOnly?: boolean;
}

export const ServicosTab = ({ fornecedorId, readOnly = false }: ServicosTabProps) => {
  const { toast } = useToast();
  const [servicosDisponiveis, setServicosDisponiveis] = useState<ServicoOption[]>([]);
  const [fornecedorServicos, setFornecedorServicos] = useState<FornecedorServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedServicoId, setSelectedServicoId] = useState('');
  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fornecedoresRepository.listServicos(fornecedorId);
      setServicosDisponiveis(response.servicos);
      setFornecedorServicos(response.items);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
      toast({ title: 'Erro', description: 'Erro ao carregar serviços.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fornecedorId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const servicosNaoSelecionados = useMemo(
    () =>
      servicosDisponiveis.filter((s) => !fornecedorServicos.some((fs) => fs.servicoId === s.id)),
    [fornecedorServicos, servicosDisponiveis],
  );

  const handleAdd = async () => {
    if (!selectedServicoId) {
      return;
    }

    const servico = servicosDisponiveis.find((item) => item.id === selectedServicoId);
    if (!servico) {
      return;
    }

    try {
      const response = await fornecedoresRepository.addServico(fornecedorId, servico.id);
      setFornecedorServicos(response.items);
      setServicosDisponiveis(response.servicos);
      setSelectedServicoId('');
      setIsAdding(false);
      toast({ title: 'Sucesso', description: `Serviço "${servico.nome}" adicionado.` });
    } catch (err) {
      console.error('Erro ao adicionar serviço:', err);
      toast({ title: 'Erro', description: 'Erro ao adicionar serviço.', variant: 'destructive' });
    }
  };

  const handleRemove = async (item: FornecedorServico) => {
    if (!confirm('Tem certeza que deseja remover este serviço?')) {
      return;
    }

    try {
      await fornecedoresRepository.removeServico(fornecedorId, item.id);
      setFornecedorServicos((prev) => prev.filter((current) => current.id !== item.id));
      toast({ title: 'Removido', description: `Serviço "${item.nome}" removido.` });
    } catch (err) {
      console.error('Erro ao remover serviço:', err);
      toast({ title: 'Erro', description: 'Erro ao remover serviço.', variant: 'destructive' });
    }
  };

  const handleValorChange = (itemId: string, valor: string) => {
    setValoresEditados((prev) => ({ ...prev, [itemId]: valor }));
  };

  const handleValorBlur = async (itemId: string) => {
    const item = fornecedorServicos.find((current) => current.id === itemId);
    if (!item) {
      return;
    }

    const novoValor = valoresEditados[itemId];
    if (novoValor === undefined) {
      return;
    }

    const valorNumerico = novoValor ? parseFloat(novoValor) : null;

    try {
      const response = await fornecedoresRepository.updateServico(
        fornecedorId,
        item.id,
        valorNumerico,
      );
      setFornecedorServicos(response.items);
      setServicosDisponiveis(response.servicos);
      setValoresEditados((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (err) {
      console.error('Erro ao atualizar valor:', err);
      toast({ title: 'Erro', description: 'Erro ao atualizar valor.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Serviços do Fornecedor</h3>
        {!readOnly && (
          <Button
            onClick={() => setIsAdding(true)}
            disabled={isAdding || servicosNaoSelecionados.length === 0}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Serviço
          </Button>
        )}
      </div>

      {isAdding && !readOnly && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="space-y-1">
            <Select value={selectedServicoId} onValueChange={setSelectedServicoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço..." />
              </SelectTrigger>
              <SelectContent>
                {servicosNaoSelecionados.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm" disabled={!selectedServicoId}>
              Salvar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setSelectedServicoId('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {fornecedorServicos.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right w-40">Valor</TableHead>
              {!readOnly && <TableHead className="w-16"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fornecedorServicos.map((item) => {
              const valorDisplay =
                valoresEditados[item.id] !== undefined
                  ? valoresEditados[item.id]
                  : (item.valor?.toString() ?? '');

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{item.descricao || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 ml-auto text-right"
                      value={valorDisplay}
                      disabled={readOnly}
                      onChange={(e) => handleValorChange(item.id, e.target.value)}
                      onBlur={() => handleValorBlur(item.id)}
                      placeholder="0.00"
                    />
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(item)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum serviço selecionado.</p>
          <p className="text-sm">Adicione os serviços oferecidos por este fornecedor.</p>
        </div>
      )}
    </div>
  );
};
