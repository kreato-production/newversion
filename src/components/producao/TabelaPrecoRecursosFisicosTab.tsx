import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  tabelaPrecoId: string;
  readOnly?: boolean;
}

interface RecursoFisicoOption {
  id: string;
  nome: string;
}

interface TabelaPrecoRF {
  id: string;
  recurso_fisico_id: string;
  valor_hora: number;
  recursoNome?: string;
}

export const TabelaPrecoRecursosFisicosTab = ({ tabelaPrecoId, readOnly }: Props) => {
  const { toast } = useToast();
  const [items, setItems] = useState<TabelaPrecoRF[]>([]);
  const [recursos, setRecursos] = useState<RecursoFisicoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecurso, setSelectedRecurso] = useState('');
  const [valorHora, setValorHora] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: itensData }, { data: recursosData }] = await Promise.all([
        supabase.from('tabela_preco_recursos_fisicos' as any).select('*').eq('tabela_preco_id', tabelaPrecoId),
        supabase.from('recursos_fisicos').select('id, nome').order('nome'),
      ]);

      const rMap = new Map((recursosData || []).map((r: any) => [r.id, r.nome]));
      setItems((itensData || []).map((i: any) => ({ ...i, recursoNome: rMap.get(i.recurso_fisico_id) || 'Desconhecido' })));
      setRecursos(recursosData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tabelaPrecoId]);

  const handleAdd = async () => {
    if (!selectedRecurso || !valorHora) return;
    try {
      const { error } = await supabase.from('tabela_preco_recursos_fisicos' as any).insert({
        tabela_preco_id: tabelaPrecoId,
        recurso_fisico_id: selectedRecurso,
        valor_hora: parseFloat(valorHora),
      });
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Recurso físico adicionado!' });
      setSelectedRecurso('');
      setValorHora('');
      await fetchData();
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao adicionar recurso físico', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('tabela_preco_recursos_fisicos' as any).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao remover', variant: 'destructive' });
    }
  };

  const availableRecursos = recursos.filter(r => !items.some(i => i.recurso_fisico_id === r.id));

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={selectedRecurso} onValueChange={setSelectedRecurso}>
              <SelectTrigger><SelectValue placeholder="Selecione um recurso físico" /></SelectTrigger>
              <SelectContent>
                {availableRecursos.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Input type="number" placeholder="Valor/Hora" value={valorHora} onChange={(e) => setValorHora(e.target.value)} step="0.01" min="0" />
          </div>
          <Button type="button" size="sm" onClick={handleAdd} disabled={!selectedRecurso || !valorHora}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum recurso físico adicionado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recurso Físico</TableHead>
              <TableHead className="w-32">Valor/Hora</TableHead>
              {!readOnly && <TableHead className="w-16" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.recursoNome}</TableCell>
                <TableCell>{Number(item.valor_hora).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
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
