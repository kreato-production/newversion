import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  id: string; // id from conteudo_recursos_* table (empty string if not yet added)
  recursoId: string;
  recursoNome: string;
  valorHora: number;
  quantidadeHoras: number;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
  selecionado: boolean;
}

export const ConteudoRecursosTab = ({ conteudoId, tabelaPrecoId, moeda = 'BRL', readOnly = false, tipo }: ConteudoRecursosTabProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<RecursoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const existingMap = new Map((existingData || []).map((e: any) => [e[recursoIdColumn], e as any]));

      const merged: RecursoItem[] = (tpData || []).map((tp: any) => {
        const existing: any = existingMap.get(tp[recursoIdColumn]);
        if (existing) {
          return {
            id: existing.id,
            recursoId: tp[recursoIdColumn],
            recursoNome: nameMap.get(tp[recursoIdColumn]) || 'Desconhecido',
            valorHora: Number(tp.valor_hora),
            quantidadeHoras: Number(existing.quantidade_horas),
            valorTotal: Number(existing.valor_total),
            descontoPercentual: Number(existing.desconto_percentual),
            valorComDesconto: Number(existing.valor_com_desconto),
            selecionado: true,
          };
        }
        return {
          id: '',
          recursoId: tp[recursoIdColumn],
          recursoNome: nameMap.get(tp[recursoIdColumn]) || 'Desconhecido',
          valorHora: Number(tp.valor_hora),
          quantidadeHoras: 0,
          valorTotal: 0,
          descontoPercentual: 0,
          valorComDesconto: 0,
          selecionado: false,
        };
      });

      setItems(merged);
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
      setIsLoading(false);
    }
  }, [tabelaPrecoId, conteudoId]);

  const calcValues = (valorHora: number, horas: number, desconto: number) => {
    const total = valorHora * horas;
    const comDesconto = total - (total * desconto / 100);
    return { valorTotal: total, valorComDesconto: comDesconto };
  };

  const handleToggle = async (index: number) => {
    const item = items[index];
    if (readOnly) return;

    try {
      if (item.selecionado) {
        // Remove
        if (item.id) {
          await (supabase as any).from(tableName).delete().eq('id', item.id);
        }
        const updated = [...items];
        updated[index] = { ...item, id: '', selecionado: false, quantidadeHoras: 0, valorTotal: 0, descontoPercentual: 0, valorComDesconto: 0 };
        setItems(updated);
      } else {
        // Add
        const insertData: any = {
          conteudo_id: conteudoId,
          [recursoIdColumn]: item.recursoId,
          tabela_preco_id: tabelaPrecoId,
          valor_hora: item.valorHora,
          quantidade_horas: 0,
          valor_total: 0,
          desconto_percentual: 0,
          valor_com_desconto: 0,
        };
        const { data: inserted, error } = await (supabase as any).from(tableName).insert(insertData).select().single();
        if (error) throw error;
        const updated = [...items];
        updated[index] = { ...item, id: inserted.id, selecionado: true };
        setItems(updated);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao atualizar recurso', variant: 'destructive' });
    }
  };

  const handleFieldChange = async (index: number, field: 'quantidadeHoras' | 'descontoPercentual', value: number) => {
    const item = items[index];
    if (!item.selecionado || !item.id) return;

    const horas = field === 'quantidadeHoras' ? value : item.quantidadeHoras;
    const desconto = field === 'descontoPercentual' ? value : item.descontoPercentual;
    const { valorTotal, valorComDesconto } = calcValues(item.valorHora, horas, desconto);

    const updated = [...items];
    updated[index] = { ...item, quantidadeHoras: horas, descontoPercentual: desconto, valorTotal, valorComDesconto };
    setItems(updated);

    try {
      await (supabase as any).from(tableName).update({
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

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum {label.toLowerCase()} definido na tabela de preço selecionada.</p>;
  }

  // Totals
  const totalGeral = items.filter(i => i.selecionado).reduce((sum, i) => sum + i.valorTotal, 0);
  const totalComDesconto = items.filter(i => i.selecionado).reduce((sum, i) => sum + i.valorComDesconto, 0);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {!readOnly && <TableHead className="w-10" />}
              <TableHead>{label}</TableHead>
              <TableHead className="w-28 text-right">Valor/Hora</TableHead>
              <TableHead className="w-24 text-right">Qtd. Horas</TableHead>
              <TableHead className="w-32 text-right">Valor Total</TableHead>
              <TableHead className="w-24 text-right">Desconto %</TableHead>
              <TableHead className="w-32 text-right">Valor c/ Desc.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.recursoId} className={!item.selecionado ? 'opacity-50' : ''}>
                {!readOnly && (
                  <TableCell>
                    <Checkbox
                      checked={item.selecionado}
                      onCheckedChange={() => handleToggle(index)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{item.recursoNome}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.valorHora, moeda)}</TableCell>
                <TableCell className="text-right">
                  {item.selecionado && !readOnly ? (
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
                <TableCell className="text-right font-mono">{item.selecionado ? formatCurrency(item.valorTotal, moeda) : '-'}</TableCell>
                <TableCell className="text-right">
                  {item.selecionado && !readOnly ? (
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
                    item.selecionado ? `${item.descontoPercentual}%` : '-'
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">{item.selecionado ? formatCurrency(item.valorComDesconto, moeda) : '-'}</TableCell>
              </TableRow>
            ))}
            {/* Totals row */}
            <TableRow className="bg-muted/50 font-semibold">
              {!readOnly && <TableCell />}
              <TableCell colSpan={3} className="text-right">Totais:</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totalGeral, moeda)}</TableCell>
              <TableCell />
              <TableCell className="text-right font-mono">{formatCurrency(totalComDesconto, moeda)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
