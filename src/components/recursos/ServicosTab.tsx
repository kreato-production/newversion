import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { supabase } from '@/integrations/supabase/client';

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number | null;
}

interface ServicosTabProps {
  fornecedorId: string;
}

export const ServicosTab = ({ fornecedorId }: ServicosTabProps) => {
  const { toast } = useToast();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [novoServico, setNovoServico] = useState({ nome: '', descricao: '', valor: '' });

  const fetchServicos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fornecedor_servicos')
        .select('id, nome, descricao, valor')
        .eq('fornecedor_id', fornecedorId)
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
      toast({ title: 'Erro', description: 'Erro ao carregar serviços.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fornecedorId, toast]);

  useEffect(() => {
    fetchServicos();
  }, [fetchServicos]);

  const handleAdd = async () => {
    if (!novoServico.nome.trim()) {
      toast({ title: 'Atenção', description: 'Nome do serviço é obrigatório.', variant: 'destructive' });
      return;
    }

    try {
      const { data: insertedData, error } = await supabase
        .from('fornecedor_servicos')
        .insert({
          fornecedor_id: fornecedorId,
          nome: novoServico.nome.trim(),
          descricao: novoServico.descricao.trim() || null,
          valor: novoServico.valor ? parseFloat(novoServico.valor) : null,
        })
        .select()
        .single();

      if (error) throw error;

      setServicos([...servicos, insertedData]);
      setNovoServico({ nome: '', descricao: '', valor: '' });
      setIsAdding(false);
      toast({ title: 'Sucesso', description: 'Serviço adicionado com sucesso!' });
    } catch (err) {
      console.error('Erro ao adicionar serviço:', err);
      toast({ title: 'Erro', description: 'Erro ao adicionar serviço.', variant: 'destructive' });
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este serviço?')) return;

    try {
      const { error } = await supabase
        .from('fornecedor_servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServicos(servicos.filter((s) => s.id !== id));
      toast({ title: 'Removido', description: 'Serviço removido com sucesso!' });
    } catch (err) {
      console.error('Erro ao remover serviço:', err);
      toast({ title: 'Erro', description: 'Erro ao remover serviço.', variant: 'destructive' });
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
        <Button onClick={() => setIsAdding(true)} disabled={isAdding} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Serviço
        </Button>
      </div>

      {isAdding && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Nome do Serviço *</Label>
              <Input
                value={novoServico.nome}
                onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                placeholder="Ex: Transporte de Equipamentos"
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                value={novoServico.descricao}
                onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoServico.valor}
                onChange={(e) => setNovoServico({ ...novoServico, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm">
              Salvar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNovoServico({ nome: '', descricao: '', valor: '' });
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {servicos.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.map((servico) => (
              <TableRow key={servico.id}>
                <TableCell className="font-medium">{servico.nome}</TableCell>
                <TableCell className="text-muted-foreground">{servico.descricao || '-'}</TableCell>
                <TableCell className="text-right">{formatCurrency(servico.valor)}</TableCell>
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
          <p>Nenhum serviço cadastrado.</p>
          <p className="text-sm">Adicione serviços oferecidos por este fornecedor.</p>
        </div>
      )}
    </div>
  );
};
