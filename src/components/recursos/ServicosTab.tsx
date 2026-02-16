import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ServicoParametro {
  id: string;
  nome: string;
  descricao: string | null;
}

interface FornecedorServico {
  id: string;
  servico_id: string;
  nome: string;
  descricao: string | null;
  valor: number | null;
}

interface ServicosTabProps {
  fornecedorId: string;
}

export const ServicosTab = ({ fornecedorId }: ServicosTabProps) => {
  const { toast } = useToast();
  const [servicosDisponiveis, setServicosDisponiveis] = useState<ServicoParametro[]>([]);
  const [fornecedorServicos, setFornecedorServicos] = useState<FornecedorServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedServicoId, setSelectedServicoId] = useState('');
  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [servicosRes, fornServRes] = await Promise.all([
        supabase.from('servicos').select('id, nome, descricao').order('nome'),
        supabase
          .from('fornecedor_servicos')
          .select('id, servico_id, nome, descricao, valor')
          .eq('fornecedor_id', fornecedorId)
          .order('nome'),
      ]);
      if (servicosRes.error) throw servicosRes.error;
      if (fornServRes.error) throw fornServRes.error;
      setServicosDisponiveis(servicosRes.data || []);
      setFornecedorServicos(fornServRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
      toast({ title: 'Erro', description: 'Erro ao carregar serviços.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fornecedorId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const servicosNaoSelecionados = servicosDisponiveis.filter(
    (s) => !fornecedorServicos.some((fs) => fs.servico_id === s.id)
  );

  const handleAdd = async () => {
    if (!selectedServicoId) return;
    const servico = servicosDisponiveis.find((s) => s.id === selectedServicoId);
    if (!servico) return;

    try {
      const { data, error } = await supabase
        .from('fornecedor_servicos')
        .insert({
          fornecedor_id: fornecedorId,
          servico_id: servico.id,
          nome: servico.nome,
          descricao: servico.descricao,
          valor: null,
        })
        .select()
        .single();
      if (error) throw error;
      setFornecedorServicos((prev) => [...prev, data]);
      setSelectedServicoId('');
      setIsAdding(false);
      toast({ title: 'Sucesso', description: `Serviço "${servico.nome}" adicionado.` });
    } catch (err) {
      console.error('Erro ao adicionar serviço:', err);
      toast({ title: 'Erro', description: 'Erro ao adicionar serviço.', variant: 'destructive' });
    }
  };

  const handleRemove = async (fs: FornecedorServico) => {
    if (!confirm('Tem certeza que deseja remover este serviço?')) return;
    try {
      const { error } = await supabase.from('fornecedor_servicos').delete().eq('id', fs.id);
      if (error) throw error;
      setFornecedorServicos((prev) => prev.filter((s) => s.id !== fs.id));
      toast({ title: 'Removido', description: `Serviço "${fs.nome}" removido.` });
    } catch (err) {
      console.error('Erro ao remover serviço:', err);
      toast({ title: 'Erro', description: 'Erro ao remover serviço.', variant: 'destructive' });
    }
  };

  const handleValorChange = (servicoId: string, valor: string) => {
    setValoresEditados((prev) => ({ ...prev, [servicoId]: valor }));
  };

  const handleValorBlur = async (servicoId: string) => {
    const fs = fornecedorServicos.find((s) => s.servico_id === servicoId);
    if (!fs) return;
    const novoValor = valoresEditados[servicoId];
    if (novoValor === undefined) return;
    const valorNumerico = novoValor ? parseFloat(novoValor) : null;

    try {
      const { error } = await supabase.from('fornecedor_servicos').update({ valor: valorNumerico }).eq('id', fs.id);
      if (error) throw error;
      setFornecedorServicos((prev) =>
        prev.map((s) => (s.id === fs.id ? { ...s, valor: valorNumerico } : s))
      );
      setValoresEditados((prev) => { const c = { ...prev }; delete c[servicoId]; return c; });
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
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isAdding || servicosNaoSelecionados.length === 0}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Serviço
        </Button>
      </div>

      {isAdding && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <div className="space-y-1">
            <Select value={selectedServicoId} onValueChange={setSelectedServicoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço..." />
              </SelectTrigger>
              <SelectContent>
                {servicosNaoSelecionados.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm" disabled={!selectedServicoId}>Salvar</Button>
            <Button variant="outline" size="sm" onClick={() => { setIsAdding(false); setSelectedServicoId(''); }}>
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
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fornecedorServicos.map((fs) => {
              const valorDisplay =
                valoresEditados[fs.servico_id] !== undefined
                  ? valoresEditados[fs.servico_id]
                  : fs.valor?.toString() ?? '';
              return (
                <TableRow key={fs.id}>
                  <TableCell className="font-medium">{fs.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{fs.descricao || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 ml-auto text-right"
                      value={valorDisplay}
                      onChange={(e) => handleValorChange(fs.servico_id, e.target.value)}
                      onBlur={() => handleValorBlur(fs.servico_id)}
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(fs)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
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
