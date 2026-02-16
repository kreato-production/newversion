import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currencies';

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

export const ConteudoRecursosTab = ({ conteudoId, tabelaPrecoId, moeda = 'BRL', readOnly = false, tipo }: ConteudoRecursosTabProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<RecursoItem[]>([]);
  const [availableResources, setAvailableResources] = useState<AvailableResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResourceId, setSelectedResourceId] = useState('');

  const tableName = tipo === 'tecnico' ? 'conteudo_recursos_tecnicos' : 'conteudo_recursos_fisicos';
  const tpTableName = tipo === 'tecnico' ? 'tabela_preco_recursos_tecnicos' : 'tabela_preco_recursos_fisicos';
  const recursoIdColumn = tipo === 'tecnico' ? 'recurso_tecnico_id' : 'recurso_fisico_id';
  const recursoTable = tipo === 'tecnico' ? 'recursos_tecnicos' : 'recursos_fisicos';
  const label = tipo === 'tecnico' ? 'Recurso Técnico' : 'Recurso Físico';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch resources from price table
      const { data: tpData } = await (supabase as any)
        .from(tpTableName)
        .select('*')
        .eq('tabela_preco_id', tabelaPrecoId);

      // Fetch already added resources for this content
      const { data: existingData } = await (supabase as any)
        .from(tableName)
        .select('*')
        .eq('conteudo_id', conteudoId)
        .eq('tabela_preco_id', tabelaPrecoId);

      // Fetch resource names
      const resourceIds = (tpData || []).map((tp: any) => tp[recursoIdColumn]);
      const { data: recursosData } = await supabase
        .from(recursoTable)
        .select('id, nome')
        .in('id', resourceIds.length > 0 ? resourceIds : ['__none__']);

      const nameMap = new Map((recursosData || []).map((r: any) => [r.id, r.nome]));
      const valorHoraMap = new Map((tpData || []).map((tp: any) => [tp[recursoIdColumn], Number(tp.valor_hora)]));

      // Build existing items list
      const existingItems: RecursoItem[] = (existingData || []).map((e: any) => ({
        id: e.id,
        recursoId: e[recursoIdColumn],
        recursoNome: nameMap.get(e[recursoIdColumn]) || 'Desconhecido',
        valorHora: Number(e.valor_hora),
        quantidade: Number(e.quantidade || 1),
        quantidadeHoras: Number(e.quantidade_horas),
        valorTotal: Number(e.valor_total),
        descontoPercentual: Number(e.desconto_percentual),
        valorComDesconto: Number(e.valor_com_desconto),
      }));

      // Build available resources (from price table, excluding already added)
      const addedIds = new Set(existingItems.map(i => i.recursoId));
      const available: AvailableResource[] = (tpData || [])
        .filter((tp: any) => !addedIds.has(tp[recursoIdColumn]))
        .map((tp: any) => ({
          recursoId: tp[recursoIdColumn],
          recursoNome: nameMap.get(tp[recursoIdColumn]) || 'Desconhecido',
          valorHora: Number(tp.valor_hora),
        }));

      setItems(existingItems);
      setAvailableResources(available);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tabelaPrecoId && conteudoId) {
      fetchData();
    } else {
      setItems([]);
      setAvailableResources([]);
      setIsLoading(false);
    }
  }, [tabelaPrecoId, conteudoId]);

  const calcValues = (valorHora: number, quantidade: number, horas: number, desconto: number) => {
    const totalHoras = quantidade * horas;
    const total = valorHora * totalHoras;
    const comDesconto = total - (total * desconto / 100);
    return { valorTotal: total, valorComDesconto: comDesconto };
  };

  const handleAddResource = async () => {
    if (!selectedResourceId || readOnly) return;
    const resource = availableResources.find(r => r.recursoId === selectedResourceId);
    if (!resource) return;

    try {
      const insertData: any = {
        conteudo_id: conteudoId,
        [recursoIdColumn]: resource.recursoId,
        tabela_preco_id: tabelaPrecoId,
        valor_hora: resource.valorHora,
        quantidade: 1,
        quantidade_horas: 0,
        valor_total: 0,
        desconto_percentual: 0,
        valor_com_desconto: 0,
      };
      const { data: inserted, error } = await (supabase as any).from(tableName).insert(insertData).select().single();
      if (error) throw error;

      const newItem: RecursoItem = {
        id: inserted.id,
        recursoId: resource.recursoId,
        recursoNome: resource.recursoNome,
        valorHora: resource.valorHora,
        quantidade: 1,
        quantidadeHoras: 0,
        valorTotal: 0,
        descontoPercentual: 0,
        valorComDesconto: 0,
      };

      setItems(prev => [...prev, newItem]);
      setAvailableResources(prev => prev.filter(r => r.recursoId !== selectedResourceId));
      setSelectedResourceId('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao adicionar recurso', variant: 'destructive' });
    }
  };

  const handleRemove = async (index: number) => {
    const item = items[index];
    if (readOnly || !item.id) return;

    try {
      await (supabase as any).from(tableName).delete().eq('id', item.id);
      setItems(prev => prev.filter((_, i) => i !== index));
      setAvailableResources(prev => [...prev, { recursoId: item.recursoId, recursoNome: item.recursoNome, valorHora: item.valorHora }]);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao remover recurso', variant: 'destructive' });
    }
  };

  const handleFieldChange = async (index: number, field: 'quantidade' | 'quantidadeHoras' | 'descontoPercentual', value: number) => {
    const item = items[index];
    if (!item.id) return;

    const quantidade = field === 'quantidade' ? value : item.quantidade;
    const horas = field === 'quantidadeHoras' ? value : item.quantidadeHoras;
    const desconto = field === 'descontoPercentual' ? value : item.descontoPercentual;
    const { valorTotal, valorComDesconto } = calcValues(item.valorHora, quantidade, horas, desconto);

    const updated = [...items];
    updated[index] = { ...item, quantidade, quantidadeHoras: horas, descontoPercentual: desconto, valorTotal, valorComDesconto };
    setItems(updated);

    try {
      await (supabase as any).from(tableName).update({
        quantidade,
        quantidade_horas: horas,
        desconto_percentual: desconto,
        valor_total: valorTotal,
        valor_com_desconto: valorComDesconto,
      }).eq('id', item.id);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!tabelaPrecoId) {
    return <p className="text-sm text-muted-foreground text-center py-4">Selecione uma Tabela de Preço para visualizar os recursos.</p>;
  }

  const totalGeral = items.reduce((sum, i) => sum + i.valorTotal, 0);
  const totalComDesconto = items.reduce((sum, i) => sum + i.valorComDesconto, 0);

  return (
    <div className="space-y-4">
      {/* Add resource controls */}
      {!readOnly && availableResources.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={`Selecione um ${label.toLowerCase()} para adicionar...`} />
            </SelectTrigger>
            <SelectContent>
              {availableResources.map(r => (
                <SelectItem key={r.recursoId} value={r.recursoId}>{r.recursoNome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={handleAddResource} disabled={!selectedResourceId}>
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
                  <TableCell className="text-right">{formatCurrency(item.valorHora, moeda)}</TableCell>
                  <TableCell className="text-right">
                    {!readOnly ? (
                      <Input
                        type="number"
                        value={item.quantidade || ''}
                        onChange={(e) => handleFieldChange(index, 'quantidade', parseInt(e.target.value) || 0)}
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
                        onChange={(e) => handleFieldChange(index, 'quantidadeHoras', parseFloat(e.target.value) || 0)}
                        className="w-20 text-right h-8 ml-auto"
                        step="0.5"
                        min="0"
                      />
                    ) : (
                      item.quantidadeHoras || '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(item.valorTotal, moeda)}</TableCell>
                  <TableCell className="text-right">
                    {!readOnly ? (
                      <Input
                        type="number"
                        value={item.descontoPercentual || ''}
                        onChange={(e) => handleFieldChange(index, 'descontoPercentual', parseFloat(e.target.value) || 0)}
                        className="w-20 text-right h-8 ml-auto"
                        step="0.5"
                        min="0"
                        max="100"
                      />
                    ) : (
                      `${item.descontoPercentual}%`
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(item.valorComDesconto, moeda)}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={4} className="text-right">Totais:</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(totalGeral, moeda)}</TableCell>
                <TableCell />
                <TableCell className="text-right font-mono">{formatCurrency(totalComDesconto, moeda)}</TableCell>
                {!readOnly && <TableCell />}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
